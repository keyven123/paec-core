import { adminApi, api } from '@/lib/api'

export type CmsFooterLink = {
  label: string
  href: string
}

export type CmsFooterSettings = {
  company_description: string
  contact_email: string
  contact_phone: string
  contact_address: string
  copyright: string
  explore_links: CmsFooterLink[]
  support_links: CmsFooterLink[]
}

export type CmsPage = {
  uuid: string
  title: string
  slug: string
  content?: string | null
  status: 'draft' | 'published'
  show_in_footer: boolean
  footer_column?: 'explore' | 'support' | null
  sort_order: number
  created_at?: string
  updated_at?: string
}

export type CmsPagePayload = {
  title: string
  slug: string
  content?: string
  status: 'draft' | 'published'
  show_in_footer?: boolean
  footer_column?: 'explore' | 'support' | null
  sort_order?: number
}

type PaginatedCmsPages = {
  data: CmsPage[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const DEFAULT_FOOTER_SETTINGS: CmsFooterSettings = {
  company_description:
    'Philippine Amusement and Entertainment Corporation. Your gateway to the best fun experiences in the Philippines.',
  contact_email: 'inquire@paec.ph',
  contact_phone: '+63 928 297 5671',
  contact_address: 'Manila, Philippines',
  copyright: '© 2026 PAEC. All rights reserved.',
  explore_links: [
    { label: 'Fun Activities', href: '/?category=fun' },
    { label: 'Events', href: '/?category=events' },
    { label: 'Travel', href: '#' },
    { label: 'Stay', href: '#' },
    { label: 'Eats', href: '#' },
  ],
  support_links: [
    { label: 'Help Center', href: '/pages/help-center' },
    { label: 'Terms of Service', href: '/pages/terms-of-service' },
    { label: 'Privacy Policy', href: '/pages/privacy-policy' },
    { label: 'Refund Policy', href: '/pages/refund-policy' },
  ],
}

export function normalizeFooterLinks(links: CmsFooterLink[]): CmsFooterLink[] {
  return links
    .map((link) => ({
      label: link.label.trim(),
      href: link.href.trim() || '#',
    }))
    .filter((link) => link.label.length > 0)
}

export function normalizeFooterSettings(settings: CmsFooterSettings): CmsFooterSettings {
  return {
    ...settings,
    company_description: settings.company_description.trim(),
    contact_email: settings.contact_email.trim(),
    contact_phone: settings.contact_phone.trim(),
    contact_address: settings.contact_address.trim(),
    copyright: settings.copyright.trim(),
    explore_links: normalizeFooterLinks(settings.explore_links),
    support_links: normalizeFooterLinks(settings.support_links),
  }
}

export const cmsService = {
  async getPublicFooter(): Promise<CmsFooterSettings> {
    const { data } = await api.get<{ data: CmsFooterSettings }>('/v1/public/cms/footer', {
      params: { _: Date.now() },
    })
    return normalizeFooterSettings(data.data)
  },

  async getPublicPage(slug: string): Promise<CmsPage> {
    const { data } = await api.get<{ data: CmsPage }>(`/v1/public/cms/pages/${slug}`)
    return data.data
  },

  async listPages(params?: {
    q?: string
    status?: string
    page?: number
    per_page?: number
  }): Promise<PaginatedCmsPages> {
    const { data } = await adminApi.get<PaginatedCmsPages>('/v1/cms/pages', { params })
    return data
  },

  async createPage(payload: CmsPagePayload): Promise<CmsPage> {
    const { data } = await adminApi.post<{ data: CmsPage }>('/v1/cms/pages', payload)
    return data.data
  },

  async updatePage(uuid: string, payload: CmsPagePayload): Promise<CmsPage> {
    const { data } = await adminApi.put<{ data: CmsPage }>(`/v1/cms/pages/${uuid}`, payload)
    return data.data
  },

  async deletePage(uuid: string): Promise<void> {
    await adminApi.delete(`/v1/cms/pages/${uuid}`)
  },

  async getFooterSettings(): Promise<CmsFooterSettings> {
    const { data } = await adminApi.get<{ data: CmsFooterSettings }>('/v1/cms/footer')
    return normalizeFooterSettings(data.data)
  },

  async updateFooterSettings(payload: CmsFooterSettings): Promise<CmsFooterSettings> {
    const normalized = normalizeFooterSettings(payload)
    const { data } = await adminApi.put<{ data: CmsFooterSettings }>(
      '/v1/cms/footer',
      normalized,
    )
    return normalizeFooterSettings(data.data)
  },
}
