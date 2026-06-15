function getServerRoot(): string {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
  return baseUrl.replace(/\/api(\/v\d+)?\/?$/, '')
}

function fixDoubledUrl(url: string): string {
  const httpsDoublePattern = /^https:\/\/[^/]+\/https:\/\//
  if (httpsDoublePattern.test(url)) {
    const match = url.match(/^https:\/\/[^/]+\/(https:\/\/.+)$/)
    if (match?.[1]) return match[1]
  }

  const httpDoublePattern = /^http:\/\/[^/]+\/http:\/\//
  if (httpDoublePattern.test(url)) {
    const match = url.match(/^http:\/\/[^/]+\/(http:\/\/.+)$/)
    if (match?.[1]) return match[1]
  }

  return url
}

/** Resolve API image paths to a browser-loadable URL. Returns empty string when missing. */
export function resolveImageUrl(url: string | undefined | null): string {
  if (!url || url.trim() === '') return ''

  const cleanedUrl = fixDoubledUrl(url.trim())

  if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
    return cleanedUrl
  }

  const serverRoot = getServerRoot()

  if (cleanedUrl.startsWith('/storage/')) {
    return `${serverRoot}${cleanedUrl}`
  }

  if (cleanedUrl.startsWith('/')) {
    return `${serverRoot}${cleanedUrl}`
  }

  return `${serverRoot}/storage/${cleanedUrl}`
}
