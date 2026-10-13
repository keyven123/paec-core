export function getPhoneHref(phone: string): string {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/[^\d]/g, '')
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`
}

export function getMailtoHref(email: string, subject?: string): string {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : ''
  return `mailto:${email.trim()}${query}`
}

export function getGmailComposeHref(email: string, subject?: string): string {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: email.trim() })
  if (subject) params.set('su', subject)
  return `https://mail.google.com/mail/?${params.toString()}`
}

export function openEmailComposer(
  event: { preventDefault: () => void },
  email: string,
  subject?: string,
) {
  const prefersMailApp = window.matchMedia('(pointer: coarse)').matches
  if (prefersMailApp) return

  event.preventDefault()
  window.open(getGmailComposeHref(email, subject), '_blank', 'noopener,noreferrer')
}

export function getGoogleMapsHref(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`
}
