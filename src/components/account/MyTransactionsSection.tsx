import { ArrowLeftRight, Eye, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'

import { TransactionDetailsModal } from '@/components/account/TransactionDetailsModal'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  transactionService,
  type CustomerTransaction,
} from '@/services/transactionService'

const PER_PAGE = 10

function parseAmount(value: number | string | null | undefined): number {
  const n = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(value: number | string | null | undefined): string {
  return `₱${parseAmount(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatVisitDate(value?: string | null): string | null {
  if (!value) return null
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'confirmed' || s === 'paid') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (s === 'pending') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (s === 'cancelled' || s === 'failed') {
    return 'border-red-200 bg-red-50 text-red-700'
  }
  return 'border-violet-200 bg-violet-50 text-paec-violet'
}

export function MyTransactionsSection() {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedTransaction, setSelectedTransaction] =
    useState<CustomerTransaction | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await transactionService.getMyTransactions(
        page,
        PER_PAGE,
        debouncedSearch,
      )
      setTransactions(response.data ?? [])
      setTotalPages(response.meta?.last_page ?? 1)
      setTotal(response.meta?.total ?? 0)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load transactions.'))
      setTransactions([])
      setTotalPages(1)
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            My <span className="text-paec-violet">transactions</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your payment history and receipts.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className={cn(
              'h-10 w-full rounded-full border border-violet-100 bg-white pr-4 pl-10 text-sm',
              'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
            )}
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-paec-violet" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="mt-8 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-violet-100 bg-white px-6 py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-50">
            <ArrowLeftRight className="size-8 text-paec-violet/40" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {debouncedSearch ? 'No matching transactions' : 'No transactions yet'}
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {debouncedSearch
              ? 'Try a different search term.'
              : 'Your payment history will appear here after you book an activity.'}
          </p>
          {!debouncedSearch ? (
            <Link
              to="/"
              className="mt-4 text-sm font-semibold text-paec-violet hover:underline"
            >
              Explore activities
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            {total} transaction{total === 1 ? '' : 's'}
          </p>

          <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-violet-50/80">
                  <tr>
                    {[
                      'Activity',
                      'Order Number',
                      'Date of Visit',
                      'Total',
                      'Status',
                      'Paid At',
                      '',
                    ].map((col) => (
                      <th
                        key={col || 'actions'}
                        className="px-4 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const visitDate = formatVisitDate(
                      transaction.transaction_orders?.find((o) => o.valid_until)
                        ?.valid_until,
                    )

                    return (
                      <tr
                        key={transaction.uuid}
                        className="border-t border-violet-50 hover:bg-violet-50/30"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {transaction.event?.name ??
                            transaction.event?.event_name ??
                            '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-foreground">
                          {transaction.order_number}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {visitDate ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {formatCurrency(transaction.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
                              statusBadgeClass(transaction.order_status),
                            )}
                          >
                            {transaction.order_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateTime(transaction.paid_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTransaction(transaction)}
                            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-paec-violet transition-colors hover:bg-violet-50"
                          >
                            <Eye className="size-3.5" />
                            Details
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-full border-violet-200"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border-violet-200"
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <TransactionDetailsModal
        open={Boolean(selectedTransaction)}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  )
}
