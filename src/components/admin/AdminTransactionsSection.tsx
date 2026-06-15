import { ChevronDown, ChevronLeft, ChevronRight, Search, Ticket } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import {
  DateRangePicker,
  type DateRange,
} from '@/components/ui/date-range-picker'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  adminTransactionService,
  type AdminTransaction,
} from '@/services/adminTransactionService'

type TransactionStatus = 'all' | 'confirmed' | 'pending' | 'cancelled'

const statusOptions: { value: TransactionStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PER_PAGE = 15

function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatVisitDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const normalized = dateString.slice(0, 10)
  const [year, month, day] = normalized.split('-').map(Number)
  if (!year || !month || !day) return '—'

  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getVisitDate(tx: AdminTransaction): string | null {
  for (const order of tx.transaction_orders ?? []) {
    const visitDate = order.valid_until?.slice(0, 10)
    if (visitDate) return visitDate
  }
  return null
}

function statusBadgeClass(status: string): string {
  const value = status.toLowerCase()
  if (value === 'confirmed' || value === 'paid') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (value === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }
  if (value === 'cancelled' || value === 'failed') {
    return 'bg-red-100 text-red-700'
  }
  return 'bg-violet-100 text-violet-700'
}

export function AdminTransactionsSection() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<TransactionStatus>('all')
  const [visitDateRange, setVisitDateRange] = useState<DateRange | null>(null)
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [confirmedCount, setConfirmedCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, visitDateRange])

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const filterBase = {
        q: debouncedSearch,
        visit_start_date: visitDateRange?.start,
        visit_end_date: visitDateRange?.end,
      }

      const [response, confirmedResponse] = await Promise.all([
        adminTransactionService.list(page, PER_PAGE, {
          ...filterBase,
          order_status: status === 'all' ? undefined : status,
        }),
        adminTransactionService.list(1, 1, {
          ...filterBase,
          order_status: 'confirmed',
        }),
      ])

      setTransactions(response.data ?? [])
      setTotalPages(Math.max(1, response.meta?.last_page ?? 1))
      setConfirmedCount(confirmedResponse.meta?.total ?? 0)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load transactions.'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status, visitDateRange])

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track all ticket purchases and bookings
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, attraction, reference..."
            className={cn(
              'h-11 w-full rounded-xl border border-violet-100 bg-white pr-4 pl-10 text-sm',
              'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
            )}
          />
        </div>

        <DateRangePicker
          value={visitDateRange}
          onChange={setVisitDateRange}
          placeholder="Filter by visit date"
          className="w-full lg:w-[280px]"
        />

        <div className="relative w-full lg:w-48">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TransactionStatus)}
            className={cn(
              'h-11 w-full appearance-none rounded-xl border border-violet-100 bg-white px-4 pr-10 text-sm text-foreground',
              'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
            )}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-violet-100 bg-violet-50/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Attraction</th>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date of Visit</th>
                <th className="px-4 py-3 font-medium">Paid At</th>
                <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {loading ? 'Count : —' : `Count : ${confirmedCount}`}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Ticket className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No transactions found
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.uuid}
                    className="border-b border-violet-50 transition-colors hover:bg-violet-50/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {tx.user?.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.user?.email ?? ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {tx.event?.event_name ?? tx.event?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {tx.order_number}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {tx.payment_provider ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatCurrency(tx.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                          statusBadgeClass(tx.order_status),
                        )}
                      >
                        {tx.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatVisitDate(getVisitDate(tx))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(tx.paid_at ?? tx.created_at)}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-violet-100 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              >
                Next
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
