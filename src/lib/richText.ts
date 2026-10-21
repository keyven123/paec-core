const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'H2',
  'H3',
  'H4',
  'UL',
  'OL',
  'LI',
  'A',
  'BLOCKQUOTE',
])

const REMOVE_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'FORM',
  'INPUT',
  'BUTTON',
  'TEXTAREA',
  'SELECT',
  'IMG',
  'SVG',
  'VIDEO',
  'AUDIO',
  'LINK',
  'META',
  'TITLE',
  'HEAD',
])

export function isHtmlContent(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Convert legacy plain-text content into simple, professional HTML. */
export function plainTextToHtml(value: string): string {
  const text = value.replace(/\r\n/g, '\n').trim()
  if (!text) return ''

  const paragraphs = text.split(/\n{2,}/)
  return paragraphs
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      const isList = lines.every((l) => /^[-•*]\s+/.test(l))
      if (isList && lines.length > 0) {
        const items = lines
          .map((l) => `<li>${escapeHtml(l.replace(/^[-•*]\s+/, ''))}</li>`)
          .join('')
        return `<ul>${items}</ul>`
      }
      return `<p>${lines.map(escapeHtml).join('<br>')}</p>`
    })
    .join('')
}

function isSafeHref(href: string): boolean {
  const trimmed = href.trim().toLowerCase()
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  )
}

function sanitizeNode(node: Node, doc: Document) {
  const children = [...node.childNodes]
  for (const child of children) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove()
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue

    const el = child as HTMLElement
    const tag = el.tagName

    if (REMOVE_TAGS.has(tag)) {
      el.remove()
      continue
    }

    // Preserve bold / italic intent from pasted spans (Google Docs, Word, etc.)
    const fontWeight = el.style?.fontWeight ?? ''
    const fontStyle = el.style?.fontStyle ?? ''
    const isBold =
      tag === 'SPAN' &&
      (fontWeight === 'bold' ||
        fontWeight === 'bolder' ||
        Number.parseInt(fontWeight, 10) >= 600)
    const isItalic = tag === 'SPAN' && fontStyle === 'italic'

    sanitizeNode(el, doc)

    if (!ALLOWED_TAGS.has(tag)) {
      if (isBold || isItalic) {
        const wrapper = doc.createElement(isBold ? 'strong' : 'em')
        wrapper.innerHTML = el.innerHTML
        el.replaceWith(wrapper)
      } else {
        el.replaceWith(...[...el.childNodes])
      }
      continue
    }

    // Strip all attributes except safe link hrefs.
    for (const attr of [...el.attributes]) {
      if (tag === 'A' && attr.name.toLowerCase() === 'href' && isSafeHref(attr.value)) {
        continue
      }
      el.removeAttribute(attr.name)
    }
    if (tag === 'A') {
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
  }
}

/**
 * Sanitize pasted / stored rich text so headings, bold, and lists survive
 * while scripts, styles, images, and inline junk are removed.
 */
export function sanitizeRichHtml(html: string): string {
  if (!html) return ''
  if (!isHtmlContent(html)) return plainTextToHtml(html)

  const doc = new DOMParser().parseFromString(html, 'text/html')
  sanitizeNode(doc.body, doc)

  // Drop empty paragraphs left over from pasted documents.
  doc.body.querySelectorAll('p, li, h2, h3, h4').forEach((el) => {
    if (!el.textContent?.trim() && !el.querySelector('br')) el.remove()
  })

  return doc.body.innerHTML.trim()
}

export function htmlToPlainText(value: string | null | undefined): string {
  if (!value) return ''
  if (!isHtmlContent(value)) return value
  const doc = new DOMParser().parseFromString(value, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}
