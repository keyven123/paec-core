import { Calendar, MapPin, Tag, Ticket } from 'lucide-react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { CheckoutSession } from '@/lib/checkoutSession'
import { cn } from '@/lib/utils'

type CheckoutOrderSummaryProps = {
  session: CheckoutSession
  className?: string
}

export function CheckoutOrderSummary({
  session,
  className,
}: CheckoutOrderSummaryProps) {
  const visitLabel = session.visitDate
    ? new Date(session.visitDate).toLocaleDateString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  return (
    <aside
      className={cn(
        'overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg',
        className,
      )}
    >
      <div className="bg-paec-violet px-5 py-4 text-white">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <Ticket className="size-3.5" />
          Order Summary
        </div>
        <p className="mt-1 text-lg font-semibold leading-snug">
          {session.attractionName}
        </p>
      </div>

      <div className="p-5">
        <div className="flex gap-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-lg">
            <ImageWithFallback
              src={session.image}
              alt={session.attractionName}
              className="size-full object-cover"
              fallbackClassName="size-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {session.ticketTypeName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ₱{session.unitPrice.toLocaleString()} × {session.quantity}
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0 text-paec-violet" />
              <span className="line-clamp-1">{session.location}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2.5 text-sm">
          <Calendar className="size-4 shrink-0 text-paec-violet" />
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Date of Visit
            </p>
            <p className="font-medium text-foreground">{visitLabel}</p>
          </div>
        </div>

        <div className="mt-5 space-y-2 border-t border-violet-100 pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>₱{session.subtotal.toLocaleString()}</span>
          </div>
          {session.appliedPromoCode && session.promoDiscount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Tag className="size-3.5" />
                Promo{' '}
                <span className="font-mono text-xs">{session.appliedPromoCode.code}</span>
              </span>
              <span className="font-medium text-emerald-600">
                −₱{session.promoDiscount.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex items-end justify-between pt-1">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Total
            </p>
            <p className="text-2xl font-bold text-foreground">
              ₱{session.total.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {session.quantity} ticket{session.quantity !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </aside>
  )
}
