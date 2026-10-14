import { Link } from '@tanstack/react-router'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronRight,
  MapPin,
  Plus,
  Receipt,
  ShoppingBag,
  Sparkles,
  Ticket,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  DashboardKpi,
  DashboardOverview,
  DashboardPeriod,
} from '@/services/adminDashboardService'
import type { AdminUser } from '@/lib/adminAuth'
import {
  DonutChart,
  RevenueBarChart,
  Sparkline,
} from '@/components/admin/dashboard/DashboardCharts'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { getApiErrorMessage } from '@/lib/api'
import { resolveImageUrl } from '@/lib/imageUtils'
import { cn } from '@/lib/utils'
import { adminDashboardService } from '@/services/adminDashboardService'

type AdminDashboardHomeProps = {
  user: AdminUser
}

const PERIODS: Array<{ key: DashboardPeriod; label: string; title: string }> = [
  { key: '7d', label: '7D', title: 'Last 7 days' },
  { key: '30d', label: '30D', title: 'Last 30 days' },
  { key: 'year', label: 'This year', title: 'This year' },
]

const TICKET_STATUS_GROUPS: Array<{
  label: string
  statuses: Array<string>
  color: string
}> = [
  { label: 'Active', statuses: ['active'], color: '#7c3aed' },
  { label: 'Used', statuses: ['used'], color: '#10b981' },
  {
    label: 'Awaiting payment',
    statuses: ['pending', 'inactive'],
    color: '#f59e0b',
  },
  { label: 'Expired', statuses: ['expired'], color: '#f97316' },
  {
    label: 'Cancelled / transferred',
    statuses: ['cancelled', 'transferred'],
    color: '#94a3b8',
  },
]

function peso(value: number, fractionDigits = 2): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function visitCountdown(date: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round(
    (parseDate(date).getTime() - today.getTime()) / 86_400_000,
  )
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'G'
  )
}

function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-2xl border border-violet-100/80 bg-white shadow-[0_1px_2px_rgba(76,29,149,0.04),0_8px_24px_-12px_rgba(76,29,149,0.12)]',
        className,
      )}
    >
      {children}
    </section>
  )
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function ViewAllLink({
  to,
}: {
  to: '/admin/transaction' | '/admin/activities'
}) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-paec-violet transition-colors hover:text-paec-violet-dark"
    >
      View all
      <ChevronRight className="size-3.5" />
    </Link>
  )
}

function ChangePill({
  change,
  compareLabel,
}: {
  change: number | null
  compareLabel: string
}) {
  if (change === null) {
    return (
      <p className="text-[11px] text-muted-foreground">
        No data {compareLabel.replace(/^vs /, 'for ')}
      </p>
    )
  }
  const up = change >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
          up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
        )}
      >
        <Icon className="size-3" />
        {Math.abs(change).toLocaleString('en-US', { maximumFractionDigits: 1 })}
        %
      </span>
      {compareLabel}
    </p>
  )
}

function KpiCard({
  label,
  icon: Icon,
  tone,
  color,
  value,
  kpi,
  compareLabel,
  loading,
}: {
  label: string
  icon: LucideIcon
  tone: string
  color: string
  value: string
  kpi: DashboardKpi | undefined
  compareLabel: string
  loading: boolean
}) {
  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            tone,
          )}
        >
          <Icon className="size-4" />
        </span>
        <p className="truncate text-xs font-medium text-muted-foreground sm:text-[13px]">
          {label}
        </p>
      </div>
      {loading || !kpi ? (
        <div className="mt-4 space-y-2">
          <div className="h-7 w-2/3 animate-pulse rounded-md bg-violet-100/70" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-violet-50" />
        </div>
      ) : (
        <>
          <p className="mt-3 truncate text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
            {value}
          </p>
          <div className="mt-1">
            <ChangePill change={kpi.change} compareLabel={compareLabel} />
          </div>
          <Sparkline values={kpi.trend} color={color} className="mt-3" />
        </>
      )}
    </Card>
  )
}

export function AdminDashboardHome({ user }: AdminDashboardHomeProps) {
  const firstName = user.name.split(' ')[0]
  const [period, setPeriod] = useState<DashboardPeriod>('year')
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    adminDashboardService
      .getOverview(period)
      .then((data) => {
        if (!cancelled) setOverview(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load dashboard.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [period])

  const kpis = overview?.kpis
  const compareLabel = overview?.period.compare_label ?? ''
  const periodTitle =
    PERIODS.find((option) => option.key === period)?.title ?? 'This year'
  const series = overview?.series ?? []
  const periodRevenue = series.reduce((sum, bar) => sum + bar.revenue, 0)
  const statusSegments = TICKET_STATUS_GROUPS.map((group) => ({
    label: group.label,
    color: group.color,
    value: group.statuses.reduce(
      (sum, status) => sum + (overview?.ticket_statuses[status] ?? 0),
      0,
    ),
  }))
  const statusTotal = statusSegments.reduce((sum, s) => sum + s.value, 0)
  const topAttractions = overview?.top_attractions ?? []
  const topRevenue = Math.max(...topAttractions.map((row) => row.revenue), 1)
  const showSkeleton = loading && !overview

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-paec-violet uppercase">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s how your attractions are performing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Dashboard period"
            className="inline-flex rounded-xl border border-violet-100 bg-white p-1 shadow-sm"
          >
            {PERIODS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={period === option.key}
                onClick={() => setPeriod(option.key)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  period === option.key
                    ? 'bg-paec-violet text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-violet-50 hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Link
            to="/admin/activities/create"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-paec-violet to-paec-orange px-4 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Create Attraction
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        <KpiCard
          label="Total Revenue"
          icon={Banknote}
          tone="bg-orange-100 text-paec-orange"
          color="#f97316"
          value={kpis ? peso(kpis.revenue.value) : ''}
          kpi={kpis?.revenue}
          compareLabel={compareLabel}
          loading={showSkeleton}
        />
        <KpiCard
          label="Paid Orders"
          icon={ShoppingBag}
          tone="bg-violet-100 text-paec-violet"
          color="#7c3aed"
          value={kpis ? kpis.orders.value.toLocaleString() : ''}
          kpi={kpis?.orders}
          compareLabel={compareLabel}
          loading={showSkeleton}
        />
        <KpiCard
          label="Tickets Sold"
          icon={Ticket}
          tone="bg-emerald-100 text-emerald-600"
          color="#10b981"
          value={kpis ? kpis.tickets_sold.value.toLocaleString() : ''}
          kpi={kpis?.tickets_sold}
          compareLabel={compareLabel}
          loading={showSkeleton}
        />
        <KpiCard
          label="Avg. Order Value"
          icon={Receipt}
          tone="bg-sky-100 text-sky-600"
          color="#0ea5e9"
          value={kpis ? peso(kpis.average_order_value.value) : ''}
          kpi={kpis?.average_order_value}
          compareLabel={compareLabel}
          loading={showSkeleton}
        />
        <Card className="col-span-2 flex flex-col p-4 sm:col-span-1 sm:p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Sparkles className="size-4" />
            </span>
            <p className="truncate text-xs font-medium text-muted-foreground sm:text-[13px]">
              Live Attractions
            </p>
          </div>
          {showSkeleton || !kpis ? (
            <div className="mt-4 space-y-2">
              <div className="h-7 w-1/3 animate-pulse rounded-md bg-violet-100/70" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-violet-50" />
            </div>
          ) : (
            <>
              <p className="mt-3 text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
                {kpis.attractions.published}
                <span className="text-sm font-medium text-muted-foreground">
                  {' '}
                  / {kpis.attractions.total}
                </span>
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Published and open for booking
              </p>
              <div className="mt-auto pt-4">
                <div className="h-2 overflow-hidden rounded-full bg-amber-50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-paec-orange"
                    style={{
                      width: `${kpis.attractions.total > 0 ? (kpis.attractions.published / kpis.attractions.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <Link
                  to="/admin/activities"
                  className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-paec-violet hover:text-paec-violet-dark"
                >
                  Manage attractions
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-5">
        <Card className="flex flex-col pb-5 xl:col-span-3">
          <CardHeader
            title="Revenue Overview"
            subtitle={
              overview ? (
                <>
                  <span className="font-semibold text-foreground">
                    {peso(periodRevenue)}
                  </span>{' '}
                  · {periodTitle}
                </>
              ) : (
                periodTitle
              )
            }
            action={
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="size-2 rounded-full bg-paec-violet" />
                Revenue
              </span>
            }
          />
          <div className="mt-4 flex-1 px-5">
            {showSkeleton ? (
              <div className="h-[260px] animate-pulse rounded-xl bg-violet-50/70" />
            ) : (
              <RevenueBarChart
                data={series}
                formatTooltipDate={(bar) =>
                  period === 'year'
                    ? parseDate(bar.date).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : parseDate(bar.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                }
              />
            )}
          </div>
        </Card>

        <Card className="flex flex-col pb-5 xl:col-span-2">
          <CardHeader
            title="Upcoming Visits"
            subtitle="Booked dates in the next 60 days"
            action={<ViewAllLink to="/admin/transaction" />}
          />
          <div className="mt-4 flex-1 px-5">
            {showSkeleton ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((key) => (
                  <div
                    key={key}
                    className="h-[220px] animate-pulse rounded-xl bg-violet-50/70"
                  />
                ))}
              </div>
            ) : (overview?.upcoming_visits.length ?? 0) === 0 ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/30 px-6 text-center">
                <CalendarDays className="size-8 text-violet-300" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No upcoming visits
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Booked visit dates will show up here.
                </p>
              </div>
            ) : (
              <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
                {overview?.upcoming_visits.map((visit) => {
                  const date = parseDate(visit.date)
                  return (
                    <li
                      key={`${visit.event_uuid}-${visit.date}`}
                      className="w-[168px] shrink-0 snap-start overflow-hidden rounded-xl border border-violet-100 bg-white"
                    >
                      <div className="relative h-[104px] bg-violet-50">
                        <ImageWithFallback
                          src={resolveImageUrl(visit.image_url)}
                          alt={visit.name}
                          className="size-full object-cover"
                          fallbackClassName="size-full"
                        />
                        <div className="absolute top-2 left-2 flex w-11 flex-col items-center overflow-hidden rounded-lg bg-white text-center shadow-md">
                          <span className="w-full bg-paec-orange py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                            {date.toLocaleDateString('en-US', {
                              month: 'short',
                            })}
                          </span>
                          <span className="py-0.5 text-base leading-tight font-bold text-foreground">
                            {date.getDate()}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 h-8 overflow-hidden text-[13px] leading-4 font-semibold text-foreground">
                          {visit.name}
                        </p>
                        {visit.location ? (
                          <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground capitalize">
                            <MapPin className="size-3 shrink-0" />
                            {visit.location}
                          </p>
                        ) : null}
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-paec-violet">
                            {visit.tickets}{' '}
                            {visit.tickets === 1 ? 'guest' : 'guests'}
                          </span>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {visitCountdown(visit.date)}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="pb-3">
          <CardHeader
            title="Recent Bookings"
            subtitle="Latest paid orders"
            action={<ViewAllLink to="/admin/transaction" />}
          />
          <div className="mt-3 px-2">
            {showSkeleton ? (
              <div className="space-y-2 px-3 pb-2">
                {[0, 1, 2, 3].map((key) => (
                  <div
                    key={key}
                    className="h-12 animate-pulse rounded-lg bg-violet-50/70"
                  />
                ))}
              </div>
            ) : (overview?.recent_bookings.length ?? 0) === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                No bookings yet
              </p>
            ) : (
              <ul>
                {overview?.recent_bookings.map((booking) => (
                  <li
                    key={booking.uuid}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-violet-50/50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-orange-100 text-xs font-bold text-paec-violet">
                      {initials(booking.customer_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {booking.customer_name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {booking.tickets}{' '}
                        {booking.tickets === 1 ? 'ticket' : 'tickets'} ·{' '}
                        {booking.attraction ?? 'Booking'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-bold text-foreground tabular-nums">
                        {peso(booking.total_amount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {timeAgo(booking.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="pb-5">
          <CardHeader title="Tickets Overview" subtitle={periodTitle} />
          <div className="mt-4 flex flex-col items-center gap-5 px-5 sm:flex-row xl:flex-col 2xl:flex-row">
            {showSkeleton ? (
              <div className="size-40 animate-pulse rounded-full bg-violet-50" />
            ) : (
              <DonutChart
                segments={statusSegments}
                centerLabel="Total tickets"
              />
            )}
            <ul className="w-full min-w-0 flex-1 space-y-2.5">
              {statusSegments.map((segment) => (
                <li
                  key={segment.label}
                  className="flex items-center gap-2.5 text-[13px]"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {segment.label}
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {segment.value.toLocaleString()}
                  </span>
                  <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                    {statusTotal > 0
                      ? `${((segment.value / statusTotal) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="pb-5 lg:col-span-2 xl:col-span-1">
          <CardHeader
            title="Top Performing Attractions"
            subtitle={`By revenue · ${periodTitle}`}
            action={<ViewAllLink to="/admin/activities" />}
          />
          <div className="mt-4 px-5">
            {showSkeleton ? (
              <div className="space-y-3">
                {[0, 1, 2].map((key) => (
                  <div
                    key={key}
                    className="h-11 animate-pulse rounded-lg bg-violet-50/70"
                  />
                ))}
              </div>
            ) : topAttractions.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Trophy className="size-8 text-violet-200" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No sales in this period
                </p>
              </div>
            ) : (
              <ol className="space-y-3.5">
                {topAttractions.map((row, index) => (
                  <li key={row.event_uuid} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        index === 0
                          ? 'bg-paec-orange text-white'
                          : 'bg-violet-50 text-paec-violet',
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-violet-50">
                      <ImageWithFallback
                        src={resolveImageUrl(row.image_url)}
                        alt={row.name}
                        className="size-full object-cover"
                        fallbackClassName="size-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {row.name}
                        </p>
                        <p className="shrink-0 text-[13px] font-bold text-foreground tabular-nums">
                          {peso(row.revenue, 0)}
                        </p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-violet-50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-paec-violet to-paec-orange"
                            style={{
                              width: `${(row.revenue / topRevenue) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                          {row.tickets} sold
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
