import { Loader2, Search, Ticket as TicketIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'

import { TicketPassCard } from '@/components/account/TicketPassCard'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ticketService, type Ticket as CustomerTicket } from '@/services/ticketService'

type TicketTab = 'upcoming' | 'past' | 'transferred'

const TICKETS_PER_PAGE = 10

const tabs: { id: TicketTab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'transferred', label: 'Transferred' },
]

export function MyTicketsSection() {
  const [activeTab, setActiveTab] = useState<TicketTab>('upcoming')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tickets, setTickets] = useState<CustomerTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const response = await ticketService.getCustomerTickets(
        page,
        TICKETS_PER_PAGE,
        debouncedSearch,
        activeTab,
      )
      setTickets(response.data ?? [])
      setTotalPages(Math.max(1, response.meta?.last_page ?? 1))
      setTotal(response.meta?.total ?? 0)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load tickets.'))
      setTickets([])
      setTotalPages(1)
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [activeTab, debouncedSearch, page])

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  useEffect(() => {
    setPage(1)
  }, [activeTab, debouncedSearch])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            My <span className="text-paec-violet">tickets</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your upcoming and past events.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className={cn(
              'h-10 w-full rounded-full border border-violet-100 bg-white pr-4 pl-10 text-sm',
              'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
            )}
          />
        </div>
      </div>

      <div className="mt-6 border-b border-violet-100">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'border-b-2 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-paec-violet text-paec-violet'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-paec-violet" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="mt-8 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-violet-100 bg-white px-6 py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-50">
            <TicketIcon className="size-8 text-paec-violet/40" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No tickets here</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Book an attraction to see your tickets.
          </p>
          <Link
            to="/"
            className="mt-4 text-sm font-semibold text-paec-violet hover:underline"
          >
            Explore activities
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {tickets.map((ticket) => (
            <TicketPassCard key={ticket.uuid} ticket={ticket} />
          ))}

          {totalPages > 1 ? (
            <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-center sm:gap-3">
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
                {total > 0 ? ` · ${total} tickets` : ''}
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
    </div>
  )
}
