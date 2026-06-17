import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronDown,
  Coins,
  Download,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import {
  VerticalBarChart,
  LineChart,
  PieChart,
  StackedBarChart,
  formatPeso,
} from '@/components/admin/intelligence/SimpleCharts'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { RevenuePerEventSeriesData } from '@/services/analyticsService'
import {
  organizerAnalyticsService,
  type OrganizerAnalyticsStats,
} from '@/services/organizerAnalyticsService'

const categoryCards = [
  {
    title: 'Sales Analytics',
    description: 'Revenue, trends, and performance',
    icon: Coins,
    iconClass: 'bg-violet-100 text-paec-violet',
  },
  {
    title: 'Attraction Analytics',
    description: 'Attraction performance and insights',
    icon: Calendar,
    iconClass: 'bg-emerald-100 text-emerald-600',
  },
  {
    title: 'User Analytics',
    description: 'User engagement and growth',
    icon: Users,
    iconClass: 'bg-orange-100 text-paec-orange',
  },
]

function buildKpiCards(stats: OrganizerAnalyticsStats | null) {
  return [
    {
      label: 'Total Revenue',
      value: stats ? formatPeso(stats.transactions) : '—',
      icon: Coins,
      iconClass: 'bg-orange-100 text-paec-orange',
    },
    {
      label: 'This Month',
      value: stats ? formatPeso(stats.this_month_transactions) : '—',
      icon: BarChart3,
      iconClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Total Attractions',
      value: stats ? String(stats.total_events) : '—',
      icon: Calendar,
      iconClass: 'bg-violet-100 text-paec-violet',
    },
    {
      label: 'Total Orders',
      value: stats ? String(stats.total_transactions) : '—',
      icon: Users,
      iconClass: 'bg-orange-100 text-paec-orange',
    },
  ]
}

const pieColors = ['#7c3aed', '#f97316', '#10b981', '#3b82f6', '#ec4899', '#eab308', '#06b6d4', '#84cc16']

type StackedBar = {
  label: string
  segments: { name: string; value: number; color: string }[]
}

function formatSeriesDate(value: string, granularity: string): string {
  const date = new Date(value)
  if (granularity === 'monthly') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  if (granularity === 'weekly') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDateRangeParams(dateRange: string): { start_date?: string; end_date?: string } {
  if (dateRange === 'default') return {}

  const end = new Date()
  const start = new Date()
  if (dateRange === 'last30') {
    start.setDate(start.getDate() - 30)
  } else if (dateRange === 'last90') {
    start.setDate(start.getDate() - 90)
  } else {
    return {}
  }

  const toIso = (d: Date) => d.toISOString().slice(0, 10)
  return { start_date: toIso(start), end_date: toIso(end) }
}

function transformRevenuePerEventSeries(
  data: RevenuePerEventSeriesData,
  granularity: string,
): { chartData: StackedBar[]; legend: { name: string; color: string }[] } {
  const legend = data.events.map((event, index) => ({
    name: event.event_name,
    color: pieColors[index % pieColors.length],
  }))

  const chartData = data.series.map((point) => ({
    label: formatSeriesDate(point.date, granularity),
    segments: point.amounts.map((amount, index) => ({
      name: data.events[index]?.event_name ?? `Attraction ${index + 1}`,
      value: amount,
      color: pieColors[index % pieColors.length],
    })),
  }))

  return { chartData, legend }
}

const selectClassName = cn(
  'h-8 rounded-lg border border-violet-100 bg-white px-2.5 text-xs text-foreground',
  'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const fieldClassName = cn(
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

export function IntelligenceAnalyticsTab() {
  const [period, setPeriod] = useState('daily')
  const [dateRange, setDateRange] = useState('default')
  const [stats, setStats] = useState<OrganizerAnalyticsStats | null>(null)
  const [revenueByEvent, setRevenueByEvent] = useState<{ name: string; value: number }[]>([])
  const [customerTypeBreakdown, setCustomerTypeBreakdown] = useState<
    { label: string; value: number; color: string }[]
  >([])
  const [transactionOutcomeBreakdown, setTransactionOutcomeBreakdown] = useState<
    { label: string; value: number; color: string }[]
  >([])
  const [transactionRevenueSeries, setTransactionRevenueSeries] = useState<
    { label: string; value: number }[]
  >([])
  const [revenuePerEventChart, setRevenuePerEventChart] = useState<StackedBar[]>([])
  const [eventLegend, setEventLegend] = useState<{ name: string; color: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  const granularity = useMemo(
    () =>
      period === 'weekly'
        ? 'weekly'
        : period === 'monthly'
          ? 'monthly'
          : 'daily',
    [period],
  )

  const dateParams = useMemo(() => getDateRangeParams(dateRange), [dateRange])

  useEffect(() => {
    let cancelled = false

    async function loadAnalytics() {
      setLoading(true)
      setError(null)

      try {
        const [statsData, salesData, revenueSeriesData, customerTypes, transactionOutcomes, revenuePerEventData] =
          await Promise.all([
            organizerAnalyticsService.getStats(),
            organizerAnalyticsService.getSales(),
            organizerAnalyticsService.getTransactionRevenueSeries({
              granularity,
              ...dateParams,
            }),
            organizerAnalyticsService.getCustomerTypePie(),
            organizerAnalyticsService.getSuccessfulFailedTransactionPie(),
            organizerAnalyticsService.getRevenuePerEventSeries({
              granularity,
              ...dateParams,
            }),
          ])

        if (cancelled) return

        setStats(statsData)
        setRevenueByEvent(
          (salesData.top_selling_events ?? []).map((item) => ({
            name: item.event_name,
            value: item.total_sales,
          })),
        )
        setTransactionRevenueSeries(
          revenueSeriesData.series.map((point) => ({
            label: formatSeriesDate(point.date, granularity),
            value: point.total_amount,
          })),
        )

        const { chartData, legend } = transformRevenuePerEventSeries(
          revenuePerEventData,
          granularity,
        )
        setRevenuePerEventChart(chartData)
        setEventLegend(legend)

        setCustomerTypeBreakdown([
          { label: 'New', value: customerTypes.new_customers, color: pieColors[0] },
          { label: 'Repeat', value: customerTypes.repeat_customers, color: pieColors[1] },
        ])
        setTransactionOutcomeBreakdown([
          { label: 'Successful', value: transactionOutcomes.successful_count, color: pieColors[2] },
          { label: 'Failed', value: transactionOutcomes.failed_count, color: pieColors[4] },
        ])
      } catch (err) {
        if (!cancelled) {
          const message = getApiErrorMessage(err, 'Failed to load analytics.')
          setError(
            message.toLowerCase().includes('organization context')
              ? 'Your account is not linked to an organization. Please contact an administrator or sign in with an organizer account.'
              : message,
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadAnalytics()

    return () => {
      cancelled = true
    }
  }, [granularity, dateParams])

  const openExportModal = () => {
    const today = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    setExportStartDate(start.toISOString().slice(0, 10))
    setExportEndDate(today.toISOString().slice(0, 10))
    setExportModalOpen(true)
  }

  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate || exportStartDate > exportEndDate) return

    setExporting(true)
    try {
      await organizerAnalyticsService.exportTransactionRevenueSeries({
        granularity,
        start_date: exportStartDate,
        end_date: exportEndDate,
      })
      toast.success('Transaction report exported.')
      setExportModalOpen(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Export failed.'))
    } finally {
      setExporting(false)
    }
  }

  const kpiCards = buildKpiCards(stats)

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Analytics Dashboard
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Overview of your attraction performance and booking metrics
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openExportModal()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark sm:text-sm"
          >
            <Download className="size-3.5" />
            Export Transaction Report
          </button>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-violet-50 sm:text-sm"
          >
            <ArrowLeft className="size-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {categoryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="flex items-start gap-3 rounded-xl border border-violet-100 bg-white p-4 shadow-sm transition-colors hover:border-paec-violet/30 hover:bg-violet-50/30"
            >
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full',
                  card.iconClass,
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="flex items-center gap-3 rounded-xl border border-violet-100 bg-white p-4 shadow-sm"
            >
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full',
                  card.iconClass,
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="truncate text-lg font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <SummaryCard title="Sales Breakdown">
          <SummaryRow
            label="Weekly Sales"
            value={stats ? formatPeso(stats.weekly_sales) : '—'}
            trend={0}
          />
          <SummaryRow
            label="Daily Sales"
            value={stats ? formatPeso(stats.daily_sales) : '—'}
            trend={0}
          />
        </SummaryCard>

        <SummaryCard title="Attraction Statistics">
          <StatRow
            label="Active Attractions"
            value={stats?.active_events ?? 0}
            dotClass="bg-emerald-500"
          />
          <StatRow
            label="Featured Attractions"
            value={stats?.featured_events ?? 0}
            icon={<Star className="size-3.5 text-paec-orange" />}
          />
          <StatRow
            label="Past Attractions"
            value={stats?.past_events ?? 0}
            dotClass="bg-muted-foreground/40"
          />
        </SummaryCard>
      </div>

      <div className="space-y-3">
        <ChartCard title="Revenue by Attraction (Top 10)" className="min-w-0">
          {loading || revenueByEvent.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {loading ? 'Loading chart...' : 'No revenue data yet'}
            </p>
          ) : (
            <VerticalBarChart data={revenueByEvent} />
          )}
        </ChartCard>

        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          <ChartCard title="Customer Type" className="min-w-0">
            <p className="mb-3 text-[11px] text-muted-foreground">
              New = 1 transaction · Repeat = 2+
            </p>
            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Loading chart...</p>
            ) : (
              <PieChart data={customerTypeBreakdown} />
            )}
          </ChartCard>

          <ChartCard title="Successful vs Failed" className="min-w-0">
            <p className="mb-3 text-[11px] text-muted-foreground">
              Successful = paid · Failed = failed or cancelled
            </p>
            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Loading chart...</p>
            ) : (
              <PieChart data={transactionOutcomeBreakdown} />
            )}
          </ChartCard>
        </div>
      </div>

      <ChartCard
        title="Transaction Revenue"
        actions={
          <ChartFilters
            period={period}
            dateRange={dateRange}
            onPeriodChange={setPeriod}
            onDateRangeChange={setDateRange}
          />
        }
      >
        {loading || transactionRevenueSeries.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {loading ? 'Loading chart...' : 'No transaction revenue yet'}
          </p>
        ) : (
          <LineChart data={transactionRevenueSeries} />
        )}
      </ChartCard>

      <ChartCard
        title="Revenue per Attraction"
        actions={
          <ChartFilters
            period={period}
            dateRange={dateRange}
            onPeriodChange={setPeriod}
            onDateRangeChange={setDateRange}
          />
        }
      >
        {loading || revenuePerEventChart.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {loading ? 'Loading chart...' : 'No revenue per attraction data yet'}
          </p>
        ) : (
          <>
            <StackedBarChart data={revenuePerEventChart} />
            {eventLegend.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-3 border-t border-violet-50 pt-3">
                {eventLegend.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="size-2.5 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </ChartCard>

      {exportModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !exporting && setExportModalOpen(false)}
            aria-label="Close modal"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => !exporting && setExportModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-bold text-foreground">Export Transaction Report</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">Start date</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className={cn(fieldClassName, 'mt-1.5')}
                  disabled={exporting}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">End date</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className={cn(fieldClassName, 'mt-1.5')}
                  disabled={exporting}
                />
              </div>
              {exportStartDate && exportEndDate && exportStartDate > exportEndDate ? (
                <p className="text-xs text-red-600">Start date must be on or before end date.</p>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !exporting && setExportModalOpen(false)}
                disabled={exporting}
                className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold text-foreground hover:bg-violet-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={
                  exporting ||
                  !exportStartDate ||
                  !exportEndDate ||
                  exportStartDate > exportEndDate
                }
                className="rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white hover:bg-paec-violet/90 disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  trend,
}: {
  label: string
  value: string
  trend: number
}) {
  const isUp = trend >= 0
  const TrendIcon = isUp ? TrendingUp : TrendingDown

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-violet-50/40 px-3 py-2.5">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-xs font-semibold',
          isUp ? 'text-emerald-600' : 'text-red-600',
        )}
      >
        <TrendIcon className="size-3.5" />
        {Math.abs(trend).toFixed(1)}%
      </span>
    </div>
  )
}

function StatRow({
  label,
  value,
  dotClass,
  icon,
}: {
  label: string
  value: number
  dotClass?: string
  icon?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-violet-50/40 px-3 py-2.5">
      <div className="flex items-center gap-2">
        {icon ?? <span className={cn('size-2 rounded-full', dotClass)} />}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}

function ChartCard({
  title,
  children,
  actions,
  className,
}: {
  title: string
  children: ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-xl border border-violet-100 bg-white p-4 shadow-sm',
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  )
}

function ChartFilters({
  period,
  dateRange,
  onPeriodChange,
  onDateRangeChange,
}: {
  period: string
  dateRange: string
  onPeriodChange: (value: string) => void
  onDateRangeChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative">
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          className={cn(selectClassName, 'appearance-none pr-7')}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted-foreground" />
      </div>
      <div className="relative">
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className={cn(selectClassName, 'appearance-none pr-7')}
        >
          <option value="default">Default</option>
          <option value="last30">Last 30 days</option>
          <option value="last90">Last 90 days</option>
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}
