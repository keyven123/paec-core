import type { CheckoutSession } from '@/lib/checkoutSession'
import type { GatewayCheckoutResponse } from '@/services/transactionService'
import type { PaynamicsChannel } from '@/services/paymentGatewayService'
import { api } from '@/lib/api'

export type CartTicket = {
  event_ticket_uuid: string
  quantity: number
}

/** A cart ticket with its current name and the price checkout charges for one ticket. */
export type CartItemTicket = CartTicket & {
  name: string | null
  unit_price: number | null
  original_unit_price: number | null
}

export type CartItem = {
  uuid: string
  event_uuid: string
  event_name: string | null
  event_slug: string | null
  event_location_uuid: string | null
  visit_date: string
  visit_time?: string | null
  promo_code_uuid: string | null
  tickets: Array<CartItemTicket>
  /** Storefront snapshot used to display the item; the server re-prices at checkout. */
  details: CheckoutSession | null
  updated_at: string
}

export type CartResponse = {
  items: Array<CartItem>
  item_uuid?: string
}

export type CartItemPayload = {
  event_uuid: string
  event_location_uuid: string | null
  visit_date: string
  visit_time?: string | null
  promo_code_uuid: string | null
  tickets: Array<CartTicket>
  details: CheckoutSession
}

export type CartCheckoutPayload = {
  payment_gateway_uuid?: string
  payment_channel?: PaynamicsChannel
  /** Affiliate referral codes keyed by event uuid. */
  affiliate_codes?: Record<string, string>
}

export const cartService = {
  async get(): Promise<CartResponse> {
    const { data } = await api.get<CartResponse>('/v1/customer/cart')
    return data
  },

  async addItem(payload: CartItemPayload): Promise<CartResponse> {
    const { data } = await api.post<CartResponse>(
      '/v1/customer/cart/items',
      payload,
    )
    return data
  },

  async updateItem(
    uuid: string,
    payload: CartItemPayload,
  ): Promise<CartResponse> {
    const { data } = await api.put<CartResponse>(
      `/v1/customer/cart/items/${uuid}`,
      payload,
    )
    return data
  },

  async removeItem(uuid: string): Promise<CartResponse> {
    const { data } = await api.delete<CartResponse>(
      `/v1/customer/cart/items/${uuid}`,
    )
    return data
  },

  /** Pays every activity in the cart with one gateway payment. */
  async checkout(
    payload: CartCheckoutPayload,
  ): Promise<GatewayCheckoutResponse> {
    const { data } = await api.post<GatewayCheckoutResponse>(
      '/v1/customer/cart/checkout',
      payload,
    )
    return data
  },
}
