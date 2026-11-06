import { useEffect } from 'react'

import { api } from '@/lib/api'
import {
  getEnvMetaPixelId,
  getEnvMetaPixelTestEventCode,
  initMetaPixel,
} from '@/lib/metaPixel'

/**
 * Loads the project-wide Meta Pixel (fbq) on every public page so browser
 * extensions and Meta Events Manager can detect it. Prefer Admin settings via
 * public API; fall back to VITE_META_PIXEL_ID for faster first paint.
 */
export function MetaPixelBoot() {
  useEffect(() => {
    // Keep admin console free of storefront browser tracking.
    if (window.location.pathname.startsWith('/admin')) {
      return
    }

    const envId = getEnvMetaPixelId()
    const envTest = getEnvMetaPixelTestEventCode()
    if (envId) {
      initMetaPixel(envId, envTest)
    }

    let cancelled = false

    void api
      .get<{
        data: {
          enabled: boolean
          pixel_id: string
          test_event_code?: string | null
        }
      }>('/v1/public/cms/meta-pixel')
      .then(({ data }) => {
        if (cancelled) return
        const cfg = data.data
        if (!cfg?.enabled || !cfg.pixel_id?.trim()) return
        initMetaPixel(cfg.pixel_id.trim(), cfg.test_event_code ?? envTest)
      })
      .catch(() => {
        // Env bootstrap above is enough when the API is unreachable.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
