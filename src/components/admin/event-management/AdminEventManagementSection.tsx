import { Link, useNavigate } from '@tanstack/react-router'
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { ReactNode } from 'react'
import type {
  PaginationMeta,
  VenueListing,
  VenueListingStats,
  VenueListingStatus,
} from '@/services/venueListingService'
import { RowActionsMenu } from '@/components/admin/event-management/RowActionsMenu'
import { VenueStatusBadge } from '@/components/admin/event-management/VenueStatusBadge'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  VENUE_STATUS_OPTIONS,
  formatCapacity,
  formatPeso,
  venueListingService,
} from '@/services/venueListingService'

const PER_PAGE = 15

type StatusFilter = 'all' | VenueListingStatus

function formatUpdated(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AdminEventManagementSection() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [listings, setListings] = useState<Array<VenueListing>>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [stats, setStats] = useState<VenueListingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VenueListing | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const loadListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [result, statsResult] = await Promise.all([
        venueListingService.list({
          page,
          per_page: PER_PAGE,
          search: search || undefined,
          status: status === 'all' ? undefined : status,
        }),
        venueListingService.stats(),
      ])
      setListings(result.data)
      setMeta(result.meta)
      setStats(statsResult)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load venues.'))
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => {
    void loadListings()
  }, [loadListings])

  const openListing = (listing: VenueListing) => {
    void navigate({
      to: '/admin/event-management/$venueId',
      params: { venueId: listing.uuid },
    })
  }

  const editListing = (listing: VenueListing) => {
    void navigate({
      to: '/admin/event-management/$venueId/edit',
      params: { venueId: listing.uuid },
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await venueListingService.remove(deleteTarget.uuid)
      toast.success(`"${deleteTarget.name}" has been deleted.`)
      setDeleteTarget(null)
      if (listings.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await loadListings()
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete venue.'))
    } finally {
      setDeleting(false)
    }
  }

  const rowActions = (listing: VenueListing) => [
    { label: 'View', icon: Eye, onSelect: () => openListing(listing) },
    { label: 'Edit', icon: Pencil, onSelect: () => editListing(listing) },
    {
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onSelect: () => setDeleteTarget(listing),
    },
  ]

  const statCards = [
    {
      label: 'Published Venues',
      value: stats?.published ?? 0,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Pending',
      value: stats?.pending ?? 0,
      icon: Clock,
      iconClass: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Total Venues',
      value: stats?.total ?? 0,
      icon: Building2,
      iconClass: 'bg-violet-100 text-paec-violet',
    },
    {
      label: 'Total Inquiries',
      value: (stats?.total_inquiries ?? 0).toLocaleString('en-US'),
      icon: MessageSquare,
      iconClass: 'bg-orange-100 text-paec-orange',
      newCount: stats?.new_inquiries ?? 0,
    },
  ]

  const emptyMessage =
    search || status !== 'all'
      ? 'No venues match your filters.'
      : 'No venues yet. Create your first venue listing.'

  return (
    <div className="flex min-h-0 flex-col gap-3 md:h-full">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            Event Management
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage your venue listings
          </p>
        </div>

        <Link
          to="/admin/event-management/create"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark sm:gap-2 sm:px-4 sm:text-sm"
        >
          <Plus className="size-3.5 sm:size-4" />
          Create Venue
        </Link>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-xl border border-violet-100 bg-white p-3 shadow-sm"
            >
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  stat.iconClass,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  {stat.label}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-foreground">
                    {stat.value}
                  </p>
                  {'newCount' in stat && stat.newCount ? (
                    <NewInquiryPill count={stat.newCount} />
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search venues..."
            className={inputClassName}
          />
        </div>

        <div className="relative w-full sm:w-40">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter)
              setPage(1)
            }}
            className={cn(inputClassName, 'appearance-none px-3 pl-3')}
          >
            <option value="all">All Status</option>
            {VENUE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm md:min-h-0 md:flex-1">
        <div className="md:hidden">
          {loading ? (
            <p className="px-4 py-10 text-center text-sm font-medium text-muted-foreground">
              Loading venues...
            </p>
          ) : listings.length === 0 ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <ul className="divide-y divide-violet-50">
              {listings.map((listing) => (
                <li key={listing.uuid}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openListing(listing)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openListing(listing)
                    }}
                    className="flex gap-3 px-4 py-3.5 transition-colors active:bg-violet-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {listing.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {listing.venue_type}
                          </p>
                        </div>
                        <VenueStatusBadge status={listing.status} />
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <MobileStat label="Location" value={listing.city} />
                        <MobileStat
                          label="Capacity"
                          value={formatCapacity(listing)}
                        />
                        <MobileStat
                          label="From / event"
                          value={formatPeso(listing.price_per_event)}
                        />
                        <MobileStat
                          label="Inquiries"
                          value={<InquiryCount listing={listing} />}
                        />
                      </dl>
                    </div>
                    <div className="-mr-2 shrink-0 self-start">
                      <RowActionsMenu actions={rowActions(listing)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden min-h-0 flex-1 overflow-auto md:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-violet-50/95 backdrop-blur-sm">
              <tr className="border-b border-violet-100">
                {[
                  'Venue',
                  'Status',
                  'Location',
                  'Capacity',
                  'From / Event',
                  'Inquiries',
                  'Updated',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Loading venues...
                    </p>
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState message={emptyMessage} />
                  </td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr
                    key={listing.uuid}
                    tabIndex={0}
                    onClick={() => openListing(listing)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openListing(listing)
                    }}
                    className="cursor-pointer border-b border-violet-50 transition-colors last:border-0 hover:bg-violet-50/40 focus-visible:bg-violet-50/40 focus-visible:outline-none"
                  >
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {listing.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {listing.venue_type}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <VenueStatusBadge status={listing.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">
                      {listing.city}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-foreground">
                      {formatCapacity(listing)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium whitespace-nowrap text-foreground">
                      {formatPeso(listing.price_per_event)}
                    </td>
                    <td className="px-4 py-3">
                      <InquiryCount listing={listing} />
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                      {formatUpdated(listing.updated_at)}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RowActionsMenu actions={rowActions(listing)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.total > 0 ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-violet-100 px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              Showing {(meta.current_page - 1) * meta.per_page + 1}–
              {(meta.current_page - 1) * meta.per_page + listings.length} of{' '}
              {meta.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => current - 1)}
                disabled={loading || meta.current_page <= 1}
                className={pageButtonClassName}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 font-medium text-foreground">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={loading || meta.current_page >= meta.last_page}
                className={pageButtonClassName}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete venue"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

function MobileStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground">{value}</dd>
    </div>
  )
}

function NewInquiryPill({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-paec-orange ring-1 ring-orange-200',
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-paec-orange opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-paec-orange" />
      </span>
      {count} new
    </span>
  )
}

function InquiryCount({ listing }: { listing: VenueListing }) {
  const total = listing.inquiries_count
  const fresh = listing.new_inquiries_count ?? 0

  return (
    <div className="flex items-center gap-1.5">
      <span
        title={`${total} ${total === 1 ? 'inquiry' : 'inquiries'} in total`}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums',
          total > 0
            ? 'bg-violet-50 text-paec-violet'
            : 'bg-slate-50 text-muted-foreground',
        )}
      >
        <MessageSquare className="size-3" />
        {total}
      </span>
      {fresh > 0 ? <NewInquiryPill count={fresh} /> : null}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-violet-50 text-paec-violet">
        <Building2 className="size-5" />
      </span>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  )
}

const inputClassName = cn(
  'h-9 w-full rounded-lg border border-violet-100 bg-white pr-3 pl-9 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const pageButtonClassName =
  'inline-flex size-8 items-center justify-center rounded-lg border border-violet-100 text-foreground transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40'
