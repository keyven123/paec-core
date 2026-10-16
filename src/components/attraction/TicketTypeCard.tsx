import { Minus, Plus } from 'lucide-react'

import type { TicketType } from '@/data/mockAttractions'
import { cn } from '@/lib/utils'

type TicketTypeCardProps = {
  ticket: TicketType
  quantity: number
  unavailable?: boolean
  onDecrease: () => void
  onIncrease: () => void
}

export function TicketTypeCard({
  ticket,
  quantity,
  unavailable = false,
  onDecrease,
  onIncrease,
}: TicketTypeCardProps) {
  const active = quantity > 0 && !unavailable

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        unavailable
          ? 'border-violet-100 bg-violet-50/40 opacity-70'
          : active
            ? 'border-paec-violet bg-violet-50/60 ring-1 ring-paec-violet/20'
            : 'border-violet-100 bg-white hover:border-violet-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm leading-snug font-semibold text-foreground">
            {ticket.name}
          </p>
          {unavailable ? (
            <span className="mt-1.5 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-200">
              Unavailable
            </span>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          {ticket.originalPrice ? (
            <p className="mb-1 text-xs leading-none text-muted-foreground line-through">
              ₱{ticket.originalPrice.toLocaleString()}
            </p>
          ) : null}
          <p className="text-lg leading-none font-bold text-paec-violet">
            ₱{ticket.price.toLocaleString()}
          </p>
        </div>
      </div>

      {!unavailable && ticket.originalPrice ? (
        <span className="mt-2 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-200">
          Save ₱{(ticket.originalPrice - ticket.price).toLocaleString()}
        </span>
      ) : null}

      {ticket.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {ticket.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-violet-100 pt-3">
        <span className="text-xs font-medium text-muted-foreground">
          Quantity
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            disabled={unavailable || quantity === 0}
            className="flex size-8 items-center justify-center rounded-full border border-violet-200 bg-white text-foreground transition-colors hover:border-paec-violet hover:text-paec-violet disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-violet-200 disabled:hover:text-foreground"
            aria-label={`Remove one ${ticket.name}`}
          >
            <Minus className="size-3.5" />
          </button>
          <span
            className={cn(
              'w-6 text-center text-sm font-semibold',
              active ? 'text-paec-violet' : 'text-foreground',
            )}
          >
            {unavailable ? 0 : quantity}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            disabled={unavailable}
            className="flex size-8 items-center justify-center rounded-full bg-paec-violet text-white transition-colors hover:bg-paec-violet-dark disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Add one ${ticket.name}`}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
