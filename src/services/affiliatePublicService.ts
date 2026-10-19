import { api } from '@/lib/api'

export const affiliatePublicService = {
  async trackClick(ref: string, path?: string): Promise<void> {
    try {
      await api.post('/v1/public/affiliate/track-click', {
        ref: ref.trim().slice(0, 32),
        path:
          path ??
          (typeof window !== 'undefined' ? window.location.pathname : undefined),
      })
    } catch {
      // Non-blocking for browsing UX
    }
  },
}
