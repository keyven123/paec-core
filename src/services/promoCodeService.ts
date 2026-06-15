import { adminApi, api } from '@/lib/api'

export type PublicPromoCode = {
  uuid: string
  code: string
  description?: string | null
  discount_type: string
  discount_value: string
  usable_from: string
  usable_to: string
  used_count: number
  status: string
}

export type PromoCodeStatus = 'active' | 'inactive' | 'expired'

export type PromoCode = {
  uuid: string
  organization_uuid: string
  code: string
  description?: string | null
  activityable_type?: string | null
  activityable_id?: string | null
  discount_type: string
  discount_value: string
  is_unlimited: boolean
  max_use?: number | null
  usable_from: string
  usable_to: string
  status: string
  created_at: string
  updated_at: string
  activityable?: {
    type: string
    id: string
    data?: {
      uuid: string
      event_name?: string
    }
  }
  organization?: {
    uuid: string
    name: string
  }
}

export type PromoCodeFilters = {
  q?: string
  status?: string
  page?: number
  per_page?: number
}

export type PromoCodeListResponse = {
  data: PromoCode[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

export type CreatePromoCodeData = {
  code: string
  description?: string
  activityable_type: string
  activityable_id: string
  discount_type: string
  discount_value: number
  is_unlimited: boolean
  max_use?: number
  usable_from: string
  usable_to: string
  status?: string
}

export function formatDateTimeForBackend(dateTimeString: string): string {
  const [datePart, timePart] = dateTimeString.split('T')
  return `${datePart} ${timePart}:00`
}

export function getPromoDisplayStatus(promo: PromoCode): PromoCodeStatus {
  const now = new Date()
  const from = new Date(promo.usable_from)
  from.setHours(0, 0, 0, 0)
  const to = new Date(promo.usable_to)
  to.setHours(23, 59, 59, 999)

  if (now > to) return 'expired'
  if (now < from) return 'inactive'
  if (promo.status === 'inactive') return 'inactive'
  return 'active'
}

export function formatPromoDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const promoCodeService = {
  async getPromoCodes(
    filters?: PromoCodeFilters,
  ): Promise<PromoCodeListResponse> {
    const { data } = await adminApi.get<PromoCodeListResponse>('/v1/promo-codes', {
      params: filters,
    })
    return data
  },

  async getPromoCode(uuid: string): Promise<PromoCode> {
    const { data } = await adminApi.get<{ data: PromoCode }>(
      `/v1/promo-codes/${uuid}`,
    )
    return data.data
  },

  async createPromoCode(payload: CreatePromoCodeData): Promise<PromoCode> {
    const { data } = await adminApi.post<{ data: PromoCode }>(
      '/v1/promo-codes',
      payload,
    )
    return data.data
  },

  async deletePromoCode(uuid: string): Promise<void> {
    await adminApi.delete(`/v1/promo-codes/${uuid}`)
  },
}

/** Public / customer promo validation (marketplace checkout). */
export const publicPromoCodeService = {
  async validateByCode(code: string, eventUuid: string): Promise<PublicPromoCode> {
    const { data } = await api.get<{ data: PublicPromoCode }>(
      `/v1/public/promo-codes/${encodeURIComponent(code.trim())}`,
      { params: { event_uuid: eventUuid } },
    )
    return data.data
  },

  async validateByUuid(uuid: string, eventUuid: string): Promise<PublicPromoCode> {
    const { data } = await api.get<{ data: PublicPromoCode }>(
      `/v1/customer/promo-codes/${uuid}`,
      { params: { event_uuid: eventUuid } },
    )
    return data.data
  },
}
