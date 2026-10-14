import { useId, useState } from 'react'

import { cn } from '@/lib/utils'

type Point = { x: number; y: number }

/** Catmull-Rom curve through the points, drawn as cubic Béziers. */
function smoothPath(points: Array<Point>): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x},${points[0].y}`

  let path = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    path += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`
  }
  return path
}

export function Sparkline({
  values,
  color,
  className,
}: {
  values: Array<number>
  color: string
  className?: string
}) {
  const gradientId = useId()
  const width = 120
  const height = 36
  const max = Math.max(...values, 0)
  const series = values.length > 1 ? values : [0, ...values, 0]
  const points = series.map((value, index) => ({
    x: (index / (series.length - 1)) * width,
    y: max > 0 ? height - 3 - (value / max) * (height - 8) : height - 3,
  }))
  const line = smoothPath(points)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-9 w-full overflow-visible', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={`${line} L${width},${height} L0,${height} Z`}
        fill={`url(#${gradientId})`}
      />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function niceMax(value: number): number {
  if (value <= 0) return 1000
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value / 4) ?? 10
  return Math.ceil(value / (step * magnitude)) * step * magnitude
}

function compactPeso(value: number): string {
  const short = (n: number) => String(Number(n.toFixed(1)))
  if (value >= 1_000_000) return `₱${short(value / 1_000_000)}M`
  if (value >= 1_000) return `₱${short(value / 1_000)}K`
  return `₱${Math.round(value)}`
}

export type RevenueBar = {
  label: string
  date: string
  revenue: number
  orders: number
  tickets: number
}

export function RevenueBarChart({
  data,
  formatTooltipDate,
}: {
  data: Array<RevenueBar>
  formatTooltipDate: (bar: RevenueBar) => string
}) {
  const [active, setActive] = useState<number | null>(null)
  const top = niceMax(Math.max(...data.map((bar) => bar.revenue), 0))
  const ticks = [4, 3, 2, 1, 0].map((step) => (top / 4) * step)
  const labelEvery = data.length > 14 ? Math.ceil(data.length / 8) : 1

  return (
    <div className="flex h-full min-h-[260px] gap-3">
      <div className="flex shrink-0 flex-col justify-between pb-7 text-right text-[11px] text-muted-foreground tabular-nums">
        {ticks.map((tick) => (
          <span key={tick} className="leading-none">
            {compactPeso(tick)}
          </span>
        ))}
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="relative flex-1">
          {ticks.map((tick, index) => (
            <div
              key={tick}
              className={cn(
                'absolute inset-x-0 border-t',
                index === ticks.length - 1
                  ? 'border-violet-200'
                  : 'border-dashed border-violet-100',
              )}
              style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-[3px] sm:gap-1.5">
            {data.map((bar, index) => {
              const height = (bar.revenue / top) * 100
              const isActive = active === index
              return (
                <button
                  key={bar.date}
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  aria-label={`${formatTooltipDate(bar)}: ${compactPeso(bar.revenue)} revenue`}
                  className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
                >
                  <span
                    className={cn(
                      'w-full max-w-[44px] rounded-t-md bg-gradient-to-t from-paec-violet to-[#a78bfa] transition-all duration-300',
                      bar.revenue > 0 ? 'min-h-[3px]' : 'min-h-0',
                      isActive ? 'opacity-100' : 'opacity-85',
                      active !== null && !isActive && 'opacity-40',
                    )}
                    style={{ height: `${height}%` }}
                  />
                  {isActive ? (
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-[11px] leading-relaxed text-white shadow-lg">
                      <span className="block font-semibold">
                        {formatTooltipDate(bar)}
                      </span>
                      <span className="block text-white/80">
                        Revenue{' '}
                        <span className="font-semibold text-white">
                          ₱
                          {bar.revenue.toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </span>
                      <span className="block text-white/80">
                        {bar.orders} {bar.orders === 1 ? 'order' : 'orders'} ·{' '}
                        {bar.tickets} {bar.tickets === 1 ? 'ticket' : 'tickets'}
                      </span>
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex h-7 items-end gap-[3px] sm:gap-1.5">
          {data.map((bar, index) => (
            <span
              key={bar.date}
              className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground sm:text-[11px]"
            >
              {index % labelEvery === 0 ? bar.label : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export type DonutSegment = { label: string; value: number; color: string }

export function DonutChart({
  segments,
  centerLabel,
}: {
  segments: Array<DonutSegment>
  centerLabel: string
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="relative mx-auto size-40 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#f1edfb"
          strokeWidth="12"
        />
        {total > 0
          ? segments
              .filter((segment) => segment.value > 0)
              .map((segment) => {
                const length = (segment.value / total) * circumference
                const dash = Math.max(length - 1.2, 0.01)
                const circle = (
                  <circle
                    key={segment.label}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                  />
                )
                offset += length
                return circle
              })
          : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {total.toLocaleString()}
        </span>
        <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  )
}
