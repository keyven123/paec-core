/**
 * Browser Meta Pixel (fbq). Purchase is also sent server-side via Conversions API.
 * Pixel ID comes from project Admin → Meta Pixel (public API) or VITE_META_PIXEL_ID.
 */

import { API_BASE_URL } from '@/lib/api'

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
  reportBrowserEvent({
    event_name: 'PageView',
    page_url: typeof window !== 'undefined' ? window.location.href : undefined,
  })
}

function reportBrowserEvent(payload: {
  event_name: string
  event_id?: string
  content_name?: string
  page_url?: string
  value?: number
  currency?: string
  content_ids?: string[]
  order_id?: string
  num_items?: number
}): void {
  if (typeof window === 'undefined') return
  // Skip admin console beacons.
  if (window.location.pathname.startsWith('/admin')) return

  const body = JSON.stringify({
    ...payload,
    page_url: payload.page_url || window.location.href,
  })

  // Must use the Laravel API host (e.g. api.amusements.global), not the SPA origin.
  // Relative `/api/...` hits the frontend host in production and returns HTML.
  const endpoint = `${API_BASE_URL.replace(/\/+$/, '')}/v1/public/cms/meta-pixel/events`

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
    keepalive: true,
    mode: 'cors',
  }).catch(() => {
    // never block storefront UX on audit logging
  })
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

  const payload = {
    content_name: eventData.content_name,
    content_category: eventData.content_category || 'Event',
    content_ids: eventData.content_ids,
    content_type: eventData.content_type || 'event',
    value: eventData.value || 0,
    currency: eventData.currency || 'PHP',
  }
  window.fbq('track', 'ViewContent', payload)
  reportBrowserEvent({
    event_name: 'ViewContent',
    content_name: payload.content_name,
    content_ids: payload.content_ids,
    value: payload.value,
    currency: payload.currency,
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

  const payload = {
    content_name: eventData.content_name,
    content_category: eventData.content_category || 'Event',
    content_ids: eventData.content_ids,
    content_type: eventData.content_type || 'event',
    value: eventData.value,
    currency: eventData.currency || 'PHP',
    num_items: eventData.num_items || 1,
  }
  window.fbq('track', 'InitiateCheckout', payload)
  reportBrowserEvent({
    event_name: 'InitiateCheckout',
    content_name: payload.content_name,
    content_ids: payload.content_ids,
    value: payload.value,
    currency: payload.currency,
    num_items: payload.num_items,
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

  const payload = {
    content_name: eventData.content_name,
    content_category: eventData.content_category || 'Event',
    content_ids: eventData.content_ids,
    content_type: eventData.content_type || 'event',
    value: eventData.value,
    currency: eventData.currency || 'PHP',
    num_items: eventData.num_items || 1,
  }
  window.fbq('track', 'AddPaymentInfo', payload)
  reportBrowserEvent({
    event_name: 'AddPaymentInfo',
    content_name: payload.content_name,
    content_ids: payload.content_ids,
    value: payload.value,
    currency: payload.currency,
    num_items: payload.num_items,
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
 *
 * Dedupe is recorded only after fbq actually fires, so a mid-redirect call that
 * never reaches Meta cannot block the success-page Purchase.
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
  options?: { eventID?: string; dedupeKey?: string; delayMs?: number },
): void {
  if (typeof window === 'undefined') return

  const dedupeKey = options?.dedupeKey || options?.eventID
  const storageKey = dedupeKey ? `meta_purchase_v2_${dedupeKey}` : null
  if (storageKey) {
    try {
      if (sessionStorage.getItem(storageKey) === '1') return
    } catch {
      // ignore storage failures
    }
  }

  const payload = {
    content_name: eventData.content_name,
    content_category: eventData.content_category || 'Event',
    content_ids: eventData.content_ids,
    content_type: eventData.content_type || 'product',
    value: Number(eventData.value) || 0,
    currency: eventData.currency || 'PHP',
    num_items: eventData.num_items || 1,
    order_id: eventData.order_id,
  }

  const fire = () => {
    if (typeof window.fbq !== 'function') return

    // Mark only after we know fbq is ready to send.
    if (storageKey) {
      try {
        if (sessionStorage.getItem(storageKey) === '1') return
        sessionStorage.setItem(storageKey, '1')
      } catch {
        // ignore
      }
    }

    const opts = options?.eventID ? { eventID: options.eventID } : undefined
    window.fbq('track', 'Purchase', payload, opts)
    window.fbq('trackCustom', 'PaymentSuccessful', payload, opts)
    reportBrowserEvent({
      event_name: 'Purchase',
      event_id: options?.eventID,
      content_name: payload.content_name,
      content_ids: payload.content_ids,
      value: payload.value,
      currency: payload.currency,
      order_id: payload.order_id,
      num_items: payload.num_items,
    })
  }

  const delayMs = options?.delayMs ?? 0
  const run = () => {
    pixelReady(() => {
      if (delayMs > 0) {
        window.setTimeout(fire, delayMs)
      } else {
        fire()
      }
    }, 10000)
  }

  run()
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
