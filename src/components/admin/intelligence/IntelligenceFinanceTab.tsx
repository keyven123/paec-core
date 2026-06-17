import {
  Calendar,
  Download,
  FileSpreadsheet,
  TrendingDown,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { formatPeso } from '@/components/admin/intelligence/SimpleCharts'
import {
  type FinancePeriod,
  type FinanceSubTab,
} from '@/data/mockIntelligenceFinance'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  organizerAccountingService,
  type OrganizerPnLData,
  type OrganizerPnLIncomeStatementRow,
} from '@/services/organizerAccountingService'

const financeSubTabs: { id: FinanceSubTab; label: string }[] = [
  { id: 'platform', label: 'Merchant P&L' },
  { id: 'operator', label: 'Remittances' },
  { id: 'transaction', label: 'Transaction P&L' },
]

const periodOptions: { id: FinancePeriod; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'custom', label: 'Custom' },
]

const inputClassName = cn(
  'h-9 rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

export function IntelligenceFinanceTab() {
  const [subTab, setSubTab] = useState<FinanceSubTab>('platform')
  const [period, setPeriod] = useState<FinancePeriod>('monthly')
  const [referenceDate, setReferenceDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [pnl, setPnl] = useState<OrganizerPnLData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const customRangeInvalid =
    period === 'custom' &&
    Boolean(customStartDate && customEndDate && customStartDate > customEndDate)

  const handlePeriodChange = (next: FinancePeriod) => {
    setPeriod(next)
    if (next === 'custom') {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      setCustomEndDate(end.toISOString().slice(0, 10))
      setCustomStartDate(start.toISOString().slice(0, 10))
    }
  }

  useEffect(() => {
    if (subTab !== 'platform') return

    if (period === 'custom') {
      if (!customStartDate || !customEndDate || customStartDate > customEndDate) {
        setLoading(false)
        setError(null)
        return
      }
    }

    let cancelled = false

    async function loadPnl() {
      setLoading(true)
      setError(null)

      try {
        const data = await organizerAccountingService.getPnL(
          period === 'custom'
            ? {
                period,
                custom_start: customStartDate,
                custom_end: customEndDate,
              }
            : {
                period,
                as_of: referenceDate,
              },
        )

        if (!cancelled) {
          setPnl(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load merchant P&L.'))
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
  }, [subTab, period, referenceDate, customStartDate, customEndDate])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground sm:text-xl">Finance</h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Merchant revenue, remittances, and payout overview for your organization
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-violet-100">
        {financeSubTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={cn(
              'border-b-2 px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
              subTab === tab.id
                ? 'border-paec-orange text-paec-orange'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {subTab === 'platform' && (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {periodOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handlePeriodChange(option.id)}
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

            {period === 'custom' ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Start date</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className={inputClassName}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">End date</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className={inputClassName}
                  />
                </label>
                {customRangeInvalid ? (
                  <p className="text-xs text-red-600">Start date must be on or before end date.</p>
                ) : (
                  <p className="max-w-xs text-[10px] text-muted-foreground sm:pb-2">
                    Metrics reflect paid transactions within this date range.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <label className="flex items-center gap-2">
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
                <p className="max-w-xs text-[10px] text-muted-foreground">
                  Date anchors the selected period for all metrics below.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Gross Sales (GMV)"
              value={
                loading
                  ? '…'
                  : formatPeso(pnl?.kpi.gross_sales_gmv ?? 0)
              }
              change={pnl?.kpi.mom_gross_sales_gmv_pct}
            />
            <KpiCard
              label="Net Merchant Revenue"
              value={
                loading
                  ? '…'
                  : formatPeso(pnl?.kpi.net_merchant_revenue ?? 0)
              }
              change={pnl?.kpi.mom_net_merchant_revenue_pct}
            />
            <KpiCard
              label="Platform Commission"
              value={loading ? '…' : formatPeso(pnl?.kpi.platform_commission ?? 0)}
              change={pnl?.kpi.mom_platform_commission_pct}
            />
            <KpiCard
              label="Effective Commission Rate"
              value={
                loading
                  ? '…'
                  : `${(pnl?.kpi.effective_commission_on_gmv_pct ?? 0).toFixed(2)}%`
              }
              subtext="Platform fee on gross GMV"
            />
            <KpiCard
              label="Available for Payout"
              value={loading ? '…' : formatPeso(pnl?.kpi.available_for_payout ?? 0)}
              subtext={`Pending remittance: ${formatPeso(pnl?.kpi.pending_remittance ?? 0)}`}
              subtextClass="text-emerald-600"
            />
          </div>

          <IncomeStatementSection
            loading={loading}
            rows={pnl?.income_statement.rows ?? []}
            currentLabel={pnl?.income_statement.current_month_label ?? 'Current'}
            previousLabel={pnl?.income_statement.previous_month_label ?? 'Previous'}
            ytdLabel={pnl?.income_statement.ytd_label ?? 'YTD'}
          />
        </>
      )}

      {subTab === 'operator' && <FinancePlaceholder title="Remittances" />}
      {subTab === 'transaction' && <FinancePlaceholder title="Transaction P&L" />}
    </div>
  )
}

function KpiCard({
  label,
  value,
  change,
  subtext,
  subtextClass,
}: {
  label: string
  value: string
  change?: number | null
  subtext?: string
  subtextClass?: string
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {change !== undefined && change !== null && (
        <p className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-red-600">
          <TrendingDown className="size-3" />▼ {Math.abs(change).toFixed(1)}% vs prev. month
        </p>
      )}
      {subtext && (
        <p className={cn('mt-1 text-[10px] text-muted-foreground', subtextClass)}>
          {subtext}
        </p>
      )}
    </div>
  )
}

function IncomeStatementSection({
  loading,
  rows,
  currentLabel,
  previousLabel,
  ytdLabel,
}: {
  loading: boolean
  rows: OrganizerPnLIncomeStatementRow[]
  currentLabel: string
  previousLabel: string
  ytdLabel: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-violet-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Income Statement</h3>
          <p className="text-xs text-muted-foreground">
            Monthly view · CFO grade · PHP
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
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-violet-50/80">
            <tr className="border-b border-violet-100">
              {[
                'Line Item',
                currentLabel,
                previousLabel,
                'POP Δ',
                ytdLabel,
                '% of GMV',
              ].map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  Loading income statement...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No financial data yet
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <IncomeStatementTableRow key={row.key} row={row} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IncomeStatementTableRow({ row }: { row: OrganizerPnLIncomeStatementRow }) {
  const formatCell = (value: number | null, isPercent = false) => {
    if (value === null) return '—'
    if (isPercent) return `${value.toFixed(2)}%`
    return formatPeso(value)
  }

  return (
    <tr
      className={cn(
        'border-b border-violet-50 transition-colors hover:bg-violet-50/20',
        row.variant === 'summary' && 'bg-violet-50/40 font-semibold',
      )}
    >
      <td
        className={cn(
          'px-3 py-2 text-xs text-foreground',
          row.variant === 'commission' && 'pl-6 text-muted-foreground',
        )}
      >
        {row.label}
      </td>
      <td className="px-3 py-2 text-xs text-foreground">
        {formatCell(row.current_month)}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {formatCell(row.previous_month)}
      </td>
      <td className="px-3 py-2 text-xs">
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
      <td className="px-3 py-2 text-xs text-foreground">{formatCell(row.ytd)}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {formatCell(row.pct_of_gmv, true)}
      </td>
    </tr>
  )
}

function FinancePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/30 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Detailed views coming soon. Use Merchant P&L for your financial overview.
      </p>
    </div>
  )
}
