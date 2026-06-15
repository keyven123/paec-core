import { adminApi } from '@/lib/api'

export type AdminTransaction = {
  uuid: string
  order_number: string
  total_amount: number | string
  payment_provider?: string | null
  payment_status: string
  order_status: string
  paid_at?: string | null
  created_at: string
  user?: {
    uuid: string
    name: string
    email: string
  }
  event?: {
    uuid: string
    name: string
    event_name?: string
  }
  transaction_orders?: Array<{
    valid_until?: string | null
  }>
}

type Paginated<T> = {
  data: T[]
  meta: {
    total: number
    current_page: number
    last_page: number
    per_page?: number
  }
}

export type TransactionListFilters = {
  q?: string
  order_status?: string
  payment_status?: string
  event_uuid?: string
  organization_uuid?: string
  user_uuid?: string
  visit_start_date?: string
  visit_end_date?: string
}

export const adminTransactionService = {
  async list(
    page = 1,
    perPage = 15,
    filters: TransactionListFilters = {},
  ): Promise<Paginated<AdminTransaction>> {
    const params: Record<string, string | number> = { page, per_page: perPage }

    if (filters.q?.trim()) params.q = filters.q.trim()
    if (filters.order_status && filters.order_status !== 'all') {
      params.order_status = filters.order_status
    }
    if (filters.payment_status) params.payment_status = filters.payment_status
    if (filters.event_uuid) params.event_uuid = filters.event_uuid
    if (filters.organization_uuid) params.organization_uuid = filters.organization_uuid
    if (filters.user_uuid) params.user_uuid = filters.user_uuid
    if (filters.visit_start_date) params.visit_start_date = filters.visit_start_date
    if (filters.visit_end_date) params.visit_end_date = filters.visit_end_date

    const { data } = await adminApi.get<Paginated<AdminTransaction>>('/v1/transactions', {
      params,
    })

    return data
  },
}
