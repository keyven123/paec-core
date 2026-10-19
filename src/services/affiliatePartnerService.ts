import { api } from '@/lib/api'

export type AffiliateStats = {
  total_clicks: number
  /** Sum of net commission per conversion (gross − 10% INT), same basis as commission history */
  total_conversions: number
  matured_commission_net: number
  pending_earnings: number
  paid_earnings: number
  available_earnings: number
}

export type AffiliateBankDetails = {
  bank: string | null
  branch: string | null
  account_name: string | null
  account_number: string | null
  tin: string | null
}

export type AffiliatePartnerPayload = {
  status: string
  code: string | null
  referral_link: string | null
  affiliate_applied_at: string | null
  affiliate_approved_at: string | null
  affiliate_suspend_reason?: string | null
  affiliate_suspended_at?: string | null
  stats: AffiliateStats
  bank_details: AffiliateBankDetails
}

export type AffiliateModule = 'activities' | 'commission' | 'bank'

export type AffiliatePayoutRequest = {
  uuid: string
  user_uuid: string
  amount_requested: number
  currency: string
  status: 'pending' | 'approved' | 'declined'
  admin_notes: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

export type AffiliatePaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export type PayoutHistoryResponse = {
  data: Array<AffiliatePayoutRequest>
  meta: AffiliatePaginationMeta
}

export type AffiliateConversion = {
  uuid: string
  partner_user_uuid: string
  transaction_uuid: string
  entry_type: 'credit' | 'reversal'
  ticket_uuid: string | null
  event_uuid: string
  order_total: number
  commission_percent: number
  commission_amount: number
  created_at: string
  updated_at: string
  event?: {
    uuid: string
    event_name: string
  }
  transaction?: {
    uuid: string
    order_number: string
    paid_at: string | null
  }
  ticket?: {
    uuid: string
    ticket_number: string | null
  } | null
}

export type ConversionHistoryResponse = {
  data: Array<AffiliateConversion>
  meta: AffiliatePaginationMeta
}

type AffiliateCatalogImage = {
  uuid?: string
  url: string
}

/** Subset of EventPublicResource used by the affiliate activity catalog. */
export type AffiliateCatalogEvent = {
  uuid: string
  event_name: string
  slug: string | null
  category_name?: string | null
  city?: string | null
  affiliate_enabled?: boolean
  affiliate_commission_percent: number | null
  /** Y-m-d calendar day, or null when the program has no end date. */
  affiliate_ends_at: string | null
  portrait_image?: AffiliateCatalogImage | null
  featured_image?: AffiliateCatalogImage | null
}

export type PaginatedAffiliateCatalog = {
  data: Array<AffiliateCatalogEvent>
  meta: AffiliatePaginationMeta
}

export const affiliatePartnerService = {
  async get(): Promise<AffiliatePartnerPayload> {
    const response = await api.get<{ data: AffiliatePartnerPayload }>(
      '/v1/customer/affiliate',
    )
    return response.data.data
  },

  async apply(): Promise<AffiliatePartnerPayload> {
    const response = await api.post<{
      message?: string
      data: AffiliatePartnerPayload
    }>('/v1/customer/affiliate/apply')
    return response.data.data
  },

  async getAvailableEvents(params?: {
    q?: string
    page?: number
    per_page?: number
  }): Promise<PaginatedAffiliateCatalog> {
    const response = await api.get<PaginatedAffiliateCatalog>(
      '/v1/customer/affiliate/available-events',
      { params },
    )
    return response.data
  },

  async getAvailableFun(params?: {
    q?: string
    page?: number
    per_page?: number
    fun_type?: 'promo' | 'new'
  }): Promise<PaginatedAffiliateCatalog> {
    const response = await api.get<PaginatedAffiliateCatalog>(
      '/v1/customer/affiliate/available-fun',
      { params },
    )
    return response.data
  },

  async getPayoutHistory(params?: {
    page?: number
    per_page?: number
  }): Promise<PayoutHistoryResponse> {
    const response = await api.get<PayoutHistoryResponse>(
      '/v1/customer/affiliate/payout-requests',
      { params },
    )
    return response.data
  },

  async getConversionHistory(params?: {
    page?: number
    per_page?: number
  }): Promise<ConversionHistoryResponse> {
    const response = await api.get<ConversionHistoryResponse>(
      '/v1/customer/affiliate/conversions',
      { params },
    )
    return response.data
  },

  async createPayoutRequest(amount: number): Promise<AffiliatePayoutRequest> {
    const response = await api.post<{ data: AffiliatePayoutRequest }>(
      '/v1/customer/affiliate/payout-requests',
      { amount },
    )
    return response.data.data
  },

  async updateBankDetails(payload: {
    bank: string
    branch: string
    account_name: string
    account_number: string
    tin: string
  }): Promise<AffiliatePartnerPayload> {
    const response = await api.patch<{ data: AffiliatePartnerPayload }>(
      '/v1/customer/affiliate/bank-details',
      payload,
    )
    return response.data.data
  },
}
