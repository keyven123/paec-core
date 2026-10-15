import { Link } from '@tanstack/react-router'
import { Calendar, MapPin, Minus, Plus, Tag, Trash2 } from 'lucide-react'

import type { CheckoutSession } from '@/lib/checkoutSession'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { getTicketCount } from '@/lib/checkoutSession'
import { cn } from '@/lib/utils'

type CartItemCardProps = {
  session: CheckoutSession
  busy: boolean
  disabled: boolean
  onChangeQuantity: (ticketTypeId: string, delta: number) => void
  onRemove: () => void
}

export function formatVisitDate(value: string) {
  return value
    ? new Date(value).toLocaleDateString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'
}

export function CartItemCard({
  session,
  busy,
  disabled,
  onChangeQuantity,
  onRemove,
}: CartItemCardProps) {
  const ticketCount = getTicketCount(session)
  const locked = busy || disabled

  return (
    <article
      className={cn(
        'rounded-xl border border-violet-100 bg-white p-4 transition-opacity',
        busy && 'opacity-60',
      )}
    >
      <div className="flex gap-3">
        <Link
          to="/attractions/$attractionId"
          params={{ attractionId: session.attractionId }}
          className="size-20 shrink-0 overflow-hidden rounded-lg"
        >
          <ImageWithFallback
            src={session.image}
            alt={session.attractionName}
            className="size-full object-cover"
            fallbackClassName="size-full"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to="/attractions/$attractionId"
              params={{ attractionId: session.attractionId }}
              className="line-clamp-2 text-sm font-semibold text-foreground hover:text-paec-violet"
            >
              {session.attractionName}
            </Link>
            <button
              type="button"
              onClick={onRemove}
              disabled={locked}
              aria-label={`Remove ${session.attractionName} from your cart`}
              className="-mt-1 -mr-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          {session.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0 text-paec-violet" />
              <span className="line-clamp-1">{session.location}</span>
            </p>
          )}
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-paec-violet">
            <Calendar className="size-3 shrink-0" />
            {formatVisitDate(session.visitDate)}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2 border-t border-violet-50 pt-3">
        {session.tickets.map((line) => (
          <li
            key={line.ticketTypeId}
            className="flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{line.name}</p>
              <p className="text-xs text-muted-foreground">
                ₱{line.unitPrice.toLocaleString()} each
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChangeQuantity(line.ticketTypeId, -1)}
                disabled={
                  locked ||
                  line.quantity === 0 ||
                  (line.quantity === 1 && ticketCount === 1)
                }
                aria-label={`Fewer ${line.name} tickets`}
                className="flex size-7 items-center justify-center rounded-full border border-violet-200 text-paec-violet transition-colors hover:bg-violet-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums">
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => onChangeQuantity(line.ticketTypeId, 1)}
                disabled={locked || line.quantity >= 100}
                aria-label={`More ${line.name} tickets`}
                className="flex size-7 items-center justify-center rounded-full border border-violet-200 text-paec-violet transition-colors hover:bg-violet-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-violet-50 pt-3 text-sm">
        <span className="text-muted-foreground">
          {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
          {session.appliedPromoCode && session.promoDiscount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
              <Tag className="size-3" />
              {session.appliedPromoCode.code} −₱
              {session.promoDiscount.toLocaleString()}
            </span>
          )}
        </span>
        <span className="font-semibold text-foreground">
          ₱{session.total.toLocaleString()}
        </span>
      </div>
    </article>
  )
}
