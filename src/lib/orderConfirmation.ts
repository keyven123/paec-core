import type { CheckoutSession } from '@/lib/checkoutSession'
import type { CheckoutResponse } from '@/services/transactionService'

const ORDER_CONFIRMATION_KEY = 'paec_order_confirmation'

export type ConfirmedTicket = {
  uuid: string
  ticketNumber: string
  ticketTypeName: string
  qrCode: string | null
  status: string
}

export type OrderConfirmation = {
  orderNumber: string
  /** Order-level QR; scanning it admits every ticket in the order. */
  orderQrCode?: string | null
  holderName: string
  email: string
  isGuest: boolean
  confirmedAt: string
  order: CheckoutSession
  tickets: Array<ConfirmedTicket>
}

export function buildOrderConfirmation(
  order: CheckoutSession,
  response: CheckoutResponse,
  customer: { name: string; email: string; isGuest: boolean },
): OrderConfirmation {
  const tickets = (response.tickets ?? []).map((ticket) => ({
    uuid: ticket.uuid,
    ticketNumber:
      ticket.ticket_number ??
      `TKT-${ticket.uuid.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
    ticketTypeName:
      ticket.event_ticket?.name ??
      order.tickets.find(
        (line) => line.ticketTypeId === ticket.event_ticket_uuid,
      )?.name ??
      'Admission',
    qrCode: ticket.qr_code,
    status: ticket.status,
  }))

  return {
    orderNumber: response.transaction?.order_number ?? '',
    orderQrCode: response.transaction?.qr_code ?? null,
    holderName: customer.name,
    email: customer.email,
    isGuest: customer.isGuest,
    confirmedAt: response.transaction?.paid_at ?? new Date().toISOString(),
    order,
    tickets,
  }
}

export function saveOrderConfirmation(confirmation: OrderConfirmation): void {
  sessionStorage.setItem(ORDER_CONFIRMATION_KEY, JSON.stringify(confirmation))
}

export function loadOrderConfirmation(): OrderConfirmation | null {
  try {
    const raw = sessionStorage.getItem(ORDER_CONFIRMATION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as OrderConfirmation
  } catch {
    return null
  }
}
