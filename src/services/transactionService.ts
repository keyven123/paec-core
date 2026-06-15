import { api } from '@/lib/api'

export type TempTransactionTicket = {
  event_ticket_uuid: string
  quantity: number
  valid_until?: string
  seats?: Array<{
    uuid: string
    row: string
    seat_no: number
    category: string
    color: string | null
  }>
}

export type CreateTempTransactionData = {
  event_uuid: string
  event_location_uuid?: string
  schedule_uuid?: string
  schedule_time_uuid?: string
  tickets: TempTransactionTicket[]
  promo_code_uuid?: string
  affiliate_code?: string
}

export type TempTransactionResponse = {
  uuid: string
  total_amount: string
  promo_code_uuid: string | null
  promo_code_discount: number
}

export type CheckoutFreePayload = {
  temp_transaction_uuid: string
  other_info?: Array<Record<string, string>>
}

export type CheckoutResponse = {
  success: boolean
  transaction?: { uuid: string }
  tickets?: unknown[]
}

export type TransactionOrder = {
  uuid: string
  event_ticket_uuid: string
  quantity: number
  price: number | string
  markup?: number | string
  markup_discount?: number | string
  line_markup_gross?: number
  display_unit_price?: number
  discount: number | string
  total_amount: number | string
  valid_until?: string | null
  event_ticket?: {
    uuid: string
    name: string
    code: string
    price: number | string
  }
}

export type CustomerTransaction = {
  uuid: string
  order_number: string
  total_amount: number | string
  sub_total: number | string
  markup_amount?: number | string
  markup_discount?: number | string
  display_subtotal?: number
  display_discount?: number
  tax_amount: number | string
  discount: number | string
  promo_code_discount?: number | null
  status: string
  payment_status: string
  order_status: string
  payment_provider?: string | null
  paid_at?: string | null
  created_at: string
  tickets_count?: number
  event?: {
    uuid: string
    name: string
    event_name?: string
  }
  promo_code?: {
    uuid: string
    code: string
    description?: string | null
  } | null
  transaction_orders?: TransactionOrder[]
}

export type PaginatedCustomerTransactions = {
  data: CustomerTransaction[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from?: number | null
    to?: number | null
  }
}

export const transactionService = {
  async createTempTransaction(
    data: CreateTempTransactionData,
  ): Promise<TempTransactionResponse> {
    const { data: response } = await api.post<TempTransactionResponse>(
      '/v1/customer/temp-transactions',
      data,
    )
    return response
  },

  async checkoutFree(data: CheckoutFreePayload): Promise<CheckoutResponse> {
    const { data: response } = await api.post<CheckoutResponse>(
      '/v1/customer/temp-transactions/checkout-free',
      data,
    )
    return response
  },

  /** Dev-only: skip payment gateway (requires APP_DEBUG on API). */
  async checkoutBypass(data: CheckoutFreePayload): Promise<CheckoutResponse> {
    const { data: response } = await api.post<CheckoutResponse>(
      '/v1/customer/temp-transactions/checkout-bypass',
      data,
    )
    return response
  },

  async getMyTransactions(
    page = 1,
    perPage = 10,
    q?: string,
  ): Promise<PaginatedCustomerTransactions> {
    const params: Record<string, string | number> = { page, per_page: perPage }
    if (q?.trim()) params.q = q.trim()

    const { data } = await api.get<PaginatedCustomerTransactions>(
      '/v1/customer/my-transactions',
      { params },
    )
    return data
  },
}
