import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Flame, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  getCountdownParts,
  type FlashSaleInfo,
} from '@/lib/flashSale'
import { cn } from '@/lib/utils'

type FlashSaleBannerProps = {
  sales: FlashSaleInfo[]
  className?: string
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function CountdownUnit({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <div className="flex min-w-[2.75rem] flex-col items-center rounded-lg border border-white/25 bg-black/40 px-1.5 py-1 backdrop-blur-md sm:min-w-[3.25rem] sm:px-2 sm:py-1.5">
      <span className="font-mono text-base leading-none font-black tracking-tight text-white tabular-nums sm:text-lg">
        {pad(value)}
      </span>
      <span className="mt-0.5 text-[9px] font-bold tracking-[0.14em] text-white/70 uppercase">
        {label}
      </span>
    </div>
  )
}

function FlashSaleCard({
  sale,
  now,
}: {
  sale: FlashSaleInfo
  now: Date
}) {
  const parts = getCountdownParts(sale.targetAt, now)
  if (parts.expired) return null

  const upcoming = sale.phase === 'upcoming'

  return (
    <div
      className={cn(
        'flash-sale-card overflow-hidden rounded-2xl border-2 bg-white/10 backdrop-blur-md',
        upcoming
          ? 'border-paec-orange/70'
          : 'flash-sale-card-live border-red-400/80',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-full flex-col gap-3 px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'flash-sale-label inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-black tracking-[0.14em] uppercase sm:text-base',
                upcoming
                  ? 'border-paec-orange/70 bg-paec-orange/20'
                  : 'border-red-300/70 bg-red-500/20',
              )}
            >
              {upcoming ? (
                <Zap className="size-4 fill-paec-orange text-paec-orange" />
              ) : (
                <Flame className="size-4 fill-red-300 text-red-300" />
              )}
              <span className="flash-sale-label-text">Flash Sales</span>
            </span>
            {!upcoming ? (
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-300/80" />
                <span className="relative inline-flex size-2.5 rounded-full bg-red-400" />
              </span>
            ) : null}
          </div>
          <p className="flash-sale-title mt-2 truncate text-base font-black tracking-tight sm:text-lg">
            {sale.ticketName}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-white/80 sm:text-[13px]">
            {sale.activityName}
            <span className="font-medium text-white/55">
              {' '}
              · {upcoming ? 'Starts in' : 'Ends in'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="flex items-center gap-1.5">
            {parts.days > 0 ? (
              <CountdownUnit value={parts.days} label="Days" />
            ) : null}
            <CountdownUnit value={parts.hours} label="Hrs" />
            <CountdownUnit value={parts.minutes} label="Min" />
            <CountdownUnit value={parts.seconds} label="Sec" />
          </div>
          <Link
            to="/attractions/$attractionId"
            params={{ attractionId: sale.activityId }}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-paec-orange/80 bg-paec-orange px-3.5 text-xs font-black text-white shadow-md shadow-orange-950/30 transition-colors hover:bg-paec-orange-light"
          >
            {upcoming ? 'Get Ready' : 'Grab Deal'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export function FlashSaleBanner({ sales, className }: FlashSaleBannerProps) {
  const [now, setNow] = useState(() => new Date())
  const [index, setIndex] = useState(0)

  const activeSales = useMemo(
    () => sales.filter((sale) => !getCountdownParts(sale.targetAt, now).expired),
    [sales, now],
  )

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (index >= activeSales.length) setIndex(0)
  }, [activeSales.length, index])

  useEffect(() => {
    if (activeSales.length < 2) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % activeSales.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [activeSales.length])

  if (activeSales.length === 0) return null

  const current = activeSales[Math.min(index, activeSales.length - 1)]
  const multi = activeSales.length > 1

  return (
    <div className={cn('mb-5 max-w-3xl', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-white/75 uppercase">
          {multi
            ? `Flash sales · ${index + 1} / ${activeSales.length}`
            : 'Flash sales'}
        </p>
        <div className="flex items-center gap-1.5">
          <Link
            to="/flash-sales"
            className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/90 uppercase transition-colors hover:bg-black/45 hover:text-white"
          >
            View all
          </Link>
          {multi ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setIndex((current) =>
                    current === 0 ? activeSales.length - 1 : current - 1,
                  )
                }
                className="flex size-7 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white transition-colors hover:bg-black/45"
                aria-label="Previous flash sale"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setIndex((current) => (current + 1) % activeSales.length)
                }
                className="flex size-7 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white transition-colors hover:bg-black/45"
                aria-label="Next flash sale"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <FlashSaleCard key={current.ticketId} sale={current} now={now} />

      {multi ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {activeSales.map((sale, saleIndex) => (
            <button
              key={sale.ticketId}
              type="button"
              onClick={() => setIndex(saleIndex)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                saleIndex === index
                  ? 'w-6 bg-paec-orange'
                  : 'w-1.5 bg-white/35 hover:bg-white/55',
              )}
              aria-label={`Show flash sale ${saleIndex + 1}`}
              aria-current={saleIndex === index}
            />
          ))}
        </div>
      ) : null}

      {multi ? (
        <div className="mt-3 hidden gap-2.5 lg:grid lg:grid-cols-2">
          {activeSales
            .filter((sale) => sale.ticketId !== current.ticketId)
            .slice(0, 2)
            .map((sale) => (
              <button
                key={sale.ticketId}
                type="button"
                onClick={() =>
                  setIndex(
                    activeSales.findIndex(
                      (item) => item.ticketId === sale.ticketId,
                    ),
                  )
                }
                className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-left backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-black/35"
              >
                <p className="truncate text-[10px] font-bold tracking-[0.12em] text-paec-orange uppercase">
                  {sale.phase === 'upcoming' ? 'Upcoming' : 'Live'}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-white">
                  {sale.ticketName}
                </p>
                <p className="truncate text-[10px] text-white/60">
                  {sale.activityName}
                </p>
              </button>
            ))}
        </div>
      ) : null}
    </div>
  )
}
