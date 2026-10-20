import type { PaynamicsChannel } from '@/services/paymentGatewayService'
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
  tickets: Array<TempTransactionTicket>
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

export type PlacedTicket = {
  uuid: string
  event_ticket_uuid: string
  ticket_number: string | null
  qr_code: string | null
  status: string
  event_ticket?: {
    uuid: string
    name: string
    ticket_kind?: 'regular' | 'gift_certificate'
    terms_and_conditions?: string | null
  } | null
}

export type CheckoutResponse = {
  success: boolean
  transaction?: {
    uuid: string
    order_number?: string
    qr_code?: string | null
    paid_at?: string | null
  }
  tickets?: Array<PlacedTicket>
}

/** One activity's order within a cart checkout that shared a single payment. */
export type GroupOrder = {
  cart_item_uuid: string | null
  transaction: NonNullable<CheckoutResponse['transaction']> & {
    event_uuid?: string
  }
  tickets: Array<PlacedTicket>
}

export type GatewayCheckoutPayload = {
  temp_transaction_uuid: string
  payment_gateway_uuid: string
  /** Required when the gateway is Paynamics. */
  payment_channel?: PaynamicsChannel
}

export type GatewayCheckoutResponse = CheckoutResponse & {
  orders?: Array<GroupOrder>
  redirect_url?: string
  payment?: {
    provider: string
    status: string
    checkout_url?: string | null
    approval_url?: string | null
  }
}

export type PaymentVerificationResponse = {
  success: boolean
  message?: string
  payment_status?: string
  transaction?: NonNullable<CheckoutResponse['transaction']> & {
    payment_status?: string
  }
  tickets?: Array<PlacedTicket>
  orders?: Array<GroupOrder>
}

export type GuestCustomerDetails = {
  first_name: string
  last_name: string
  address: string
  email: string
  phone_number: string
}

export type GuestCheckoutPayload = CheckoutFreePayload & {
  email: string
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
  transaction_orders?: Array<TransactionOrder>
}

export type PaginatedCustomerTransactions = {
  data: Array<CustomerTransaction>
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

  /** Confirms the order and issues tickets without a payment step. */
  async placeOrder(data: CheckoutFreePayload): Promise<CheckoutResponse> {
    const { data: response } = await api.post<CheckoutResponse>(
      '/v1/customer/temp-transactions/place-order',
      data,
    )
    return response
  },

  async createGuestTempTransaction(
    data: CreateTempTransactionData & { guest: GuestCustomerDetails },
  ): Promise<TempTransactionResponse> {
    const { data: response } = await api.post<TempTransactionResponse>(
      '/v1/public/temp-transactions/guest',
      data,
    )
    return response
  },

  /** Confirms a guest order and issues tickets without a payment step. */
  async guestPlaceOrder(data: GuestCheckoutPayload): Promise<CheckoutResponse> {
    const { data: response } = await api.post<CheckoutResponse>(
      '/v1/public/temp-transactions/guest/place-order',
      data,
    )
    return response
  },

  /** Starts a hosted payment through the activity's payment gateway. */
  async checkout(
    data: GatewayCheckoutPayload,
  ): Promise<GatewayCheckoutResponse> {
    const { data: response } = await api.post<GatewayCheckoutResponse>(
      '/v1/customer/temp-transactions/checkout',
      data,
    )
    return response
  },

  async guestCheckout(
    data: GatewayCheckoutPayload & { email: string },
  ): Promise<GatewayCheckoutResponse> {
    const { data: response } = await api.post<GatewayCheckoutResponse>(
      '/v1/public/temp-transactions/guest/checkout',
      data,
    )
    return response
  },

  /** Verifies the payment with the gateway and issues the tickets once paid. */
  async completePayment(
    transactionUuid: string,
    guestEmail?: string,
  ): Promise<PaymentVerificationResponse> {
    const { data } = await api.post<PaymentVerificationResponse>(
      guestEmail
        ? `/v1/public/transactions/${transactionUuid}/guest/complete`
        : `/v1/customer/transactions/${transactionUuid}/complete`,
      guestEmail ? { email: guestEmail } : {},
    )
    return data
  },

  async cancelPayment(
    transactionUuid: string,
    guestEmail?: string,
  ): Promise<PaymentVerificationResponse> {
    const { data } = await api.post<PaymentVerificationResponse>(
      guestEmail
        ? `/v1/public/transactions/${transactionUuid}/guest/cancel`
        : `/v1/customer/transactions/${transactionUuid}/cancel`,
      guestEmail ? { email: guestEmail } : {},
    )
    return data
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
