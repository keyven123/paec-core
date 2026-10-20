import { adminApi } from '@/lib/api'

export type EventTicketCoupon = {
  uuid?: string
  name: string
  once_only?: boolean
}

export type AdminEventTicket = {
  uuid: string
  event_uuid: string
  schedule_uuid: string | null
  schedule_time_uuid: string | null
  code: string
  name: string
  ticket_kind: 'regular' | 'gift_certificate'
  description: string | null
  terms_and_conditions: string | null
  price: string
  discount_type: string | null
  discount_value: string | null
  is_bundle: boolean
  bundle_quantity: number | null
  available_from: string | null
  available_to: string | null
  feature_on_flash_sale?: boolean
  flash_sale_from?: string | null
  flash_sale_to?: string | null
  display_order: number
  max_ticket: number
  sold_ticket: number
  status: string
  is_virtual: boolean
  virtual_event_url: string | null
  is_unlimited: boolean
  visit_policy: string | null
  validity_days: number | null
  operation_days?: 'any' | 'weekdays' | 'weekends' | 'custom' | string | null
  operation_custom_days?: Array<string> | null
  operation_hours_from?: string | null
  operation_hours_to?: string | null
  ticket_limit_per_user: number | null
  with_coupon?: boolean
  coupons?: EventTicketCoupon[]
  schedule?: {
    uuid: string
    date_from: string
    date_to: string
  }
  schedule_time?: {
    uuid: string
    time_start: string
    time_end: string
  }
}

export const adminEventTicketService = {
  async getEventTickets(eventUuid: string): Promise<AdminEventTicket[]> {
    const { data } = await adminApi.get<{ data: AdminEventTicket[] }>(
      '/v1/event-tickets',
      { params: { event_uuid: eventUuid, per_page: 100 } },
    )
    return data.data ?? []
  },

  async createTicket(
    payload: Record<string, unknown>,
  ): Promise<AdminEventTicket> {
    const { data } = await adminApi.post<{ data: AdminEventTicket }>(
      '/v1/event-tickets',
      payload,
    )
    return data.data
  },

  async updateTicket(
    ticketUuid: string,
    payload: Record<string, unknown>,
  ): Promise<AdminEventTicket> {
    const { data } = await adminApi.put<{ data: AdminEventTicket }>(
      `/v1/event-tickets/${ticketUuid}`,
      payload,
    )
    return data.data
  },

  async deleteTicket(ticketUuid: string): Promise<void> {
    await adminApi.delete(`/v1/event-tickets/${ticketUuid}`)
  },

  async duplicateTicket(ticketUuid: string): Promise<AdminEventTicket> {
    const { data } = await adminApi.post<{ data: AdminEventTicket }>(
      '/v1/event-tickets/duplicate',
      { uuid: ticketUuid },
    )
    return data.data
  },

  async sendSponsorTickets(payload: {
    event_uuid: string
    event_ticket_uuid: string
    email: string
    quantity: number
    valid_until?: string
  }): Promise<{
    message: string
    data: {
      transaction_uuid: string
      order_number: string
      quantity: number
      recipient: {
        email: string
        uuid: string
        is_new_account: boolean
      }
    }
  }> {
    const { data } = await adminApi.post<{
      success: boolean
      message: string
      data: {
        transaction_uuid: string
        order_number: string
        quantity: number
        recipient: {
          email: string
          uuid: string
          is_new_account: boolean
        }
      }
    }>('/v1/tickets/send-sponsor', payload)
    return { message: data.message, data: data.data }
  },
}
