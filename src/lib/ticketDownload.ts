const COLORS = {
  violet: '#7c3aed',
  violetDark: '#5b21b6',
  orange: '#f97316',
  orangeSoft: '#fff7ed',
  ink: '#1e1b4b',
  muted: '#6b7280',
  border: '#ede9fe',
  soft: '#f5f3ff',
  white: '#ffffff',
}

const FONT = 'Inter, -apple-system, "Segoe UI", Roboto, sans-serif'
const MONO = 'Menlo, Consolas, "Courier New", monospace'

const TICKET_WIDTH = 1000
const TICKET_HEIGHT = 440
const HEADER_HEIGHT = 76
const STUB_X = 660
const PADDING = 32
const SCALE = 2
const FONT_WAIT_MS = 2000

const PDF_PAGE_WIDTH = 210
const PDF_PAGE_HEIGHT = 297
const PDF_MARGIN = 12
const PDF_GAP = 6

const DEFAULT_TICKET_LOGO = '/Paec-Logo.png'

export type TicketImageData = {
  activityName: string
  ticketTypeName: string
  ticketNumber: string
  qrCode: string | null
  visitDateLabel: string
  location: string
  orderNumber: string
  holder: string
  /** Activity logo URL; falls back to PAEC brand mark when missing. */
  logoUrl?: string | null
}

export type TicketImageSource = {
  ticket: TicketImageData
  qrSvg: SVGSVGElement | null
}

export type GroupPassData = {
  activityName: string
  qrCode: string
  ticketCount: number
  /** e.g. "3 × General Admission · 3 × Flash Sale" */
  breakdown: string
  visitDateLabel: string
  location: string
  orderNumber: string
  holder: string
  logoUrl?: string | null
}

export type GroupPassSource = {
  pass: GroupPassData
  qrSvg: SVGSVGElement | null
}

type PassField = { label: string; value: string; mono?: boolean }

type PassContent = {
  headerLabel: string
  title: string
  pill: string
  /** Two-column rows, then one full-width row. */
  fields: [PassField, PassField, PassField, PassField, PassField]
  qrCode: string | null
  qrCaption: string
  pillTone: 'orange' | 'violet'
}

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    if (crossOrigin) {
      // Required so canvas export is not tainted by remote activity logos.
      image.crossOrigin = 'anonymous'
    }
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    image.src = src
  })
}

/**
 * Prefer same-origin `/storage/...` so Vite's proxy (or same-host deploy)
 * keeps the canvas untainted without needing CORS on the API.
 */
function toCanvasSafeImageUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.pathname.startsWith('/storage/')) {
      return `${parsed.pathname}${parsed.search}`
    }
  } catch {
    // keep original
  }
  return url
}

async function loadTicketLogo(logoUrl?: string | null): Promise<HTMLImageElement | null> {
  const candidates = [logoUrl?.trim(), DEFAULT_TICKET_LOGO].filter(
    (value): value is string => !!value,
  )

  for (const raw of candidates) {
    const src = toCanvasSafeImageUrl(raw)
    const isRemote = /^https?:\/\//i.test(src)
    const isApiProxy = src.startsWith('/api/')

    // Prefer fetch→blob so Spaces/CDN URLs and /api logo streams stay untainted.
    if (isRemote || isApiProxy) {
      try {
        const response = await fetch(src, { mode: 'cors', credentials: 'omit' })
        if (response.ok) {
          const blob = await response.blob()
          if (blob.size > 0 && blob.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(blob)
            try {
              return await loadImage(objectUrl, false)
            } finally {
              URL.revokeObjectURL(objectUrl)
            }
          }
        }
      } catch {
        // fall through to <img> load
      }
    }

    try {
      return await loadImage(src, isRemote)
    } catch {
      // try next candidate
    }
  }

  return null
}

function svgToImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const markup = new XMLSerializer().serializeToString(clone)
  return loadImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`,
  )
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (ctx.measureText(text).width <= maxWidth) return text

  let trimmed = text
  while (
    trimmed.length > 1 &&
    ctx.measureText(`${trimmed}…`).width > maxWidth
  ) {
    trimmed = trimmed.slice(0, -1)
  }
  return `${trimmed.trimEnd()}…`
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): Array<string> {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: Array<string> = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }
  if (current && lines.length < maxLines) lines.push(current)

  const consumed = lines.join(' ').length
  if (consumed < text.trim().length) {
    lines[lines.length - 1] = fitText(
      ctx,
      `${lines[lines.length - 1]}…`,
      maxWidth,
    )
  }

  return lines.map((line) => fitText(ctx, line, maxWidth))
}

function drawField(
  ctx: CanvasRenderingContext2D,
  field: PassField,
  x: number,
  y: number,
  width: number,
) {
  ctx.fillStyle = COLORS.muted
  ctx.font = `700 12px ${FONT}`
  ctx.fillText(field.label.toUpperCase(), x, y)

  ctx.fillStyle = COLORS.ink
  ctx.font = field.mono ? `600 16px ${MONO}` : `600 17px ${FONT}`
  ctx.fillText(fitText(ctx, field.value, width), x, y + 24)
}

function drawPass(
  ctx: CanvasRenderingContext2D,
  pass: PassContent,
  qrImage: HTMLImageElement | null,
  logo: HTMLImageElement | null,
  originX: number,
  originY: number,
  background: string,
) {
  const x = originX
  const y = originY
  const width = TICKET_WIDTH
  const height = TICKET_HEIGHT

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, 24)
  ctx.fillStyle = COLORS.white
  ctx.fill()
  ctx.clip()

  ctx.fillStyle = COLORS.soft
  ctx.fillRect(x + STUB_X, y, width - STUB_X, height)

  const band = ctx.createLinearGradient(x, y, x + width, y)
  band.addColorStop(0, COLORS.violet)
  band.addColorStop(1, COLORS.violetDark)
  ctx.fillStyle = band
  ctx.fillRect(x, y, width, HEADER_HEIGHT)
  ctx.restore()

  ctx.beginPath()
  ctx.roundRect(x, y, width, height, 24)
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 2
  ctx.stroke()

  if (logo) {
    const logoHeight = 40
    const logoWidth = (logo.width / logo.height) * logoHeight
    ctx.beginPath()
    ctx.roundRect(x + PADDING - 10, y + 14, logoWidth + 20, logoHeight + 8, 12)
    ctx.fillStyle = COLORS.white
    ctx.fill()
    ctx.drawImage(logo, x + PADDING, y + 18, logoWidth, logoHeight)
  } else {
    ctx.fillStyle = COLORS.white
    ctx.font = `800 26px ${FONT}`
    ctx.fillText('PAEC', x + PADDING, y + 48)
  }

  ctx.fillStyle = COLORS.white
  ctx.textAlign = 'right'
  ctx.font = `800 15px ${FONT}`
  ctx.fillText(pass.headerLabel, x + width - PADDING, y + 45)
  ctx.textAlign = 'left'

  const bodyX = x + 40
  const bodyWidth = STUB_X - 80

  ctx.fillStyle = COLORS.ink
  ctx.font = `800 28px ${FONT}`
  const titleLines = wrapText(ctx, pass.title, bodyWidth, 2)
  titleLines.forEach((line, index) => {
    ctx.fillText(line, bodyX, y + 122 + index * 34)
  })

  const pillY = y + 122 + titleLines.length * 34 - 10
  ctx.font = `800 13px ${FONT}`
  const pillText = fitText(ctx, pass.pill.toUpperCase(), bodyWidth - 24)
  const pillWidth = ctx.measureText(pillText).width + 24
  ctx.beginPath()
  ctx.roundRect(bodyX, pillY, pillWidth, 28, 8)
  ctx.fillStyle = pass.pillTone === 'violet' ? COLORS.soft : COLORS.orangeSoft
  ctx.fill()
  ctx.strokeStyle = pass.pillTone === 'violet' ? '#ddd6fe' : '#fed7aa'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = pass.pillTone === 'violet' ? COLORS.violet : COLORS.orange
  ctx.fillText(pillText, bodyX + 12, pillY + 19)

  const columnWidth = (bodyWidth - 24) / 2
  const secondColumnX = bodyX + columnWidth + 24
  const rowsY = y + 262
  const [first, second, third, fourth, fullWidth] = pass.fields
  drawField(ctx, first, bodyX, rowsY, columnWidth)
  drawField(ctx, second, secondColumnX, rowsY, columnWidth)
  drawField(ctx, third, bodyX, rowsY + 62, columnWidth)
  drawField(ctx, fourth, secondColumnX, rowsY + 62, columnWidth)
  drawField(ctx, fullWidth, bodyX, rowsY + 124, bodyWidth)

  const perforationX = x + STUB_X
  ctx.save()
  ctx.setLineDash([10, 8])
  ctx.strokeStyle = '#ddd6fe'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(perforationX, y + HEADER_HEIGHT + 20)
  ctx.lineTo(perforationX, y + height - 20)
  ctx.stroke()
  ctx.restore()

  for (const notchY of [y, y + height]) {
    ctx.beginPath()
    ctx.arc(perforationX, notchY, 16, 0, Math.PI * 2)
    ctx.fillStyle = background
    ctx.fill()
  }

  const stubCenter = perforationX + (width - STUB_X) / 2
  const qrBox = 232
  const qrBoxX = stubCenter - qrBox / 2
  const qrBoxY = y + HEADER_HEIGHT + 30

  ctx.beginPath()
  ctx.roundRect(qrBoxX, qrBoxY, qrBox, qrBox, 16)
  ctx.fillStyle = COLORS.white
  ctx.fill()
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.textAlign = 'center'
  if (qrImage) {
    ctx.drawImage(qrImage, qrBoxX + 16, qrBoxY + 16, qrBox - 32, qrBox - 32)
  } else {
    ctx.fillStyle = COLORS.muted
    ctx.font = `600 15px ${FONT}`
    ctx.fillText('QR code pending', stubCenter, qrBoxY + qrBox / 2)
  }

  if (pass.qrCode) {
    ctx.fillStyle = COLORS.violet
    ctx.font = `700 13px ${MONO}`
    ctx.fillText(
      fitText(ctx, pass.qrCode, width - STUB_X - 40),
      stubCenter,
      qrBoxY + qrBox + 30,
    )
  }
  ctx.fillStyle = COLORS.muted
  ctx.font = `500 12px ${FONT}`
  ctx.fillText(
    fitText(ctx, pass.qrCaption, width - STUB_X - 40),
    stubCenter,
    qrBoxY + qrBox + 54,
  )
  ctx.textAlign = 'left'
}

function ticketPass(ticket: TicketImageData): PassContent {
  return {
    headerLabel: 'E-TICKET  ·  ADMIT ONE',
    title: ticket.activityName,
    pill: ticket.ticketTypeName,
    pillTone: 'orange',
    fields: [
      { label: 'Date of Visit', value: ticket.visitDateLabel },
      { label: 'Location', value: ticket.location },
      { label: 'Order Number', value: ticket.orderNumber, mono: true },
      { label: 'Ticket Number', value: ticket.ticketNumber, mono: true },
      { label: 'Ticket Holder', value: ticket.holder },
    ],
    qrCode: ticket.qrCode,
    qrCaption: 'Present this QR code at the entrance',
  }
}

function groupPass(pass: GroupPassData): PassContent {
  const admits = `${pass.ticketCount} ticket${pass.ticketCount !== 1 ? 's' : ''}`
  return {
    headerLabel: `GROUP PASS  ·  ADMITS ${pass.ticketCount}`,
    title: pass.activityName,
    pill: 'Order QR · Scan once for everyone',
    pillTone: 'violet',
    fields: [
      { label: 'Date of Visit', value: pass.visitDateLabel },
      { label: 'Location', value: pass.location },
      { label: 'Order Number', value: pass.orderNumber, mono: true },
      { label: 'Ticket Holder', value: pass.holder },
      { label: `Includes ${admits}`, value: pass.breakdown },
    ],
    qrCode: pass.qrCode,
    qrCaption: `Scan once to admit all ${admits}`,
  }
}

async function loadAssets(
  svgs: Array<SVGSVGElement | null>,
  logoUrl?: string | null,
) {
  // A web font that never settles would otherwise block the download forever.
  await Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS)),
  ])

  const [logo, ...qrImages] = await Promise.all([
    loadTicketLogo(logoUrl),
    ...svgs.map((svg) => (svg ? svgToImage(svg).catch(() => null) : null)),
  ])
  return { logo, qrImages }
}

function createCanvas(width: number, height: number, background: string) {
  const canvas = document.createElement('canvas')
  canvas.width = width * SCALE
  canvas.height = height * SCALE

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported in this browser.')
  ctx.scale(SCALE, SCALE)

  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  return { canvas, ctx }
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '')
}

/**
 * One A4 PDF: the group pass first (when given), then every ticket, three passes per page.
 */
export async function downloadTicketsPdf(
  sources: Array<TicketImageSource>,
  group: GroupPassSource | null,
  name: string,
): Promise<void> {
  if (sources.length === 0) return

  const logoUrl =
    sources.find((source) => source.ticket.logoUrl)?.ticket.logoUrl ??
    group?.pass.logoUrl ??
    null

  await savePassesPdf(
    [
      ...(group
        ? [{ content: groupPass(group.pass), qrSvg: group.qrSvg }]
        : []),
      ...sources.map((source) => ({
        content: ticketPass(source.ticket),
        qrSvg: source.qrSvg,
      })),
    ],
    name,
    logoUrl,
  )
}

export async function downloadGroupPassPdf(
  source: GroupPassSource,
  name: string,
): Promise<void> {
  await savePassesPdf(
    [{ content: groupPass(source.pass), qrSvg: source.qrSvg }],
    name,
    source.pass.logoUrl,
  )
}

async function savePassesPdf(
  passes: Array<{ content: PassContent; qrSvg: SVGSVGElement | null }>,
  name: string,
  logoUrl?: string | null,
): Promise<void> {
  const [{ jsPDF }, { logo, qrImages }] = await Promise.all([
    import('jspdf'),
    loadAssets(
      passes.map((pass) => pass.qrSvg),
      logoUrl,
    ),
  ])

  const bleed = 2
  const canvasWidth = TICKET_WIDTH + bleed * 2
  const canvasHeight = TICKET_HEIGHT + bleed * 2
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const imageWidth = PDF_PAGE_WIDTH - PDF_MARGIN * 2
  const imageHeight = (imageWidth * canvasHeight) / canvasWidth
  let cursorY = PDF_MARGIN

  passes.forEach((pass, index) => {
    const { canvas, ctx } = createCanvas(
      canvasWidth,
      canvasHeight,
      COLORS.white,
    )
    drawPass(
      ctx,
      pass.content,
      qrImages[index] ?? null,
      logo,
      bleed,
      bleed,
      COLORS.white,
    )

    if (index > 0 && cursorY + imageHeight > PDF_PAGE_HEIGHT - PDF_MARGIN) {
      pdf.addPage()
      cursorY = PDF_MARGIN
    }
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.92),
      'JPEG',
      PDF_MARGIN,
      cursorY,
      imageWidth,
      imageHeight,
    )
    cursorY += imageHeight + PDF_GAP
  })

  saveBlob(pdf.output('blob'), `PAEC-${safeFilename(name) || 'tickets'}.pdf`)
}
