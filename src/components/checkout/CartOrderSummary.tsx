import { ShoppingCart } from 'lucide-react'

import type { CheckoutSession } from '@/lib/checkoutSession'
import { formatVisitDate } from '@/components/checkout/CartItemCard'
import { getTicketCount } from '@/lib/checkoutSession'

export function CartOrderSummary({
  sessions,
}: {
  sessions: Array<CheckoutSession>
}) {
  const ticketCount = sessions.reduce(
    (sum, session) => sum + getTicketCount(session),
    0,
  )
  const promoDiscount = sessions.reduce(
    (sum, session) => sum + session.promoDiscount,
    0,
  )
  const subtotal = sessions.reduce((sum, session) => sum + session.subtotal, 0)
  const total = sessions.reduce((sum, session) => sum + session.total, 0)

  return (
    <aside className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg">
      <div className="bg-paec-violet px-5 py-4 text-white">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <ShoppingCart className="size-3.5" />
          Order Summary
        </div>
        <p className="mt-1 text-lg font-semibold leading-snug">
          {sessions.length} activit{sessions.length === 1 ? 'y' : 'ies'} in your
          cart
        </p>
      </div>

      <div className="p-5">
        <ul className="space-y-3">
          {sessions.map((session, index) => (
            <li
              key={`${session.eventUuid}-${session.visitDate}-${index}`}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="line-clamp-1 font-medium text-foreground">
                  {session.attractionName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatVisitDate(session.visitDate)} ·{' '}
                  {getTicketCount(session)} ticket
                  {getTicketCount(session) !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="shrink-0 font-medium text-foreground">
                ₱{session.total.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2 border-t border-violet-100 pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          {promoDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-emerald-600">
              <span>Promo discounts</span>
              <span className="font-medium">
                −₱{promoDiscount.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex items-end justify-between pt-1">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Total
            </p>
            <p className="text-2xl font-bold text-foreground">
              ₱{total.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} · paid in one
            payment
          </p>
        </div>
      </div>
    </aside>
  )
}
