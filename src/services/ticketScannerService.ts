import { adminApi } from '@/lib/api'

export type TicketDetails = {
  uuid: string
  event_uuid: string
  status: string
  attendee_name: string
  qr_code: string
  used_at: string | null
  ticket_number?: string
  event_ticket?: { name: string } | null
  date_of_visit?: string | null
  other_info?: Record<string, unknown> | null
  user?: {
    uuid: string
    name: string
    email: string
  }
  transaction?: {
    order_number: string
  }
}

export type ScheduleRestrictionErrorResponse = {
  success: boolean
  code?:
    | 'schedule_not_started'
    | 'schedule_ended'
    | 'visit_not_today'
    | 'visit_expired'
    | string
  message?: string
  meta?: {
    schedule_start?: string
    schedule_end?: string
    allowed_from?: string
    allowed_until?: string
    visit_date?: string
    valid_until?: string
    today?: string
    attendee_name?: string | null
  }
  /** Present when a group (order) QR is blocked, so its tickets can still be listed. */
  data?: OrderScanDetails
}

export type OrderScanTicket = TicketDetails & {
  entry_restriction: string | null
}

/** Every ticket in an order, found by the order's group QR code. */
export type OrderScanDetails = {
  uuid: string
  order_number: string
  qr_code: string
  event_uuid: string | null
  holder_name: string | null
  date_of_visit: string | null
  admittable_count: number
  tickets: Array<OrderScanTicket>
}

export const ticketScannerService = {
  async getTicketsDetailByQrCode(
    qrCode: string,
    eventUuid?: string,
  ): Promise<TicketDetails> {
    const { data } = await adminApi.get<{ data: TicketDetails }>(
      '/v1/tickets/qr-code/details',
      {
        params: {
          qr_code: qrCode,
          event_uuid: eventUuid,
        },
      },
    )
    return data.data
  },

  async confirmEntry(ticketUuid: string): Promise<TicketDetails> {
    const { data } = await adminApi.post<{ data: TicketDetails }>(
      `/v1/tickets/${ticketUuid}/confirm-entry`,
    )
    return data.data
  },

  async getOrderDetailsByQrCode(
    qrCode: string,
    eventUuid?: string,
  ): Promise<OrderScanDetails> {
    const { data } = await adminApi.get<{ data: OrderScanDetails }>(
      '/v1/tickets/order-qr/details',
      { params: { qr_code: qrCode, event_uuid: eventUuid } },
    )
    return data.data
  },

  async confirmOrderEntry(
    qrCode: string,
    eventUuid?: string,
  ): Promise<{ admitted_count: number; data: OrderScanDetails }> {
    const { data } = await adminApi.post<{
      admitted_count: number
      data: OrderScanDetails
    }>('/v1/tickets/order-qr/confirm-entry', {
      qr_code: qrCode,
      event_uuid: eventUuid,
    })
    return data
  },
}
