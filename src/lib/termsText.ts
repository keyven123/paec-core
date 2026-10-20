/**
 * Terms are typed by admins in a plain textarea, but are often pasted from
 * Markdown documents (`# headings`, `**bold**`, `- bullets`). On a printed /
 * displayed ticket those markers look broken, so strip them and present the
 * terms as clean letter-style paragraphs.
 */

function cleanLine(line: string): string {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, '') // ## heading
    .replace(/^\s*>\s?/, '') // > quote
    .replace(/^\s*[-*+]\s+/, '• ') // - bullet
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1') // *italic*
    .replace(/`([^`]+)`/g, '$1') // `code`
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url)
    .replace(/\s+/g, ' ')
    .trim()
}

function isTermsHeading(line: string): boolean {
  return /^terms\s*(and|&)\s*conditions$/i.test(line.trim())
}

/** Cleaned paragraphs; a leading “Terms and Conditions” heading is dropped (the ticket already labels the box). */
export function termsParagraphs(raw?: string | null): Array<string> {
  if (!raw) return []

  const paragraphs: Array<string> = []
  for (const chunk of raw.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = chunk.split('\n').map(cleanLine).filter(Boolean)
    if (lines.length === 0) continue
    // Lines inside one pasted block belong to one paragraph, except bullets/headings stay readable.
    paragraphs.push(lines.join('\n'))
  }

  const cleaned = paragraphs.filter(
    (paragraph, index) => !(index === 0 && isTermsHeading(paragraph)),
  )
  return cleaned.length > 0 ? cleaned : paragraphs
}

/** Single clean string for canvas / plain-text rendering. */
export function cleanTermsText(raw?: string | null): string {
  return termsParagraphs(raw).join('\n\n')
}
