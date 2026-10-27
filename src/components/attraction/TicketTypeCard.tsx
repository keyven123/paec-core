import { Flame, Gift, Minus, Plus } from 'lucide-react'

import type { TicketType } from '@/data/mockAttractions'
import { ThemedSelect } from '@/components/ui/themed-select'
import type { VisitTimeOption } from '@/lib/visitDate'
import { cn } from '@/lib/utils'

type TicketTypeCardProps = {
  ticket: TicketType
  quantity: number
  unavailable?: boolean
  unavailableReason?: string | null
  visitTime?: string
  visitTimeSlots?: Array<VisitTimeOption>
  onVisitTimeChange?: (value: string) => void
  onDecrease: () => void
  onIncrease: () => void
}

export function TicketTypeCard({
  ticket,
  quantity,
  unavailable = false,
  unavailableReason = null,
  visitTime = '',
  visitTimeSlots,
  onVisitTimeChange,
  onDecrease,
  onIncrease,
}: TicketTypeCardProps) {
  const active = quantity > 0 && !unavailable
  const isFlashSale = !!ticket.featureOnFlashSale && !unavailable
  const showVisitTime =
    !unavailable &&
    Array.isArray(visitTimeSlots) &&
    visitTimeSlots.length > 0 &&
    typeof onVisitTimeChange === 'function'

  const inner = (
    <div
      className={cn(
        'flash-sale-ticket-inner rounded-xl border p-4 transition-colors',
        unavailable
          ? 'border-violet-100 bg-violet-50/40 opacity-70'
          : isFlashSale
            ? 'border-transparent bg-white'
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
          {isFlashSale ? (
            <span className="flash-sale-ticket-badge mt-1.5 inline-flex items-center gap-1 rounded-full border border-orange-300/80 bg-gradient-to-r from-orange-500 to-rose-500 px-2 py-0.5 text-[10px] font-black tracking-wide text-white uppercase shadow-sm shadow-orange-500/25">
              <Flame className="size-3 fill-white/30" />
              Flash Sale
            </span>
          ) : null}
          {ticket.ticketKind === 'gift_certificate' ? (
            <span className="mt-1.5 ml-1 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-paec-orange uppercase ring-1 ring-orange-200">
              <Gift className="size-3" />
              Gift Certificate
            </span>
          ) : null}
          {unavailable ? (
            <span className="mt-1.5 inline-flex max-w-full rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-200">
              {unavailableReason?.trim() || 'Unavailable'}
            </span>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          {ticket.originalPrice ? (
            <p className="mb-1 text-xs leading-none text-muted-foreground line-through">
              ₱{ticket.originalPrice.toLocaleString()}
            </p>
          ) : null}
          <p
            className={cn(
              'text-lg leading-none font-bold',
              isFlashSale ? 'text-orange-600' : 'text-paec-violet',
            )}
          >
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

      {showVisitTime ? (
        <div className="mt-3">
          <ThemedSelect
            label="Visit time"
            value={visitTime}
            onChange={onVisitTimeChange}
            placeholder="Select timeslot"
            options={visitTimeSlots.map((slot) => ({
              value: slot.value,
              label: slot.label,
            }))}
          />
        </div>
      ) : null}

      <div
        className={cn(
          'mt-3 flex items-center justify-between border-t border-dashed pt-3',
          isFlashSale ? 'border-orange-200/80' : 'border-violet-100',
        )}
      >
        <span className="text-xs font-medium text-muted-foreground">
          Quantity
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            disabled={unavailable || quantity === 0}
            className={cn(
              'flex size-8 items-center justify-center rounded-full border bg-white text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              isFlashSale
                ? 'border-orange-200 hover:border-orange-500 hover:text-orange-600 disabled:hover:border-orange-200 disabled:hover:text-foreground'
                : 'border-violet-200 hover:border-paec-violet hover:text-paec-violet disabled:hover:border-violet-200 disabled:hover:text-foreground',
            )}
            aria-label={`Remove one ${ticket.name}`}
          >
            <Minus className="size-3.5" />
          </button>
          <span
            className={cn(
              'w-6 text-center text-sm font-semibold',
              active || isFlashSale
                ? isFlashSale
                  ? 'text-orange-600'
                  : 'text-paec-violet'
                : 'text-foreground',
            )}
          >
            {unavailable ? 0 : quantity}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            disabled={unavailable}
            className={cn(
              'flex size-8 items-center justify-center rounded-full text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              isFlashSale
                ? 'bg-gradient-to-br from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600'
                : 'bg-paec-violet hover:bg-paec-violet-dark',
            )}
            aria-label={`Add one ${ticket.name}`}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  if (!isFlashSale) return inner

  return <div className="flash-sale-ticket-wrap">{inner}</div>
}
