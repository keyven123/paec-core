import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Settings2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { IntelligenceSettingsTab } from '@/components/admin/intelligence/IntelligenceSettingsTab'
import { formatPeso } from '@/components/admin/intelligence/SimpleCharts'
import type { FinancePeriod } from '@/data/mockIntelligenceFinance'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  platformPnLService,
  type PlatformPnLData,
  type PlatformPnLIncomeStatementRow,
} from '@/services/platformPnLService'

type FinanceSubTab = 'sales' | 'settings'

const financeSubTabs: {
  id: FinanceSubTab
  label: string
  icon: typeof Wallet
}[] = [
  { id: 'sales', label: 'Sales', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

const periodOptions: { id: FinancePeriod; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'custom', label: 'Custom' },
]

function isSalesRow(row: PlatformPnLIncomeStatementRow): boolean {
  if (row.key === 'gateway_fees' || row.key === 'net_gmv') return false
  if (
    row.key === 'gmv' ||
    row.key === 'refunds' ||
    row.key === 'chargebacks' ||
    row.key === 'net_sales'
  ) {
    return true
  }
  return (
    row.variant === 'gateway_provider' ||
    row.variant === 'gateway_channel' ||
    row.key.startsWith('gateway_provider_') ||
    row.key.startsWith('gateway_channel_')
  )
}

const inputClassName = cn(
  'h-9 rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

export function IntelligenceFinanceTab() {
  const today = () => new Date().toISOString().slice(0, 10)
  const [subTab, setSubTab] = useState<FinanceSubTab>('sales')
  const [period, setPeriod] = useState<FinancePeriod>('monthly')
  const [referenceDate, setReferenceDate] = useState(today)
  const [customStart, setCustomStart] = useState(today)
  const [customEnd, setCustomEnd] = useState(today)
  const [pnl, setPnl] = useState<PlatformPnLData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (subTab !== 'sales') return
    if (period === 'custom' && (!customStart || !customEnd)) return
    if (period === 'custom' && customStart > customEnd) {
      setError('Custom start date must be on or before end date.')
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadPnl() {
      setLoading(true)
      setError(null)

      try {
        const data = await platformPnLService.getPlatformPnL({
          period,
          as_of: referenceDate,
          ...(period === 'custom'
            ? { custom_start: customStart, custom_end: customEnd }
            : {}),
        })

        if (!cancelled) {
          setPnl(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load sales report.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPnl()

    return () => {
      cancelled = true
    }
  }, [subTab, period, referenceDate, customStart, customEnd])

  const salesRows = useMemo(
    () => (pnl?.income_statement.rows ?? []).filter(isSalesRow),
    [pnl],
  )

  const periodLabel =
    periodOptions.find((option) => option.id === period)?.label ?? 'Period'

  const netSales = pnl?.kpi.net_sales ?? pnl?.kpi.net_gmv ?? 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          Finance
        </h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Net sales after refunds, chargebacks, and payment gateway deductions
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-violet-100">
        {financeSubTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                subTab === tab.id
                  ? 'border-paec-orange text-paec-orange'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {subTab === 'settings' ? (
        <IntelligenceSettingsTab embedded />
      ) : (
        <>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-xl border border-violet-100 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Period
              </p>
              <div className="flex flex-wrap gap-2">
                {periodOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPeriod(option.id)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm',
                      period === option.id
                        ? 'border-2 border-paec-orange bg-orange-50 text-paec-orange'
                        : 'border border-violet-100 bg-white text-muted-foreground hover:bg-violet-50',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {period === 'custom' ? (
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    From
                  </span>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className={cn(inputClassName, 'pl-8')}
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    To
                  </span>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className={cn(inputClassName, 'pl-8')}
                    />
                  </div>
                </label>
              </div>
            ) : (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Reference date
                </span>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.target.value)}
                    className={cn(inputClassName, 'pl-8')}
                  />
                </div>
              </label>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Gross sales"
              value={loading ? '…' : formatPeso(pnl?.kpi.gross_sales_gmv ?? 0)}
              change={pnl?.kpi.mom_gross_sales_gmv_pct}
              periodLabel={periodLabel}
            />
            <KpiCard
              label="Refunds"
              value={loading ? '…' : formatPeso(pnl?.kpi.refunds ?? 0)}
              change={pnl?.kpi.mom_refunds_pct}
              periodLabel={periodLabel}
              tone="muted"
            />
            <KpiCard
              label="Chargebacks"
              value={loading ? '…' : formatPeso(pnl?.kpi.chargebacks ?? 0)}
              change={pnl?.kpi.mom_chargebacks_pct}
              periodLabel={periodLabel}
              tone="muted"
            />
            <KpiCard
              label="Net sales"
              value={loading ? '…' : formatPeso(netSales)}
              change={pnl?.kpi.mom_net_sales_pct ?? pnl?.kpi.mom_net_gmv_pct}
              periodLabel={periodLabel}
              emphasize
            />
          </div>

          <SalesSummarySection
            loading={loading}
            rows={salesRows}
            currentLabel={
              pnl?.income_statement.current_month_label ?? 'Current'
            }
            previousLabel={
              pnl?.income_statement.previous_month_label ?? 'Previous'
            }
            ytdLabel={pnl?.income_statement.ytd_label ?? 'YTD'}
            periodLabel={periodLabel}
          />
        </>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  change,
  periodLabel,
  tone,
  emphasize,
}: {
  label: string
  value: string
  change?: number | null
  periodLabel: string
  tone?: 'muted'
  emphasize?: boolean
}) {
  const isUp = change !== undefined && change !== null && change >= 0

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm',
        emphasize
          ? 'border-paec-orange/40 ring-1 ring-paec-orange/15'
          : 'border-violet-100',
      )}
    >
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 text-xl font-bold tabular-nums',
          tone === 'muted' ? 'text-foreground/80' : 'text-foreground',
        )}
      >
        {value}
      </p>
      {change !== undefined && change !== null ? (
        <p
          className={cn(
            'mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold',
            isUp ? 'text-emerald-600' : 'text-red-600',
          )}
        >
          {isUp ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {Math.abs(change).toFixed(1)}% vs prev. {periodLabel.toLowerCase()}
        </p>
      ) : (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          vs previous {periodLabel.toLowerCase()}
        </p>
      )}
    </div>
  )
}

function providerKeyFromChannelRow(rowKey: string): string | null {
  // gateway_channel_{uuid}_{channel} → gateway_provider_{uuid}
  if (!rowKey.startsWith('gateway_channel_')) return null
  const rest = rowKey.slice('gateway_channel_'.length)
  const uuidEnd = rest.indexOf('_')
  if (uuidEnd <= 0) return null
  return `gateway_provider_${rest.slice(0, uuidEnd)}`
}

function SalesSummarySection({
  loading,
  rows,
  currentLabel,
  previousLabel,
  ytdLabel,
  periodLabel,
}: {
  loading: boolean
  rows: PlatformPnLIncomeStatementRow[]
  currentLabel: string
  previousLabel: string
  ytdLabel: string
  periodLabel: string
}) {
  const [collapsedProviders, setCollapsedProviders] = useState<Set<string>>(
    () => new Set(),
  )

  const providerKeys = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            row.variant === 'gateway_provider' ||
            row.key.startsWith('gateway_provider_'),
        )
        .map((row) => row.key),
    [rows],
  )

  // Drop collapse state for gateways that are no longer in the report.
  useEffect(() => {
    setCollapsedProviders((current) => {
      const next = new Set<string>()
      for (const key of current) {
        if (providerKeys.includes(key)) next.add(key)
      }
      return next.size === current.size ? current : next
    })
  }, [providerKeys])

  const toggleProvider = (providerKey: string) => {
    setCollapsedProviders((current) => {
      const next = new Set(current)
      if (next.has(providerKey)) next.delete(providerKey)
      else next.add(providerKey)
      return next
    })
  }

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      const isChannel =
        row.variant === 'gateway_channel' ||
        row.key.startsWith('gateway_channel_')
      if (!isChannel) return true
      const providerKey = providerKeyFromChannelRow(row.key)
      if (!providerKey) return true
      return !collapsedProviders.has(providerKey)
    })
  }, [rows, collapsedProviders])

  return (
    <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-violet-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Sales summary</h3>
          <p className="text-xs text-muted-foreground">
            {periodLabel} view · PHP · Gross − Refunds − Chargebacks − checked
            channel deductions = Net sales
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toast.info('PDF export coming soon.')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-violet-50"
          >
            <Download className="size-3.5" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => toast.info('Excel export coming soon.')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-paec-violet px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark"
          >
            <FileSpreadsheet className="size-3.5" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-violet-50/80">
            <tr className="border-b border-violet-100">
              {[
                'Line item',
                currentLabel,
                previousLabel,
                'Change',
                ytdLabel,
                '% of gross',
              ].map((col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  Loading sales summary…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  No sales data for this period
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <SalesTableRow
                  key={row.key}
                  row={row}
                  collapsed={collapsedProviders.has(row.key)}
                  onToggleProvider={
                    row.variant === 'gateway_provider' ||
                    row.key.startsWith('gateway_provider_')
                      ? () => toggleProvider(row.key)
                      : undefined
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SalesTableRow({
  row,
  collapsed = false,
  onToggleProvider,
}: {
  row: PlatformPnLIncomeStatementRow
  collapsed?: boolean
  onToggleProvider?: () => void
}) {
  const formatCell = (value: number | null, isPercent = false) => {
    if (value === null) return '—'
    if (isPercent) return `${value.toFixed(2)}%`
    return formatPeso(value)
  }

  const indent = row.indent ?? 0
  const isProvider =
    row.variant === 'gateway_provider' ||
    row.key.startsWith('gateway_provider_') ||
    indent === 1
  const isChannel =
    row.variant === 'gateway_channel' ||
    row.key.startsWith('gateway_channel_') ||
    indent === 2

  return (
    <tr
      className={cn(
        'border-b border-violet-50 transition-colors hover:bg-violet-50/20',
        row.variant === 'summary' && 'bg-orange-50/40 font-semibold',
        isProvider && 'bg-violet-50/30',
        row.less && !isProvider && !isChannel && 'text-muted-foreground',
      )}
    >
      <td
        className={cn(
          'px-3 py-2.5 text-xs text-foreground',
          isProvider && 'font-semibold text-paec-violet',
          isChannel && 'text-muted-foreground',
        )}
        style={{ paddingLeft: `${12 + indent * 16}px` }}
      >
        {isChannel ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-violet-300">└</span>
            {row.label}
          </span>
        ) : isProvider ? (
          <button
            type="button"
            onClick={onToggleProvider}
            aria-expanded={!collapsed}
            className="inline-flex items-center gap-1.5 rounded-md text-left text-paec-violet transition-colors hover:text-paec-violet-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paec-violet/30"
          >
            {collapsed ? (
              <ChevronRight className="size-3.5 shrink-0 text-violet-400" />
            ) : (
              <ChevronDown className="size-3.5 shrink-0 text-violet-400" />
            )}
            {row.label}
          </button>
        ) : row.less ? (
          `− ${row.label}`
        ) : (
          row.label
        )}
      </td>
      <td className="px-3 py-2.5 text-xs tabular-nums text-foreground">
        {formatCell(row.current_month)}
      </td>
      <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
        {formatCell(row.previous_month)}
      </td>
      <td className="px-3 py-2.5 text-xs">
        {row.mom_pct !== null ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold',
              row.mom_pct >= 0 ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {row.mom_pct >= 0 ? '▲' : '▼'} {Math.abs(row.mom_pct).toFixed(1)}%
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="px-3 py-2.5 text-xs tabular-nums text-foreground">
        {formatCell(row.ytd)}
      </td>
      <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
        {formatCell(Math.abs(row.pct_of_gmv), true)}
      </td>
    </tr>
  )
}
