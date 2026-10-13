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
    phone_number?: string | null
  }
  event?: {
    uuid: string
    name: string
    event_name?: string
  }
  transaction_orders?: Array<AdminTransactionOrder>
}

export type AdminTransactionOrder = {
  uuid?: string
  quantity?: number
  price?: number | string
  display_unit_price?: number
  discount?: number | string | null
  total_amount?: number | string
  valid_until?: string | null
  event_ticket?: { uuid: string; name: string; code?: string } | null
}

export type AdminTransactionTicket = {
  uuid: string
  ticket_number: string | null
  status: string
  ticket_type: string | null
  attendee_name: string | null
  attendee_email: string | null
  attendee_contact: string | null
  owner_email: string | null
  qr_code: string | null
  seat: string | null
  location: string | null
  price: number | string | null
  valid_until: string | null
  used_at: string | null
  transferred_to: string | null
  transferred_at: string | null
}

export type SendTicketsResult = {
  success: boolean
  message: string
  mode: 'resent' | 'transferred'
  ticket_count: number
  transferred_count: number
  recipient: { name: string; email: string; is_new_account: boolean }
}

export type AdminTransactionDetail = AdminTransaction & {
  payment_id?: string | null
  order_qr_code?: string | null
  sub_total?: number | string
  display_subtotal?: number
  display_discount?: number
  tax_amount?: number | string
  taxes_and_fees_label?: string | null
  promo_code?: { uuid: string; code: string; description?: string | null }
  promo_code_discount?: number | null
  schedule_time?: { uuid: string; time_start: string; time_end: string }
  affiliate_partner?: { uuid: string; name: string; email: string }
  affiliate_commission_amount?: number | null
  affiliate_commission_percent?: number | null
  tickets?: Array<AdminTransactionTicket>
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

  async show(uuid: string): Promise<AdminTransactionDetail> {
    const { data } = await adminApi.get<{ data: AdminTransactionDetail }>(
      `/v1/transactions/${uuid}`,
    )
    return data.data
  },

  async sendTickets(uuid: string, email: string): Promise<SendTicketsResult> {
    const { data } = await adminApi.post<SendTicketsResult>(
      `/v1/transactions/${uuid}/send-tickets`,
      { email },
    )
    return data
  },
}
