import { adminApi } from '@/lib/api'
import type {
  AffiliateBankDetails,
  AffiliatePayoutRequest,
  PayoutHistoryResponse,
} from '@/services/affiliatePartnerService'

export type AdminAffiliatePayoutRequest = AffiliatePayoutRequest & {
  customer?: {
    uuid: string
    email: string
    full_name: string
  }
  bank_details?: AffiliateBankDetails
}

export type AdminPayoutListResponse = {
  data: Array<AdminAffiliatePayoutRequest>
  meta: PayoutHistoryResponse['meta']
}

export const adminAffiliatePayoutService = {
  async list(params?: {
    page?: number
    per_page?: number
    status?: string
  }): Promise<AdminPayoutListResponse> {
    const response = await adminApi.get<AdminPayoutListResponse>(
      '/v1/affiliate-payout-requests',
      { params },
    )
    return response.data
  },

  async approve(uuid: string): Promise<{ data: AdminAffiliatePayoutRequest }> {
    const response = await adminApi.patch<{ data: AdminAffiliatePayoutRequest }>(
      `/v1/affiliate-payout-requests/${uuid}/approve`,
      {},
    )
    return response.data
  },

  async decline(
    uuid: string,
    admin_notes?: string | null,
  ): Promise<{ data: AdminAffiliatePayoutRequest }> {
    const response = await adminApi.patch<{ data: AdminAffiliatePayoutRequest }>(
      `/v1/affiliate-payout-requests/${uuid}/decline`,
      { admin_notes: admin_notes ?? null },
    )
    return response.data
  },
}
