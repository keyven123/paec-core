import { Link } from '@tanstack/react-router'
import { ChevronRight, Flame, MapPin, Zap } from 'lucide-react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import {
  getCountdownParts,
  type FlashSaleInfo,
} from '@/lib/flashSale'
import { formatPesoValue as formatPrice } from '@/lib/discountLabel'
import { cn } from '@/lib/utils'

type FlashSaleTicketCardProps = {
  sale: FlashSaleInfo
  now: Date
  className?: string
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function CountdownUnit({
  value,
  label,
  compact,
}: {
  value: number
  label: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-white/25 bg-black/55 backdrop-blur-sm',
        compact ? 'min-w-[2.4rem] px-1 py-1' : 'min-w-[2.75rem] px-1.5 py-1.5',
      )}
    >
      <span
        className={cn(
          'font-mono leading-none font-black tracking-tight text-white tabular-nums',
          compact ? 'text-sm' : 'text-base',
        )}
      >
        {pad(value)}
      </span>
      <span className="mt-0.5 text-[8px] font-bold tracking-[0.12em] text-white/70 uppercase">
        {label}
      </span>
    </div>
  )
}

export function FlashSaleTicketCard({
  sale,
  now,
  className,
}: FlashSaleTicketCardProps) {
  const parts = getCountdownParts(sale.targetAt, now)
  if (parts.expired) return null

  const upcoming = sale.phase === 'upcoming'

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <Link
        to="/attractions/$attractionId"
        params={{ attractionId: sale.activityId }}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <ImageWithFallback
            src={sale.image}
            alt={sale.activityName}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackClassName="size-full"
          />

          <span
            className={cn(
              'absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black tracking-[0.12em] text-white uppercase shadow-sm sm:top-3 sm:left-3 sm:px-2.5 sm:text-[11px]',
              upcoming
                ? 'border-paec-orange/80 bg-paec-orange/90'
                : 'border-red-300/80 bg-red-600/90',
            )}
          >
            {upcoming ? (
              <Zap className="size-3 fill-white" />
            ) : (
              <Flame className="size-3 fill-white" />
            )}
            Flash Sale
          </span>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2.5 pt-10 pb-2.5 sm:px-3 sm:pb-3">
            <p className="mb-1.5 text-[10px] font-bold tracking-wide text-white/80 uppercase">
              {upcoming ? 'Starts in' : 'Ends in'}
            </p>
            <div className="flex items-center gap-1.5">
              {parts.days > 0 ? (
                <CountdownUnit value={parts.days} label="Days" compact />
              ) : null}
              <CountdownUnit value={parts.hours} label="Hrs" compact />
              <CountdownUnit value={parts.minutes} label="Min" compact />
              <CountdownUnit value={parts.seconds} label="Sec" compact />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <p className="text-[10px] font-bold tracking-wider text-paec-violet uppercase">
            {sale.categoryLabel}
          </p>
          <h3 className="line-clamp-2 text-sm leading-snug font-bold text-foreground sm:text-base">
            {sale.ticketName}
          </h3>
          <p className="line-clamp-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
            {sale.activityName}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs">
            <MapPin className="size-3 shrink-0" />
            <span className="line-clamp-1">{sale.location}</span>
          </p>

          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <div className="min-w-0">
              <span className="block text-[10px] text-muted-foreground">From</span>
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                {sale.originalPrice != null ? (
                  <span className="text-[11px] text-muted-foreground line-through sm:text-xs">
                    ₱{formatPrice(sale.originalPrice)}
                  </span>
                ) : null}
                <span className="text-sm font-bold text-foreground sm:text-base">
                  ₱{formatPrice(sale.price)}
                </span>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-paec-orange px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-paec-orange-light sm:px-3.5">
              {upcoming ? 'Get Ready' : 'Book'}
              <ChevronRight className="hidden size-3.5 sm:block" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
