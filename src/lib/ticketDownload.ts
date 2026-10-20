import { cleanTermsText } from '@/lib/termsText'

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

const GIFT_WIDTH = 1000
const GIFT_HEIGHT = 1414

export const DEFAULT_GIFT_CERTIFICATE_TERMS = [
  'Gift certificate tickets are valid for the activity and visit date shown on this ticket.',
  'Present the QR code at the entrance for admission.',
  'Lost or duplicated tickets may be voided.',
  'The organizer reserves the right to refuse entry for safety or policy reasons.',
].join('\n')

const DEFAULT_TICKET_LOGO = '/Paec-Logo.png'

export type TicketKind = 'regular' | 'gift_certificate'

export type TicketImageData = {
  activityName: string
  ticketTypeName: string
  ticketKind?: TicketKind
  /** Printed on the ticket; gift certificates fall back to the standard gift terms. */
  termsAndConditions?: string | null
  ticketNumber: string
  qrCode: string | null
  visitDateLabel: string
  location: string
  orderNumber: string
  holder: string
  /** Formatted price shown on gift certificates, e.g. "₱599.00". */
  priceLabel?: string | null
  /** e.g. "1 of 3" on gift certificates. */
  positionLabel?: string | null
  /** Activity poster used on the gift certificate design. */
  imageUrl?: string | null
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
  /** When every ticket in the order is a gift certificate, the group pass uses the gift certificate design. */
  ticketKind?: TicketKind
  /** Ticket type name shown on the gift design, e.g. "Gift Certificate - 101". */
  ticketTypeName?: string | null
  termsAndConditions?: string | null
  /** Formatted total price shown on the gift design. */
  priceLabel?: string | null
  /** Activity poster used on the gift certificate design. */
  imageUrl?: string | null
}

export type GroupPassSource = {
  pass: GroupPassData
  qrSvg: SVGSVGElement | null
}

type PassField = { label: string; value: string; mono?: boolean }

type PassContent = {
  kind: 'regular' | 'gift_certificate' | 'terms'
  headerLabel: string
  title: string
  pill: string
  /** Two-column rows, then one full-width row. */
  fields: [PassField, PassField, PassField, PassField, PassField]
  qrCode: string | null
  qrCaption: string
  pillTone: 'orange' | 'violet'
  terms?: string | null
  priceLabel?: string | null
  positionLabel?: string | null
  imageUrl?: string | null
  /** Gift design footer line; group passes override the single-ticket wording. */
  giftFooter?: string | null
  /** Gift design closing line under the terms box. */
  giftClosing?: string | null
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

/** Wraps every paragraph without dropping text (used for terms panels). */
function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): Array<string> {
  const lines: Array<string> = []
  for (const paragraph of text.split('\n')) {
    const trimmed = paragraph.trim()
    if (!trimmed) {
      lines.push('')
      continue
    }
    let current = ''
    for (const word of trimmed.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate
        continue
      }
      lines.push(current)
      current = word
    }
    if (current) lines.push(current)
  }
  return lines
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
  ctx.restore()
}

async function loadOptionalImage(
  url?: string | null,
): Promise<HTMLImageElement | null> {
  const raw = url?.trim()
  if (!raw) return null
  const src = toCanvasSafeImageUrl(raw)
  const isRemote = /^https?:\/\//i.test(src)
  if (isRemote || src.startsWith('/api/')) {
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
    return null
  }
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
  if (pass.kind === 'terms') {
    drawTermsPass(ctx, pass, logo, originX, originY)
    return
  }

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

function drawTermsPass(
  ctx: CanvasRenderingContext2D,
  pass: PassContent,
  logo: HTMLImageElement | null,
  originX: number,
  originY: number,
) {
  const x = originX
  const y = originY

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, TICKET_WIDTH, TICKET_HEIGHT, 24)
  ctx.fillStyle = COLORS.white
  ctx.fill()
  ctx.clip()
  const band = ctx.createLinearGradient(x, y, x + TICKET_WIDTH, y)
  band.addColorStop(0, COLORS.violet)
  band.addColorStop(1, COLORS.violetDark)
  ctx.fillStyle = band
  ctx.fillRect(x, y, TICKET_WIDTH, HEADER_HEIGHT)
  ctx.restore()

  ctx.beginPath()
  ctx.roundRect(x, y, TICKET_WIDTH, TICKET_HEIGHT, 24)
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
  }

  ctx.fillStyle = COLORS.white
  ctx.textAlign = 'right'
  ctx.font = `800 15px ${FONT}`
  ctx.fillText('TERMS AND CONDITIONS', x + TICKET_WIDTH - PADDING, y + 45)
  ctx.textAlign = 'left'

  ctx.fillStyle = COLORS.orange
  ctx.font = `800 20px ${FONT}`
  ctx.fillText(fitText(ctx, pass.pill, TICKET_WIDTH - PADDING * 2), x + PADDING, y + 118)

  ctx.fillStyle = COLORS.ink
  ctx.font = `500 16px ${FONT}`
  const lines = wrapTextLines(ctx, cleanTermsText(pass.terms), TICKET_WIDTH - PADDING * 2)
  lines.slice(0, 11).forEach((line, index) => {
    ctx.fillText(line, x + PADDING, y + 152 + index * 24)
  })
  if (lines.length > 11) {
    ctx.fillText('…', x + PADDING, y + 152 + 11 * 24)
  }

  ctx.fillStyle = COLORS.muted
  ctx.font = `600 12px ${MONO}`
  ctx.fillText(
    fitText(ctx, pass.qrCode ?? '', TICKET_WIDTH - PADDING * 2),
    x + PADDING,
    y + TICKET_HEIGHT - 18,
  )
}

function drawGiftPass(
  ctx: CanvasRenderingContext2D,
  pass: PassContent,
  qrImage: HTMLImageElement | null,
  logo: HTMLImageElement | null,
  paecLogo: HTMLImageElement | null,
  poster: HTMLImageElement | null,
  originX: number,
  originY: number,
) {
  const x = originX
  const y = originY
  const margin = 26
  const leftX = x + margin
  const leftWidth = 548
  const rightX = leftX + leftWidth + 18
  const rightWidth = GIFT_WIDTH - margin * 2 - leftWidth - 18
  const topY = y + margin
  const mainHeight = 1092

  ctx.fillStyle = COLORS.white
  ctx.fillRect(x, y, GIFT_WIDTH, GIFT_HEIGHT)
  ctx.beginPath()
  ctx.roundRect(x + 4, y + 4, GIFT_WIDTH - 8, GIFT_HEIGHT - 8, 20)
  ctx.strokeStyle = COLORS.violet
  ctx.lineWidth = 3
  ctx.stroke()

  // Left: ticket stub
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(leftX, topY, leftWidth, mainHeight, 16)
  ctx.fillStyle = COLORS.white
  ctx.fill()
  ctx.clip()
  ctx.strokeStyle = COLORS.violet

  const centreX = leftX + leftWidth / 2
  ctx.textAlign = 'center'

  if (logo) {
    const logoHeight = 58
    const logoWidth = Math.min(230, (logo.width / logo.height) * logoHeight)
    ctx.drawImage(logo, centreX - logoWidth / 2, topY + 22, logoWidth, logoHeight)
  } else {
    ctx.fillStyle = COLORS.violet
    ctx.font = `800 30px ${FONT}`
    ctx.fillText('PAEC', centreX, topY + 62)
  }

  ctx.fillStyle = COLORS.orange
  ctx.font = `800 16px ${FONT}`
  ctx.fillText(
    fitText(ctx, pass.headerLabel, leftWidth - 60),
    centreX,
    topY + 108,
  )

  ctx.save()
  ctx.setLineDash([8, 7])
  ctx.strokeStyle = '#c4b5fd'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(leftX + 18, topY + 128)
  ctx.lineTo(leftX + leftWidth - 18, topY + 128)
  ctx.stroke()
  ctx.restore()

  const qrBox = 272
  const qrBoxX = centreX - qrBox / 2
  const qrBoxY = topY + 148
  ctx.beginPath()
  ctx.roundRect(qrBoxX, qrBoxY, qrBox, qrBox, 14)
  ctx.fillStyle = COLORS.white
  ctx.fill()
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 2
  ctx.stroke()
  if (qrImage) {
    ctx.drawImage(qrImage, qrBoxX + 14, qrBoxY + 14, qrBox - 28, qrBox - 28)
  } else {
    ctx.fillStyle = COLORS.muted
    ctx.font = `600 16px ${FONT}`
    ctx.fillText('QR code pending', centreX, qrBoxY + qrBox / 2)
  }

  ctx.fillStyle = COLORS.ink
  ctx.font = `700 19px ${MONO}`
  ctx.fillText(fitText(ctx, pass.fields[3].value, leftWidth - 60), centreX, qrBoxY + qrBox + 34)

  ctx.fillStyle = COLORS.orange
  ctx.font = `800 14px ${FONT}`
  ctx.fillText('PAEC', centreX, qrBoxY + qrBox + 76)

  ctx.fillStyle = COLORS.ink
  ctx.font = `800 31px ${FONT}`
  const titleLines = wrapText(ctx, pass.title, leftWidth - 70, 2)
  titleLines.forEach((line, index) => {
    ctx.fillText(line, centreX, qrBoxY + qrBox + 116 + index * 36)
  })

  const afterTitleY = qrBoxY + qrBox + 116 + titleLines.length * 36 + 6
  ctx.fillStyle = COLORS.violet
  ctx.font = `700 21px ${FONT}`
  ctx.fillText(fitText(ctx, pass.fields[0].value, leftWidth - 70), centreX, afterTitleY)
  ctx.fillStyle = '#374151'
  ctx.font = `600 18px ${FONT}`
  wrapText(ctx, pass.fields[1].value, leftWidth - 90, 2).forEach((line, index) => {
    ctx.fillText(line, centreX, afterTitleY + 30 + index * 24)
  })

  // Details box
  const boxX = leftX + 34
  const boxWidth = leftWidth - 68
  const boxY = afterTitleY + 92
  const boxHeight = 218
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 12)
  ctx.fillStyle = COLORS.soft
  ctx.fill()

  ctx.fillStyle = COLORS.violet
  ctx.font = `700 12px ${FONT}`
  ctx.fillText('TICKET TYPE', centreX, boxY + 30)
  ctx.fillStyle = COLORS.violet
  ctx.font = `800 23px ${FONT}`
  ctx.fillText(fitText(ctx, pass.pill, boxWidth - 32), centreX, boxY + 62)
  ctx.fillStyle = COLORS.orange
  ctx.font = `700 14px ${FONT}`
  ctx.fillText(
    fitText(ctx, `Section: ${pass.pill}`, boxWidth - 32),
    centreX,
    boxY + 88,
  )

  const colLeft = boxX + 26
  const colRight = boxX + boxWidth / 2 + 10
  const gridY = boxY + 126
  ctx.textAlign = 'left'
  drawField(ctx, pass.fields[4], colLeft, gridY, boxWidth / 2 - 40)
  drawField(
    ctx,
    { label: 'Price', value: pass.priceLabel ?? '—' },
    colRight,
    gridY,
    boxWidth / 2 - 40,
  )
  drawField(ctx, pass.fields[2], colLeft, gridY + 56, boxWidth / 2 - 40)
  drawField(
    ctx,
    { label: 'Ticket count', value: pass.positionLabel ?? '1 of 1' },
    colRight,
    gridY + 56,
    boxWidth / 2 - 40,
  )
  ctx.textAlign = 'center'

  // Small QR repeat
  const smallQr = 118
  const smallQrY = boxY + boxHeight + 26
  ctx.beginPath()
  ctx.roundRect(centreX - smallQr / 2, smallQrY, smallQr, smallQr, 10)
  ctx.fillStyle = COLORS.white
  ctx.fill()
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 2
  ctx.stroke()
  if (qrImage) {
    ctx.drawImage(qrImage, centreX - smallQr / 2 + 8, smallQrY + 8, smallQr - 16, smallQr - 16)
  }
  if (pass.qrCode) {
    ctx.fillStyle = COLORS.violet
    ctx.font = `600 14px ${MONO}`
    ctx.fillText(fitText(ctx, pass.qrCode, leftWidth - 70), centreX, smallQrY + smallQr + 26)
  }

  ctx.fillStyle = COLORS.violet
  ctx.fillRect(leftX, topY + mainHeight - 56, leftWidth, 56)
  ctx.fillStyle = COLORS.white
  ctx.font = `700 16px ${FONT}`
  ctx.fillText(
    fitText(
      ctx,
      pass.giftFooter ??
        'This is your gift certificate ticket. Do not duplicate.',
      leftWidth - 32,
    ),
    centreX,
    topY + mainHeight - 21,
  )
  ctx.restore()

  ctx.beginPath()
  ctx.roundRect(leftX, topY, leftWidth, mainHeight, 16)
  ctx.strokeStyle = COLORS.violet
  ctx.lineWidth = 3
  ctx.stroke()

  // Right: poster
  const posterHeight = 548
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(rightX, topY, rightWidth, posterHeight, 14)
  ctx.fillStyle = COLORS.soft
  ctx.fill()
  ctx.clip()
  if (poster) {
    drawImageCover(ctx, poster, rightX, topY, rightWidth, posterHeight)
  } else {
    ctx.fillStyle = COLORS.violet
    ctx.font = `800 24px ${FONT}`
    ctx.textAlign = 'center'
    wrapText(ctx, pass.title, rightWidth - 40, 3).forEach((line, index) => {
      ctx.fillText(line, rightX + rightWidth / 2, topY + posterHeight / 2 - 20 + index * 30)
    })
    ctx.fillStyle = COLORS.orange
    ctx.font = `800 15px ${FONT}`
    ctx.fillText('GIFT CERTIFICATE', rightX + rightWidth / 2, topY + posterHeight / 2 + 52)
  }
  ctx.restore()
  ctx.beginPath()
  ctx.roundRect(rightX, topY, rightWidth, posterHeight, 14)
  ctx.strokeStyle = COLORS.violet
  ctx.lineWidth = 3
  ctx.stroke()

  // Right: terms
  const termsY = topY + posterHeight + 18
  const termsHeight = mainHeight - posterHeight - 18
  ctx.beginPath()
  ctx.roundRect(rightX, termsY, rightWidth, termsHeight, 14)
  ctx.fillStyle = COLORS.orangeSoft
  ctx.fill()
  ctx.strokeStyle = COLORS.orange
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#c2410c'
  ctx.font = `800 19px ${FONT}`
  ctx.textAlign = 'left'
  ctx.fillText('TERMS AND CONDITIONS', rightX + 20, termsY + 38)

  // Fit the whole terms text inside the box: shrink the font before truncating.
  const termsText = cleanTermsText(pass.terms) || DEFAULT_GIFT_CERTIFICATE_TERMS
  let termsLines: Array<string> = []
  let termsFontSize = 16.5
  for (const size of [16.5, 14, 12, 10.5]) {
    termsFontSize = size
    ctx.font = `500 ${size}px ${FONT}`
    termsLines = wrapTextLines(ctx, termsText, rightWidth - 40)
    const lineHeight = size * 1.45
    if (termsLines.length * lineHeight <= termsHeight - 108) break
  }
  const lineHeight = termsFontSize * 1.45
  const maxTermsLines = Math.floor((termsHeight - 108) / lineHeight)
  ctx.fillStyle = COLORS.ink
  ctx.font = `500 ${termsFontSize}px ${FONT}`
  termsLines.slice(0, maxTermsLines).forEach((line, index) => {
    ctx.fillText(line, rightX + 20, termsY + 72 + index * lineHeight)
  })
  if (termsLines.length > maxTermsLines) {
    ctx.fillText('…', rightX + 20, termsY + 72 + maxTermsLines * lineHeight)
  }

  ctx.fillStyle = COLORS.violet
  ctx.font = `700 14px ${FONT}`
  ctx.fillText(
    pass.giftClosing ?? 'Gift certificate admission',
    rightX + 20,
    termsY + termsHeight - 20,
  )

  // Bottom PAEC band
  const bandY = topY + mainHeight + 22
  const bandHeight = GIFT_HEIGHT - bandY - margin
  ctx.beginPath()
  ctx.roundRect(leftX, bandY, GIFT_WIDTH - margin * 2, bandHeight, 16)
  ctx.fillStyle = COLORS.violet
  ctx.fill()

  const brand = paecLogo ?? logo
  if (brand) {
    const brandHeight = Math.min(92, bandHeight - 36)
    const brandWidth = Math.min(300, (brand.width / brand.height) * brandHeight)
    ctx.beginPath()
    ctx.roundRect(
      x + GIFT_WIDTH / 2 - brandWidth / 2 - 14,
      bandY + (bandHeight - brandHeight) / 2 - 7,
      brandWidth + 28,
      brandHeight + 14,
      12,
    )
    ctx.fillStyle = COLORS.white
    ctx.fill()
    ctx.drawImage(
      brand,
      x + GIFT_WIDTH / 2 - brandWidth / 2,
      bandY + (bandHeight - brandHeight) / 2,
      brandWidth,
      brandHeight,
    )
  } else {
    ctx.fillStyle = COLORS.white
    ctx.font = `800 40px ${FONT}`
    ctx.textAlign = 'center'
    ctx.fillText('PAEC', x + GIFT_WIDTH / 2, bandY + bandHeight / 2 + 14)
  }
  ctx.textAlign = 'left'
}

function ticketPass(ticket: TicketImageData): PassContent {
  const isGift = ticket.ticketKind === 'gift_certificate'
  return {
    kind: isGift ? 'gift_certificate' : 'regular',
    headerLabel: isGift
      ? 'GIFT CERTIFICATE E-TICKET'
      : 'E-TICKET  ·  ADMIT ONE',
    title: ticket.activityName,
    pill: ticket.ticketTypeName,
    pillTone: 'orange',
    terms: ticket.termsAndConditions ?? null,
    priceLabel: ticket.priceLabel ?? null,
    positionLabel: ticket.positionLabel ?? null,
    imageUrl: ticket.imageUrl ?? null,
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

function termsPass(ticket: TicketImageData): PassContent {
  return {
    ...ticketPass(ticket),
    kind: 'terms',
    headerLabel: 'TERMS AND CONDITIONS',
    pill: ticket.ticketTypeName,
    qrCaption: '',
  }
}

function groupPass(pass: GroupPassData): PassContent {
  const admits = `${pass.ticketCount} ticket${pass.ticketCount !== 1 ? 's' : ''}`

  // Gift certificate orders: the group pass downloads in the same A4 gift
  // certificate design as the individual tickets, carrying the order QR.
  if (pass.ticketKind === 'gift_certificate') {
    return {
      kind: 'gift_certificate',
      headerLabel: 'GIFT CERTIFICATE GROUP PASS',
      title: pass.activityName,
      pill: pass.ticketTypeName?.trim() || pass.breakdown,
      pillTone: 'violet',
      terms: pass.termsAndConditions ?? null,
      priceLabel: pass.priceLabel ?? null,
      positionLabel: String(pass.ticketCount),
      imageUrl: pass.imageUrl ?? null,
      giftFooter: 'This is your gift certificate group pass. Do not duplicate.',
      giftClosing: 'Gift certificate group admission',
      fields: [
        { label: 'Date of Visit', value: pass.visitDateLabel },
        { label: 'Location', value: pass.location },
        { label: 'Order Number', value: pass.orderNumber, mono: true },
        { label: 'Order QR', value: pass.qrCode, mono: true },
        { label: 'Ticket Holder', value: pass.holder },
      ],
      qrCode: pass.qrCode,
      qrCaption: `Scan once to admit all ${admits}`,
    }
  }

  return {
    kind: 'regular',
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
  imageUrls: Array<string | null | undefined> = [],
) {
  // A web font that never settles would otherwise block the download forever.
  await Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS)),
  ])

  const [logo, paecLogo, ...rest] = await Promise.all([
    loadTicketLogo(logoUrl),
    loadOptionalImage(DEFAULT_TICKET_LOGO),
    ...svgs.map((svg) => (svg ? svgToImage(svg).catch(() => null) : null)),
    ...imageUrls.map((url) => loadOptionalImage(url)),
  ])
  const qrImages = rest.slice(0, svgs.length)
  const posters = rest.slice(svgs.length)
  return { logo, paecLogo, qrImages, posters }
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
      ...sources.flatMap((source) => [
        { content: ticketPass(source.ticket), qrSvg: source.qrSvg },
        ...(source.ticket.ticketKind !== 'gift_certificate' &&
        source.ticket.termsAndConditions?.trim()
          ? [{ content: termsPass(source.ticket), qrSvg: source.qrSvg }]
          : []),
      ]),
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
  const [{ jsPDF }, { logo, paecLogo, qrImages, posters }] =
    await Promise.all([
      import('jspdf'),
      loadAssets(
        passes.map((pass) => pass.qrSvg),
        logoUrl,
        passes.map((pass) => pass.content.imageUrl),
      ),
    ])

  const bleed = 2
  const canvasWidth = TICKET_WIDTH + bleed * 2
  const canvasHeight = TICKET_HEIGHT + bleed * 2
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const imageWidth = PDF_PAGE_WIDTH - PDF_MARGIN * 2
  const imageHeight = (imageWidth * canvasHeight) / canvasWidth
  const giftImageHeight = (imageWidth * GIFT_HEIGHT) / GIFT_WIDTH
  let cursorY = PDF_MARGIN
  let hasPageContent = false

  passes.forEach((pass, index) => {
    if (pass.content.kind === 'gift_certificate') {
      const { canvas, ctx } = createCanvas(
        GIFT_WIDTH,
        GIFT_HEIGHT,
        COLORS.white,
      )
      drawGiftPass(
        ctx,
        pass.content,
        qrImages[index] ?? null,
        logo,
        paecLogo,
        posters[index] ?? null,
        0,
        0,
      )

      if (hasPageContent) {
        pdf.addPage()
        cursorY = PDF_MARGIN
      }
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.92),
        'JPEG',
        PDF_MARGIN,
        cursorY,
        imageWidth,
        giftImageHeight,
      )
      cursorY += giftImageHeight + PDF_GAP
      hasPageContent = true
      return
    }

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

    if (hasPageContent && cursorY + imageHeight > PDF_PAGE_HEIGHT - PDF_MARGIN) {
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
    hasPageContent = true
  })

  saveBlob(pdf.output('blob'), `PAEC-${safeFilename(name) || 'tickets'}.pdf`)
}
