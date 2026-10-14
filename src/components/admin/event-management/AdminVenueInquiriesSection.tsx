import { Link } from '@tanstack/react-router'
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  PartyPopper,
  Phone,
  Search,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type {
  PaginationMeta,
  VenueInquiry,
  VenueListingDetail,
} from '@/services/venueListingService'
import { InquiryStatusBadge } from '@/components/admin/event-management/InquiryStatusBadge'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatPeso, venueListingService } from '@/services/venueListingService'

const PER_PAGE = 20

const cardClassName = 'rounded-xl border border-violet-100 bg-white shadow-sm'

const tableHeadClassName =
  'px-4 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatLongDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AdminVenueInquiriesSection({ venueId }: { venueId: string }) {
  const [venue, setVenue] = useState<VenueListingDetail | null>(null)
  const [inquiries, setInquiries] = useState<Array<VenueInquiry>>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<VenueInquiry | null>(null)
  const [unviewedCount, setUnviewedCount] = useState(0)

  const setViewedAt = (uuid: string, viewedAt: string | null) => {
    setInquiries((current) =>
      current.map((item) => (item.uuid === uuid ? { ...item, viewed_at: viewedAt } : item)),
    )
  }

  const openInquiry = (inquiry: VenueInquiry) => {
    setSelected(inquiry)
    if (inquiry.viewed_at) return

    setViewedAt(inquiry.uuid, new Date().toISOString())
    setUnviewedCount((count) => Math.max(0, count - 1))
    venueListingService.markInquiryViewed(inquiry.uuid).catch(() => {
      setViewedAt(inquiry.uuid, null)
      setUnviewedCount((count) => count + 1)
    })
  }

  useEffect(() => {
    venueListingService
      .get(venueId)
      .then(setVenue)
      .catch(() => setVenue(null))
  }, [venueId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    venueListingService
      .listInquiries(venueId, {
        page,
        per_page: PER_PAGE,
        q: search || undefined,
      })
      .then((result) => {
        if (cancelled) return
        setInquiries(result.data)
        setMeta(result.meta)
        setUnviewedCount(result.status_counts.unviewed ?? 0)
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(getApiErrorMessage(err, 'Failed to load inquiries.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [venueId, page, search])

  const rangeStart = meta && meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0
  const rangeEnd = meta ? Math.min(meta.current_page * meta.per_page, meta.total) : 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 border-b border-violet-100 pb-4">
        <Link
          to="/admin/event-management/$venueId"
          params={{ venueId }}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back to Venue
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">Inquiries</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              All customer inquiries{venue ? ` · ${venue.name}` : ''}
              {unviewedCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-paec-orange ring-1 ring-orange-200">
                  <span className="size-1.5 rounded-full bg-paec-orange" />
                  {unviewedCount} new
                </span>
              ) : null}
            </p>
          </div>

          <div className="relative w-full shrink-0 sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email or message"
              className="h-10 w-full rounded-lg border border-violet-100 bg-white pr-3 pl-9 text-sm focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        {loading && inquiries.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading inquiries…</p>
        ) : inquiries.length === 0 ? (
          <div className={cn(cardClassName, 'flex flex-col items-center px-6 py-14 text-center')}>
            <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-violet-50 text-paec-violet">
              <MessageSquare className="size-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">No inquiries found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? 'Try a different search term.'
                : 'Customer inquiries for this venue will appear here.'}
            </p>
          </div>
        ) : (
          <div className={cn(cardClassName, loading && 'opacity-60 transition-opacity')}>
            <ul className="divide-y divide-violet-50 md:hidden">
              {inquiries.map((inquiry) => (
                <li key={inquiry.uuid}>
                  <button
                    type="button"
                    onClick={() => openInquiry(inquiry)}
                    className={cn(
                      'flex w-full flex-col gap-1.5 border-l-[3px] px-4 py-3.5 text-left transition-colors',
                      isUnviewed(inquiry)
                        ? 'border-l-paec-orange bg-violet-50/60 hover:bg-violet-50'
                        : 'border-l-transparent hover:bg-violet-50/40',
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <InquiryName inquiry={inquiry} />
                      <InquiryStatusBadge status={inquiry.status} label={inquiry.status_label} />
                    </div>
                    <ContactLine inquiry={inquiry} />
                    <p className="text-[11px] text-muted-foreground">
                      {[
                        inquiry.guest_count ? `${inquiry.guest_count} guests` : null,
                        inquiry.event_date ? `Event ${formatDate(inquiry.event_date)}` : null,
                        `Received ${formatDate(inquiry.created_at)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-violet-100 bg-violet-50/60">
                  <tr>
                    <th className={tableHeadClassName}>Customer</th>
                    <th className={tableHeadClassName}>Contact</th>
                    <th className={tableHeadClassName}>Guests</th>
                    <th className={tableHeadClassName}>Event date</th>
                    <th className={tableHeadClassName}>Status</th>
                    <th className={tableHeadClassName}>Received</th>
                    <th className={tableHeadClassName}>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inquiry) => (
                    <tr
                      key={inquiry.uuid}
                      onClick={() => openInquiry(inquiry)}
                      className={cn(
                        'cursor-pointer border-b border-violet-50 transition-colors last:border-0',
                        isUnviewed(inquiry) ? 'bg-violet-50/60 hover:bg-violet-50' : 'hover:bg-violet-50/40',
                      )}
                    >
                      <td
                        className={cn(
                          'border-l-[3px] px-4 py-3',
                          isUnviewed(inquiry) ? 'border-l-paec-orange' : 'border-l-transparent',
                        )}
                      >
                        <InquiryName inquiry={inquiry} />
                        {inquiry.event_type ? (
                          <p className="text-xs text-muted-foreground">{inquiry.event_type}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <ContactLine inquiry={inquiry} stacked />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{inquiry.guest_count ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDate(inquiry.event_date)}
                      </td>
                      <td className="px-4 py-3">
                        <InquiryStatusBadge status={inquiry.status} label={inquiry.status_label} />
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 whitespace-nowrap',
                          isUnviewed(inquiry) ? 'font-semibold text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {formatDate(inquiry.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta ? (
              <div className="flex flex-col gap-2 border-t border-violet-100 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {rangeStart}–{rangeEnd} of {meta.total} inquir{meta.total === 1 ? 'y' : 'ies'}
                </span>
                {meta.last_page > 1 ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((current) => current - 1)}
                      disabled={meta.current_page <= 1}
                      className={pageButton}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="px-2 font-medium text-foreground">
                      Page {meta.current_page} of {meta.last_page}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={meta.current_page >= meta.last_page}
                      className={pageButton}
                      aria-label="Next page"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {selected ? (
        <InquiryDetailModal
          inquiry={selected}
          venueName={venue?.name ?? null}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}

function isUnviewed(inquiry: VenueInquiry) {
  return !inquiry.viewed_at
}

function InquiryName({ inquiry }: { inquiry: VenueInquiry }) {
  const unviewed = isUnviewed(inquiry)
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm text-foreground">
      {unviewed ? (
        <span className="size-2 shrink-0 rounded-full bg-paec-orange" aria-label="Not opened yet" />
      ) : null}
      <span className={cn('truncate', unviewed ? 'font-bold' : 'font-semibold')}>
        {inquiry.full_name ?? 'Guest'}
      </span>
    </p>
  )
}

function ContactLine({ inquiry, stacked = false }: { inquiry: VenueInquiry; stacked?: boolean }) {
  if (!inquiry.email && !inquiry.phone) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="size-3" />
        Shared after deposit
      </span>
    )
  }
  return (
    <div className={cn('flex text-xs text-muted-foreground', stacked ? 'flex-col gap-0.5' : 'flex-wrap gap-x-3')}>
      {inquiry.email ? <span className="truncate">{inquiry.email}</span> : null}
      {inquiry.phone ? <span>{inquiry.phone}</span> : null}
    </div>
  )
}

function InquiryDetailModal({
  inquiry,
  venueName,
  onClose,
}: {
  inquiry: VenueInquiry
  venueName: string | null
  onClose: () => void
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const contactHidden = !inquiry.email && !inquiry.phone
  const amounts = [
    { label: 'Proposal amount', value: inquiry.proposal_amount },
    { label: 'Deposit amount', value: inquiry.deposit_amount },
    { label: 'Balance amount', value: inquiry.balance_amount },
  ].filter((item): item is { label: string; value: number } => typeof item.value === 'number')

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close inquiry details"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-detail-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-violet-100 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-violet-100 px-5 py-4">
          <div className="min-w-0">
            <h3 id="inquiry-detail-title" className="truncate text-lg font-bold text-foreground">
              {inquiry.full_name ?? 'Guest'}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <InquiryStatusBadge status={inquiry.status} label={inquiry.status_label} />
              Received {formatDateTime(inquiry.created_at)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          <ModalSection title="Customer information">
            <InfoRow icon={User} label="Full name" value={inquiry.full_name ?? 'Guest'} />
            <InfoRow
              icon={Mail}
              label="Email address"
              value={inquiry.email}
              href={inquiry.email ? `mailto:${inquiry.email}` : undefined}
            />
            <InfoRow
              icon={Phone}
              label="Mobile number"
              value={inquiry.phone}
              href={inquiry.phone ? `tel:${inquiry.phone}` : undefined}
            />
            {contactHidden ? (
              <p className="flex items-start gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-paec-violet" />
                Contact details are shared once the customer pays the deposit.
              </p>
            ) : null}
          </ModalSection>

          <ModalSection title="Inquiry details">
            {venueName ? <InfoRow icon={Building2} label="Venue" value={venueName} /> : null}
            <InfoRow
              icon={CalendarDays}
              label="Event date"
              value={inquiry.event_date ? formatLongDate(inquiry.event_date) : null}
            />
            <InfoRow
              icon={Users}
              label="Number of guests"
              value={inquiry.guest_count ? `${inquiry.guest_count.toLocaleString()} pax` : null}
            />
            {inquiry.event_type ? (
              <InfoRow icon={PartyPopper} label="Event type" value={inquiry.event_type} />
            ) : null}
            {inquiry.site_visit_label ? (
              <InfoRow icon={MapPin} label="Site visit" value={inquiry.site_visit_label} />
            ) : null}
            {inquiry.visit_scheduled_label ? (
              <InfoRow icon={Clock} label="Visit schedule" value={inquiry.visit_scheduled_label} />
            ) : null}
            {amounts.map((item) => (
              <InfoRow key={item.label} icon={Wallet} label={item.label} value={formatPeso(item.value)} />
            ))}
          </ModalSection>

          {inquiry.message?.trim() ? (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Message
              </p>
              <p className="rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2.5 text-sm whitespace-pre-line text-foreground">
                {inquiry.message.trim()}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ModalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h4>
      <div className="divide-y divide-violet-50 rounded-xl border border-violet-100">{children}</div>
    </section>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: string | null | undefined
  href?: string
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-paec-violet">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        {value && href ? (
          <a
            href={href}
            className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-paec-violet"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-semibold break-words text-foreground">{value || '—'}</p>
        )}
      </div>
    </div>
  )
}

const pageButton =
  'inline-flex size-8 items-center justify-center rounded-lg border border-violet-100 bg-white transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40'
