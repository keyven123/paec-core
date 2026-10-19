import type { CheckoutSession } from '@/lib/checkoutSession'
import type {
  CheckoutResponse,
  GroupOrder,
} from '@/services/transactionService'
import { clearAffiliateRef } from '@/lib/affiliateRef'

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

/**
 * Confirmations for every order paid together (one per activity in a cart checkout).
 */
export function buildGroupOrderConfirmations(
  orders: Array<{ transactionUuid: string; order: CheckoutSession }>,
  placed: Array<GroupOrder>,
  customer: { name: string; email: string; isGuest: boolean },
): Array<OrderConfirmation> {
  return orders.flatMap(({ transactionUuid, order }) => {
    const match = placed.find(
      (item) => item.transaction.uuid === transactionUuid,
    )
    return match
      ? [
          buildOrderConfirmation(
            order,
            {
              success: true,
              transaction: match.transaction,
              tickets: match.tickets,
            },
            customer,
          ),
        ]
      : []
  })
}

export function saveOrderConfirmation(
  confirmation: OrderConfirmation | Array<OrderConfirmation>,
): void {
  sessionStorage.setItem(ORDER_CONFIRMATION_KEY, JSON.stringify(confirmation))

  // The purchase went through, so the stored affiliate referral no longer applies.
  const confirmations = Array.isArray(confirmation)
    ? confirmation
    : [confirmation]
  for (const { order } of confirmations) {
    clearAffiliateRef(order.eventUuid, order.attractionId)
  }
}

export function loadOrderConfirmations(): Array<OrderConfirmation> {
  try {
    const raw = sessionStorage.getItem(ORDER_CONFIRMATION_KEY)
    if (!raw) return []
    const stored = JSON.parse(raw) as
      | OrderConfirmation
      | Array<OrderConfirmation>
    return Array.isArray(stored) ? stored : [stored]
  } catch {
    return []
  }
}
