import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Ticket,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  adminTransactionService,
  type AdminTransaction,
} from '@/services/adminTransactionService'
import {
  userManagementService,
  type CustomerUser,
} from '@/services/userManagementService'
import {
  userStatsService,
  type ActivityItem,
  type UserStats,
  type UserTicket,
} from '@/services/userStatsService'

import { AddTicketModal } from '@/components/admin/AddTicketModal'
import { UserTicketRowActions } from '@/components/admin/UserTicketRowActions'

const PER_PAGE = 10

function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return new Date(value)
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '')
}

function statusBadgeClass(status: string): string {
  const value = status.toLowerCase()
  if (value === 'confirmed' || value === 'paid' || value === 'active') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (value === 'pending') return 'bg-amber-100 text-amber-700'
  if (value === 'cancelled' || value === 'failed') return 'bg-red-100 text-red-700'
  if (value === 'transferred') return 'bg-violet-100 text-paec-violet'
  if (value === 'used') return 'bg-slate-100 text-slate-600'
  return 'bg-violet-100 text-violet-700'
}

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  if (type === 'purchase') {
    return <ShoppingCart className="size-4 text-paec-orange" />
  }
  if (type === 'transferred_ticket') {
    return <Send className="size-4 text-paec-violet" />
  }
  return <CheckCircle className="size-4 text-slate-500" />
}

type AdminUserStatsSectionProps = {
  userUuid: string
}

export function AdminUserStatsSection({ userUuid }: AdminUserStatsSectionProps) {
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [tickets, setTickets] = useState<UserTicket[]>([])
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketPage, setTicketPage] = useState(1)
  const [ticketMeta, setTicketMeta] = useState({ last_page: 1, total: 0, from: 0, to: 0 })
  const [transactionPage, setTransactionPage] = useState(1)
  const [transactionMeta, setTransactionMeta] = useState({ last_page: 1, total: 0 })
  const [transactionSearch, setTransactionSearch] = useState('')
  const [debouncedTransactionSearch, setDebouncedTransactionSearch] = useState('')
  const [ticketSearch, setTicketSearch] = useState('')
  const [debouncedTicketSearch, setDebouncedTicketSearch] = useState('')
  const [addTicketOpen, setAddTicketOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTransactionSearch(transactionSearch), 400)
    return () => clearTimeout(timer)
  }, [transactionSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTicketSearch(ticketSearch), 400)
    return () => clearTimeout(timer)
  }, [ticketSearch])

  useEffect(() => {
    setTransactionPage(1)
  }, [debouncedTransactionSearch])

  useEffect(() => {
    setTicketPage(1)
  }, [debouncedTicketSearch])

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [userData, statsData, activityData] = await Promise.all([
        userManagementService.getCustomer(userUuid),
        userStatsService.getUserStats(userUuid),
        userStatsService.getUserRecentActivity(userUuid),
      ])

      setUser(userData)
      setStats(statsData)
      setActivity(activityData)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load user statistics.'))
    } finally {
      setLoading(false)
    }
  }, [userUuid])

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true)
    try {
      const ticketsData = await userStatsService.getUserTickets(userUuid, {
        page: ticketPage,
        per_page: PER_PAGE,
        q: debouncedTicketSearch.trim() || undefined,
      })
      setTickets(ticketsData.data ?? [])
      setTicketMeta({
        last_page: ticketsData.last_page ?? ticketsData.meta?.last_page ?? 1,
        total: ticketsData.total ?? ticketsData.meta?.total ?? 0,
        from: ticketsData.from ?? 1,
        to: ticketsData.to ?? ticketsData.data?.length ?? 0,
      })
    } catch {
      setTickets([])
    } finally {
      setTicketsLoading(false)
    }
  }, [userUuid, ticketPage, debouncedTicketSearch])

  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true)
    try {
      const response = await adminTransactionService.list(transactionPage, PER_PAGE, {
        user_uuid: userUuid,
        q: debouncedTransactionSearch.trim() || undefined,
      })
      setTransactions(response.data ?? [])
      setTransactionMeta({
        last_page: response.meta?.last_page ?? 1,
        total: response.meta?.total ?? 0,
      })
    } catch {
      setTransactions([])
    } finally {
      setTransactionsLoading(false)
    }
  }, [userUuid, transactionPage, debouncedTransactionSearch])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    if (loading) return
    void loadTickets()
  }, [loadTickets, loading])

  useEffect(() => {
    if (loading) return
    void loadTransactions()
  }, [loadTransactions, transactionPage, debouncedTransactionSearch, loading])

  const refreshAfterTicketChange = useCallback(() => {
    void loadOverview()
    if (ticketPage === 1) {
      void loadTickets()
    } else {
      setTicketPage(1)
    }
    void loadTransactions()
  }, [loadOverview, loadTickets, loadTransactions, ticketPage])

  const statCards = [
    {
      label: 'Total Purchase',
      value: stats ? formatCurrency(stats.total_purchase) : '—',
      icon: ShoppingCart,
      iconClass: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'On Hand Tickets',
      value: stats ? String(stats.on_hand_tickets) : '—',
      icon: Ticket,
      iconClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Transferred Tickets',
      value: stats ? String(stats.transferred_tickets) : '—',
      icon: Send,
      iconClass: 'bg-violet-100 text-paec-violet',
    },
    {
      label: 'Used Tickets',
      value: stats ? String(stats.used_tickets) : '—',
      icon: CheckCircle,
      iconClass: 'bg-blue-100 text-blue-600',
    },
  ]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading user statistics...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/admin/usermanagement"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-violet-50"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground lg:text-2xl">
              User Statistics
            </h1>
            {user ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {user.full_name} ({user.email})
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{card.value}</p>
                </div>
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    card.iconClass,
                  )}
                >
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid shrink-0 gap-4 lg:grid-cols-2 lg:items-start">
        <section className="flex max-h-[420px] min-h-[280px] flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="shrink-0 border-b border-violet-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent activity found
              </p>
            ) : (
              <ul className="space-y-2">
                {activity.map((item, index) => (
                  <li
                    key={`${item.timestamp}-${index}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-violet-50 bg-violet-50/40 p-3"
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white">
                        <ActivityIcon type={item.type} />
                      </div>
                      <p className="text-xs leading-relaxed text-foreground">{item.message}</p>
                    </div>
                    <p className="shrink-0 text-[10px] whitespace-nowrap text-muted-foreground">
                      {formatDateTime(item.timestamp)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="flex max-h-[420px] min-h-[280px] flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="flex shrink-0 flex-col gap-3 border-b border-violet-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-foreground">All Tickets</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-56">
                <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Search ticket ID or QR code..."
                  className={cn(
                    'h-9 w-full rounded-lg border border-violet-100 bg-white pr-3 pl-9 text-sm',
                    'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => setAddTicketOpen(true)}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-paec-violet px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-paec-violet/90"
              >
                <Plus className="size-3.5" />
                Add Ticket
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="sticky top-0 bg-violet-50/95">
                <tr className="border-b border-violet-100 text-[10px] tracking-wider text-muted-foreground uppercase">
                  {['Ticket No', 'QR Code', 'Ticket Type', 'Status', 'Actions'].map((col) => (
                    <th key={col} className="px-3 py-2 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ticketsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                      Loading tickets...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                      {debouncedTicketSearch.trim()
                        ? 'No tickets match your search.'
                        : 'No tickets found'}
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.uuid}
                      className="border-b border-violet-50 hover:bg-violet-50/30"
                    >
                      <td className="px-3 py-2.5 text-xs font-medium text-foreground">
                        {ticket.ticket_number}
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-2.5 text-xs text-muted-foreground">
                        {ticket.qr_code || 'N/A'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground">
                        {ticket.event_ticket?.name || 'N/A'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                            statusBadgeClass(ticket.status),
                          )}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <UserTicketRowActions
                          ticket={ticket}
                          currentUserUuid={userUuid}
                          onActionComplete={() => void refreshAfterTicketChange()}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {ticketMeta.total > 0 ? (
            <PaginationBar
              page={ticketPage}
              lastPage={ticketMeta.last_page}
              total={ticketMeta.total}
              from={ticketMeta.from}
              to={ticketMeta.to}
              loading={ticketsLoading}
              onPageChange={setTicketPage}
              label="tickets"
            />
          ) : null}
        </section>
      </div>

      <section className="mt-1 shrink-0 rounded-2xl border border-violet-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-violet-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Transaction History</h2>
            <p className="text-xs text-muted-foreground">
              View all transactions for this user.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              placeholder="Search transactions..."
              className={cn(
                'h-9 w-full rounded-lg border border-violet-100 bg-white pr-3 pl-9 text-sm',
                'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
              )}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-violet-50/80">
              <tr className="border-b border-violet-100 text-[10px] tracking-wider text-muted-foreground uppercase">
                {[
                  'Merchant/Services',
                  'Payment Channel',
                  'Order Number',
                  'Total Amount',
                  'Payment Status',
                  'Paid At',
                  'Created At',
                ].map((col) => (
                  <th key={col} className="px-3 py-2 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactionsLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.uuid}
                    className="border-b border-violet-50 hover:bg-violet-50/30"
                  >
                    <td className="px-3 py-2.5 text-xs text-foreground">
                      {tx.event?.event_name ?? tx.event?.name ?? 'N/A'}
                    </td>
                    <td className="px-3 py-2.5 text-xs capitalize text-muted-foreground">
                      {tx.payment_provider ?? 'N/A'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                      {tx.order_number}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-foreground">
                      {formatCurrency(tx.total_amount)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                          statusBadgeClass(tx.order_status),
                        )}
                      >
                        {tx.order_status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDateTime(tx.paid_at)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDateTime(tx.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {transactionMeta.total > 0 ? (
          <PaginationBar
            page={transactionPage}
            lastPage={transactionMeta.last_page}
            total={transactionMeta.total}
            from={(transactionPage - 1) * PER_PAGE + 1}
            to={Math.min(transactionPage * PER_PAGE, transactionMeta.total)}
            loading={transactionsLoading}
            onPageChange={setTransactionPage}
            label="transactions"
          />
        ) : null}
      </section>

      <AddTicketModal
        open={addTicketOpen}
        onClose={() => setAddTicketOpen(false)}
        userUuid={userUuid}
        onSuccess={() => void refreshAfterTicketChange()}
      />
    </div>
  )
}

function PaginationBar({
  page,
  lastPage,
  total,
  from,
  to,
  loading,
  onPageChange,
  label,
}: {
  page: number
  lastPage: number
  total: number
  from: number
  to: number
  loading: boolean
  onPageChange: (page: number) => void
  label: string
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-violet-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {from} to {to} of {total} {label}
      </p>
      {lastPage > 1 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-violet-100 px-2.5 py-1 text-xs font-medium disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage || loading}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-violet-100 px-2.5 py-1 text-xs font-medium disabled:opacity-40"
          >
            Next
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
