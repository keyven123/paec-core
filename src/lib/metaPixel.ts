/**
 * Browser Meta Pixel (fbq). Purchase is also sent server-side via Conversions API.
 * Pixel ID comes from project Admin → Meta Pixel (public API) or VITE_META_PIXEL_ID.
 */

declare global {
  interface Window {
    fbq?: {
      (command: 'init', pixelId: string, params?: Record<string, unknown>): void
      (
        command: 'track' | 'trackCustom',
        eventName: string,
        params?: Record<string, unknown>,
        options?: { eventID?: string },
      ): void
      callMethod?: (...args: unknown[]) => void
      queue?: unknown[]
      loaded?: boolean
      version?: string
      push?: (...args: unknown[]) => void
    }
    _fbq?: Window['fbq']
  }
}

let initializedPixelId: string | null = null

export function getEnvMetaPixelId(): string | null {
  const id = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim()
  return id || null
}

export function getEnvMetaPixelTestEventCode(): string | null {
  const code = (
    import.meta.env.VITE_META_PIXEL_TEST_EVENT_CODE as string | undefined
  )?.trim()
  return code || null
}

/**
 * Load fbevents.js and init the project pixel. Safe to call more than once
 * with the same ID; skips if already initialized for that ID.
 */
export function initMetaPixel(
  pixelId: string,
  testEventCode?: string | null,
): void {
  if (typeof window === 'undefined') return

  const id = pixelId.trim()
  if (!id) return

  ensureFbcFromUrl()

  if (initializedPixelId === id && typeof window.fbq === 'function') {
    return
  }

  if (!window.fbq) {
    // Standard Meta Pixel bootstrap (typed loosely to match fbevents.js).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(function (f: any, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
      if (f.fbq) return
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = true
      n.version = '2.0'
      n.queue = []
      t = b.createElement(e)
      t.async = true
      t.src = v
      s = b.getElementsByTagName(e)[0]
      s?.parentNode?.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  }

  const initParams: Record<string, unknown> = {}
  if (testEventCode) {
    initParams.testEventCode = testEventCode
  }

  window.fbq?.('init', id, initParams)
  window.fbq?.('track', 'PageView')
  initializedPixelId = id
  try {
    sessionStorage.setItem('meta_pixel_id', id)
  } catch {
    // ignore
  }
}

export function trackViewContent(eventData: {
  content_name: string
  content_category?: string
  content_ids: string[]
  content_type?: string
  value?: number
  currency?: string
}): void {
  if (typeof window === 'undefined' || !window.fbq) return

  window.fbq('track', 'ViewContent', {
    content_name: eventData.content_name,
    content_category: eventData.content_category || 'Event',
    content_ids: eventData.content_ids,
    content_type: eventData.content_type || 'event',
    value: eventData.value || 0,
    currency: eventData.currency || 'PHP',
  })
}

export function trackInitiateCheckout(eventData: {
  content_name: string
  content_category?: string
  content_ids: string[]
  content_type?: string
  value: number
  currency?: string
  num_items?: number
}): void {
  if (typeof window === 'undefined' || !window.fbq) return

  window.fbq('track', 'InitiateCheckout', {
    content_name: eventData.content_name,
    content_category: eventData.content_category || 'Event',
    content_ids: eventData.content_ids,
    content_type: eventData.content_type || 'event',
    value: eventData.value,
    currency: eventData.currency || 'PHP',
    num_items: eventData.num_items || 1,
  })
}

export function trackAddPaymentInfo(eventData: {
  content_name: string
  content_category?: string
  content_ids: string[]
  content_type?: string
  value: number
  currency?: string
  num_items?: number
}): void {
  if (typeof window === 'undefined' || !window.fbq) return

  window.fbq('track', 'AddPaymentInfo', {
    content_name: eventData.content_name,
    content_category: eventData.content_category || 'Event',
    content_ids: eventData.content_ids,
    content_type: eventData.content_type || 'event',
    value: eventData.value,
    currency: eventData.currency || 'PHP',
    num_items: eventData.num_items || 1,
  })
}

/**
 * Wait until fbq is callable (script finished loading).
 */
export function pixelReady(callback: () => void, timeout = 8000): void {
  if (typeof window === 'undefined') return

  const start = Date.now()
  const check = () => {
    if (typeof window.fbq === 'function') {
      callback()
      return
    }
    if (Date.now() - start >= timeout) return
    window.setTimeout(check, 100)
  }
  check()
}

/**
 * Browser Purchase — eventID should match server CAPI (`purchase_{transactionUuid}`)
 * so Meta can dedupe browser + Conversions API.
 */
export function trackPurchase(
  eventData: {
    content_name: string
    content_category?: string
    content_ids: string[]
    content_type?: string
    value: number
    currency?: string
    num_items?: number
    order_id?: string
  },
  options?: { eventID?: string; dedupeKey?: string },
): void {
  if (typeof window === 'undefined') return

  const dedupeKey = options?.dedupeKey || options?.eventID
  if (dedupeKey) {
    try {
      if (sessionStorage.getItem(`meta_purchase_${dedupeKey}`)) return
      sessionStorage.setItem(`meta_purchase_${dedupeKey}`, '1')
    } catch {
      // ignore storage failures
    }
  }

  const payload = {
    content_name: eventData.content_name,
    content_category: eventData.content_category || 'Event',
    content_ids: eventData.content_ids,
    content_type: eventData.content_type || 'product',
    value: eventData.value,
    currency: eventData.currency || 'PHP',
    num_items: eventData.num_items || 1,
    order_id: eventData.order_id,
  }

  const fire = () => {
    if (!window.fbq) return
    const opts = options?.eventID ? { eventID: options.eventID } : undefined
    window.fbq('track', 'Purchase', payload, opts)
    window.fbq('trackCustom', 'PaymentSuccessful', payload, opts)
  }

  if (typeof window.fbq === 'function') {
    fire()
  } else {
    pixelReady(fire)
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`,
    ),
  )
  return match ? decodeURIComponent(match[1]) : null
}

export function ensureFbcFromUrl(): void {
  if (typeof window === 'undefined') return
  if (readCookie('_fbc')) return

  const fbclid = new URLSearchParams(window.location.search).get('fbclid')
  if (!fbclid) return

  const fbc = `fb.1.${Date.now()}.${fbclid}`
  document.cookie = `_fbc=${encodeURIComponent(fbc)}; path=/; max-age=${90 * 24 * 60 * 60}; SameSite=Lax`
}

export function getMetaPixelCookies(): { fbp: string | null; fbc: string | null } {
  ensureFbcFromUrl()
  return {
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc'),
  }
}

export function getMetaPixelTrackingPayload():
  | { fbp?: string; fbc?: string }
  | undefined {
  const { fbp, fbc } = getMetaPixelCookies()
  const payload: { fbp?: string; fbc?: string } = {}
  if (fbp) payload.fbp = fbp
  if (fbc) payload.fbc = fbc
  return Object.keys(payload).length > 0 ? payload : undefined
}
