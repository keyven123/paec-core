import type { CheckoutSession, CheckoutTicketLine } from '@/lib/checkoutSession'
import type {
  CartItem,
  CartItemPayload,
  CartResponse,
} from '@/services/cartService'
import { getPromoDiscountAmount } from '@/lib/promoUtils'
import { cartService } from '@/services/cartService'

/** Recomputes the display totals of a booking from its ticket lines. */
export function priceSession(session: CheckoutSession): CheckoutSession {
  const subtotal = session.tickets.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  )
  const promo = session.appliedPromoCode
  const promoDiscount =
    promo?.discountType && promo.discountValue
      ? getPromoDiscountAmount(subtotal, {
          discount_type: promo.discountType,
          discount_value: promo.discountValue,
        })
      : Math.min(Number(session.promoDiscount) || 0, subtotal)

  return {
    ...session,
    subtotal,
    promoDiscount,
    total: Math.max(0, subtotal - promoDiscount),
  }
}

/**
 * The booking shown for a cart item. Quantities, ticket names and prices come from the server;
 * the saved details only fill in the rest, and may be incomplete for older cart items.
 */
export function cartItemSession(item: CartItem): CheckoutSession {
  const details: Partial<CheckoutSession> = item.details ?? {}
  const savedLines: Array<CheckoutTicketLine> = Array.isArray(details.tickets)
    ? details.tickets
    : []
  const serverTickets = new Map(
    item.tickets.map((ticket) => [ticket.event_ticket_uuid, ticket]),
  )

  const lines = savedLines.map((line) => {
    const ticket = serverTickets.get(line.ticketTypeId)
    return {
      ...line,
      name: ticket?.name ?? line.name,
      unitPrice: ticket?.unit_price ?? line.unitPrice,
      originalUnitPrice: ticket?.original_unit_price ?? line.originalUnitPrice,
      quantity: ticket?.quantity ?? 0,
    }
  })
  for (const ticket of item.tickets) {
    if (lines.some((line) => line.ticketTypeId === ticket.event_ticket_uuid)) {
      continue
    }
    lines.push({
      ticketTypeId: ticket.event_ticket_uuid,
      name: ticket.name ?? 'Ticket',
      unitPrice: ticket.unit_price ?? 0,
      originalUnitPrice: ticket.original_unit_price ?? undefined,
      quantity: ticket.quantity,
    })
  }

  return priceSession({
    attractionId: item.event_slug ?? item.event_uuid,
    attractionName: item.event_name ?? 'Activity',
    location: '',
    image: '',
    promoDiscount: 0,
    ...details,
    eventUuid: item.event_uuid,
    eventLocationUuid: item.event_location_uuid ?? '',
    visitDate: item.visit_date,
    tickets: lines,
    subtotal: 0,
    total: 0,
  })
}

export function cartItemPayload(session: CheckoutSession): CartItemPayload {
  return {
    event_uuid: session.eventUuid,
    event_location_uuid: session.eventLocationUuid || null,
    visit_date: session.visitDate,
    promo_code_uuid: session.appliedPromoCode?.uuid ?? null,
    tickets: session.tickets
      .filter((line) => line.quantity > 0)
      .map((line) => ({
        event_ticket_uuid: line.ticketTypeId,
        quantity: line.quantity,
      })),
    details: priceSession(session),
  }
}

function mergeLines(
  current: Array<CheckoutTicketLine>,
  added: Array<CheckoutTicketLine>,
): Array<CheckoutTicketLine> {
  const merged = current.map((line) => ({ ...line }))
  for (const line of added) {
    const existing = merged.find(
      (item) => item.ticketTypeId === line.ticketTypeId,
    )
    if (existing) existing.quantity += line.quantity
    else merged.push({ ...line })
  }
  return merged
}

/**
 * Adds a booking to the signed-in customer's cart. Booking the same activity, location and
 * date again adds the tickets to that cart item instead of creating a second one.
 */
export async function addSessionToCart(
  session: CheckoutSession,
): Promise<CartResponse> {
  const { items } = await cartService.get()
  const match = items.find(
    (item) =>
      item.event_uuid === session.eventUuid &&
      (item.event_location_uuid ?? '') === (session.eventLocationUuid || '') &&
      item.visit_date === session.visitDate,
  )

  if (!match) return cartService.addItem(cartItemPayload(session))

  const current = cartItemSession(match)
  return cartService.updateItem(
    match.uuid,
    cartItemPayload({
      ...current,
      tickets: mergeLines(current.tickets, session.tickets),
      appliedPromoCode: session.appliedPromoCode ?? current.appliedPromoCode,
    }),
  )
}
