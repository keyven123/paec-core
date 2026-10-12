import { Link, useNavigate } from '@tanstack/react-router'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  ExternalLink,
  EyeOff,
  ImageOff,
  MessageSquare,
  Plus,
  Send,
  Share2,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { BlockedDate } from '@/services/blockedDateService'
import type {
  PaginationMeta,
  VenueInquiry,
  VenueListingDetail,
  VenueListingStatus,
} from '@/services/venueListingService'
import { BlockDateRangeModal } from '@/components/admin/BlockDateRangeModal'
import {
  INQUIRY_STATUS_TABS,
  InquiryStatusBadge,
} from '@/components/admin/event-management/InquiryStatusBadge'
import { VenueSetupIcon } from '@/components/admin/event-management/VenueSetupIcon'
import { VenueStatusBadge } from '@/components/admin/event-management/VenueStatusBadge'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { blockedDateService } from '@/services/blockedDateService'
import {
  formatCapacity,
  formatPeso,
  venueListingService,
} from '@/services/venueListingService'

const INQUIRIES_PER_PAGE = 5

const cardClassName = 'rounded-xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6'

const tableHeadClassName =
  'px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'

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

function formatDateLong(value: string | null | undefined) {
  if (!value) return '—'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)
  return date
    .toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase()
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function AdminVenueDetailSection({ venueId }: { venueId: string }) {
  const navigate = useNavigate()
  const [listing, setListing] = useState<VenueListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [inquiries, setInquiries] = useState<Array<VenueInquiry>>([])
  const [inquiryMeta, setInquiryMeta] = useState<PaginationMeta | null>(null)
  const [inquiryCounts, setInquiryCounts] = useState<Partial<Record<string, number>>>({})
  const [inquiryStatus, setInquiryStatus] = useState('all')
  const [inquiryPage, setInquiryPage] = useState(1)
  const [inquiriesLoading, setInquiriesLoading] = useState(true)

  const [blockedDates, setBlockedDates] = useState<Array<BlockedDate>>([])
  const [blockedLoading, setBlockedLoading] = useState(true)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [removeBlockedTarget, setRemoveBlockedTarget] = useState<BlockedDate | null>(null)
  const [removingBlocked, setRemovingBlocked] = useState(false)

  const loadListing = useCallback(async () => {
    try {
      setListing(await venueListingService.get(venueId))
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load venue.'))
    } finally {
      setLoading(false)
    }
  }, [venueId])

  const loadInquiries = useCallback(async () => {
    setInquiriesLoading(true)
    try {
      const result = await venueListingService.listInquiries(venueId, {
        page: inquiryPage,
        per_page: INQUIRIES_PER_PAGE,
        status: inquiryStatus === 'all' ? undefined : inquiryStatus,
      })
      setInquiries(result.data)
      setInquiryMeta(result.meta)
      setInquiryCounts(result.status_counts)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load inquiries.'))
    } finally {
      setInquiriesLoading(false)
    }
  }, [venueId, inquiryPage, inquiryStatus])

  const loadBlockedDates = useCallback(async () => {
    setBlockedLoading(true)
    try {
      const result = await blockedDateService.list('venue-listings', venueId)
      setBlockedDates(
        [...result.data].sort((a, b) => a.blocked_date.localeCompare(b.blocked_date)),
      )
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load blocked dates.'))
    } finally {
      setBlockedLoading(false)
    }
  }, [venueId])

  useEffect(() => {
    void loadListing()
    void loadBlockedDates()
  }, [loadListing, loadBlockedDates])

  useEffect(() => {
    void loadInquiries()
  }, [loadInquiries])

  const changeStatus = async (status: VenueListingStatus, message: string) => {
    if (!listing) return
    setStatusSaving(true)
    try {
      await venueListingService.update(listing.uuid, { status })
      setListing((current) => (current ? { ...current, status } : current))
      toast.success(message)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update status.'))
    } finally {
      setStatusSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!listing) return
    setDeleting(true)
    try {
      await venueListingService.remove(listing.uuid)
      toast.success(`"${listing.name}" has been deleted.`)
      void navigate({ to: '/admin/event-management' })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete venue.'))
      setDeleting(false)
    }
  }

  const handleRemoveBlocked = async () => {
    if (!removeBlockedTarget) return
    setRemovingBlocked(true)
    try {
      await blockedDateService.remove('venue-listings', venueId, removeBlockedTarget.uuid)
      toast.success('Blocked date removed.')
      setRemoveBlockedTarget(null)
      await loadBlockedDates()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to remove blocked date.'))
    } finally {
      setRemovingBlocked(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading venue details…</p>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-red-600">{error ?? 'Venue not found.'}</p>
        <Link
          to="/admin/event-management"
          className="text-sm font-medium text-paec-violet hover:text-paec-violet-dark"
        >
          Back to Event Management
        </Link>
      </div>
    )
  }

  const images = [listing.featured_image_url, ...listing.gallery_image_urls].filter(
    (url): url is string => Boolean(url),
  )
  const currentImage = images[Math.min(activeImage, images.length - 1)]
  const isLive = listing.status === 'published' || listing.status === 'approved'
  const publicPath = `/venues/${listing.slug}`
  const description = listing.description?.trim() ?? ''
  const defaultPackage = listing.packages.find((pkg) => pkg.id === listing.default_package_id)
  const openInquiries =
    (inquiryCounts.all ?? 0) - (inquiryCounts.completed ?? 0) - (inquiryCounts.cancelled ?? 0)

  const handleShare = async () => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
    try {
      await navigator.clipboard.writeText(`${frontendUrl}${publicPath}`)
      toast.success('Share link copied to clipboard.')
    } catch {
      toast.error('Failed to copy link.')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 border-b border-violet-100 pb-4">
        <Link
          to="/admin/event-management"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back to Event Management
        </Link>

        <div className="min-w-0">
          <h1 className="text-xl font-bold break-words text-foreground sm:text-2xl lg:text-3xl">
            {listing.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VenueStatusBadge status={listing.status} className="px-2.5 text-xs" />
            {listing.is_featured ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Featured
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link
            to="/admin/event-management/$venueId/edit"
            params={{ venueId: listing.uuid }}
            className={cn(actionButton, 'bg-paec-violet text-white hover:bg-paec-violet-dark')}
          >
            <Edit className="size-4" />
            Edit Venue
          </Link>
          <Link
            to="/admin/event-management/$venueId/inquiries"
            params={{ venueId: listing.uuid }}
            className={cn(actionButton, 'bg-emerald-600 text-white hover:bg-emerald-700')}
          >
            <MessageSquare className="size-4" />
            Inquiries
            <span className="rounded-full bg-white/25 px-1.5 text-[11px] leading-5 font-bold">
              {inquiryCounts.all ?? listing.stats.inquiries_count}
            </span>
          </Link>
          {isLive ? (
            <ActionButton
              label="Unpublish"
              icon={EyeOff}
              className="bg-amber-500 text-white hover:bg-amber-600"
              disabled={statusSaving}
              onClick={() => void changeStatus('inactive', 'Venue unpublished.')}
            />
          ) : (
            <ActionButton
              label="Publish"
              icon={Send}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={statusSaving}
              onClick={() => void changeStatus('published', 'Venue published.')}
            />
          )}
          {isLive ? (
            <>
              <a
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  actionButton,
                  'border border-violet-200 bg-white text-foreground hover:bg-violet-50',
                )}
              >
                <ExternalLink className="size-4" />
                View Page
              </a>
              <ActionButton
                label="Share"
                icon={Share2}
                className="bg-sky-600 text-white hover:bg-sky-700"
                onClick={() => void handleShare()}
              />
            </>
          ) : null}
          <ActionButton
            label="Delete"
            icon={Trash2}
            className="border border-red-200 bg-white text-red-600 hover:bg-red-50"
            onClick={() => setShowDelete(true)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="min-w-0 space-y-4 lg:col-span-2 lg:space-y-6">
            <section className={cardClassName}>
              <h2 className="mb-4 text-base font-semibold text-foreground sm:text-lg">
                Venue Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Venue Name" value={listing.name} />
                <DetailField label="Venue Type" value={listing.venue_type || '—'} />
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <p
                    className={cn(
                      'mt-1 text-sm font-medium whitespace-pre-line text-foreground',
                      !showFullDescription && 'line-clamp-5',
                    )}
                  >
                    {description || 'No description provided'}
                  </p>
                  {description.length > 300 || description.split('\n').length > 5 ? (
                    <button
                      type="button"
                      onClick={() => setShowFullDescription((value) => !value)}
                      className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-paec-violet hover:text-paec-violet-dark"
                    >
                      {showFullDescription ? 'Show less' : 'Show more'}
                      <ChevronDown
                        className={cn('size-3.5 transition-transform', showFullDescription && 'rotate-180')}
                      />
                    </button>
                  ) : null}
                </div>
                <DetailField label="Venue Address" value={listing.address || '—'} />
                <DetailField
                  label="City"
                  value={[listing.city, listing.region].filter(Boolean).join(', ') || '—'}
                />
                <DetailField label="Capacity" value={formatCapacity(listing)} />
                <DetailField label="Floor Area" value={listing.area || '—'} />
                <DetailField
                  label="Starting Price"
                  value={listing.price_per_event > 0 ? `${formatPeso(listing.price_per_event)} / event` : 'Price on request'}
                />
                <DetailField label="Page URL" value={publicPath} />
              </div>
            </section>

            <section className={cardClassName}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">Photos</h2>
                <span className="text-xs text-muted-foreground">
                  {images.length} photo{images.length !== 1 ? 's' : ''}
                </span>
              </div>
              {currentImage ? (
                <>
                  <div className="aspect-[16/9] overflow-hidden rounded-lg bg-violet-50">
                    <img src={currentImage} alt={listing.name} className="size-full object-cover" />
                  </div>
                  {images.length > 1 ? (
                    <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto">
                      {images.map((url, index) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setActiveImage(index)}
                          className={cn(
                            'h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                            index === activeImage
                              ? 'border-paec-violet'
                              : 'border-transparent opacity-70 hover:opacity-100',
                          )}
                          aria-label={`Show photo ${index + 1}`}
                        >
                          <img src={url} alt="" className="size-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-violet-200 bg-violet-50/40 text-sm text-muted-foreground">
                  <ImageOff className="size-6 text-violet-300" />
                  No photos yet
                  <Link
                    to="/admin/event-management/$venueId/edit"
                    params={{ venueId: listing.uuid }}
                    className="text-xs font-semibold text-paec-violet hover:underline"
                  >
                    Add photos
                  </Link>
                </div>
              )}
            </section>

            <section className={cardClassName}>
              <h2 className="mb-4 text-base font-semibold text-foreground sm:text-lg">
                Inquiry Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryTile
                  value={listing.stats.inquiries_count}
                  label="Total Inquiries"
                  className="bg-violet-50/60 text-paec-orange"
                />
                <SummaryTile
                  value={Math.max(0, openInquiries)}
                  label="Open Inquiries"
                  className="bg-sky-50/60 text-sky-600"
                />
                <SummaryTile
                  value={listing.stats.bookings_count}
                  label="Confirmed Bookings"
                  className="bg-emerald-50/60 text-emerald-600"
                />
              </div>
            </section>

            <section className={cardClassName}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-foreground sm:text-lg">
                    Recent Inquiries
                  </h2>
                  <Link
                    to="/admin/event-management/$venueId/inquiries"
                    params={{ venueId: listing.uuid }}
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-paec-violet hover:text-paec-violet-dark"
                  >
                    View all
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
                <div className="relative w-full sm:w-56">
                  <select
                    value={inquiryStatus}
                    onChange={(e) => {
                      setInquiryStatus(e.target.value)
                      setInquiryPage(1)
                    }}
                    className="h-9 w-full appearance-none rounded-lg border border-violet-100 bg-white px-3 text-sm focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
                  >
                    {INQUIRY_STATUS_TABS.map((tab) => (
                      <option key={tab.value} value={tab.value}>
                        {tab.label} ({inquiryCounts[tab.value] ?? 0})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {inquiriesLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading inquiries…</p>
              ) : inquiries.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <MessageSquare className="mb-2 size-6 text-violet-300" />
                  <p className="text-sm text-muted-foreground">
                    {inquiryStatus === 'all' ? 'No inquiries yet.' : 'No inquiries with this status.'}
                  </p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-violet-50 md:hidden">
                    {inquiries.map((inquiry) => (
                      <li key={inquiry.uuid} className="py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {inquiry.full_name ?? 'Guest'}
                            </p>
                            {inquiry.email ? (
                              <p className="truncate text-xs text-muted-foreground">{inquiry.email}</p>
                            ) : null}
                          </div>
                          <InquiryStatus inquiry={inquiry} />
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          {inquiry.guest_count ?? '—'} guests · Event {formatDate(inquiry.event_date)} ·
                          Received {formatDate(inquiry.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto rounded-lg border border-violet-100 md:block">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="bg-violet-50/80">
                        <tr>
                          {['Customer', 'Guests', 'Event date', 'Status', 'Received'].map((col) => (
                            <th key={col} className={tableHeadClassName}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.map((inquiry) => (
                          <tr key={inquiry.uuid} className="border-t border-violet-50">
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-foreground">{inquiry.full_name ?? 'Guest'}</p>
                              {inquiry.email ? (
                                <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">{inquiry.guest_count ?? '—'}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                              {formatDate(inquiry.event_date)}
                            </td>
                            <td className="px-3 py-2.5">
                              <InquiryStatus inquiry={inquiry} />
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                              {formatDate(inquiry.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {inquiryMeta && inquiryMeta.last_page > 1 ? (
                    <div className="mt-3 flex items-center justify-end gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setInquiryPage((page) => page - 1)}
                        disabled={inquiryMeta.current_page <= 1}
                        className={pageButton}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <span className="px-2 font-medium">
                        {inquiryMeta.current_page} / {inquiryMeta.last_page}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInquiryPage((page) => page + 1)}
                        disabled={inquiryMeta.current_page >= inquiryMeta.last_page}
                        className={pageButton}
                        aria-label="Next page"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>

            <section className={cardClassName}>
              <h2 className="mb-4 text-base font-semibold text-foreground sm:text-lg">Packages</h2>
              {listing.packages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No packages configured yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-violet-100 text-left text-xs tracking-wide text-muted-foreground uppercase">
                        <th className="px-2 py-2">Package</th>
                        <th className="px-2 py-2">Time</th>
                        <th className="px-2 py-2 text-right">Price From</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listing.packages.map((pkg) => (
                        <tr key={pkg.id} className="border-b border-violet-50 last:border-0">
                          <td className="px-2 py-3">
                            <p className="font-medium text-foreground">
                              {pkg.label}
                              {pkg.id === listing.default_package_id ? (
                                <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-paec-violet uppercase">
                                  Default
                                </span>
                              ) : null}
                            </p>
                            {pkg.note ? (
                              <p className="mt-0.5 text-xs text-muted-foreground">{pkg.note}</p>
                            ) : null}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                            {pkg.time_label ?? `${formatTime(pkg.start_time)} – ${formatTime(pkg.end_time)}`}
                          </td>
                          <td className="px-2 py-3 text-right font-medium whitespace-nowrap text-paec-orange">
                            {pkg.priceFrom > 0 ? formatPeso(pkg.priceFrom) : 'On request'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className={cardClassName}>
              <h2 className="mb-4 text-base font-semibold text-foreground sm:text-lg">
                Setups &amp; Specifications
              </h2>
              {listing.setups?.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {listing.setups.map((setup) => (
                    <div
                      key={setup.id}
                      className="flex flex-col items-center rounded-xl border border-violet-100 bg-violet-50/30 px-3 py-3 text-center"
                    >
                      <VenueSetupIcon setupId={setup.id} className="h-10 w-14" />
                      <p className="mt-1.5 text-sm font-semibold text-foreground">{setup.label}</p>
                      <p className="text-xs text-muted-foreground">up to {setup.capacity} pax</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No table setups configured yet.</p>
              )}
              {listing.specs?.length ? (
                <div className="mt-5 grid gap-4 border-t border-violet-50 pt-5 sm:grid-cols-3">
                  {listing.specs.map((spec) => (
                    <DetailField key={spec.label} label={spec.label} value={spec.value} />
                  ))}
                </div>
              ) : null}
            </section>

            <section className={cardClassName}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">Blocked Dates</h2>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-paec-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-paec-orange-light"
                >
                  <Plus className="size-3.5" />
                  Add Date
                </button>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Customers cannot send inquiries for blocked dates.
              </p>

              {blockedLoading ? (
                <p className="py-6 text-sm text-muted-foreground">Loading blocked dates…</p>
              ) : blockedDates.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">No blocked dates for this venue.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-violet-100">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="bg-violet-50/80">
                      <tr>
                        <th className={tableHeadClassName}>Date</th>
                        <th className={tableHeadClassName}>Reason</th>
                        <th className={tableHeadClassName}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedDates.map((blocked) => (
                        <tr key={blocked.uuid} className="border-t border-violet-50">
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {formatDateLong(blocked.blocked_date.slice(0, 10))}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {blocked.reason?.trim() || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => setRemoveBlockedTarget(blocked)}
                              className="inline-flex size-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50"
                              aria-label="Remove blocked date"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="min-w-0 space-y-4 lg:space-y-6">
            <section className={cardClassName}>
              <h2 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
                Venue Status
              </h2>
              <StatusRow
                label="Status"
                value={listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              />
              <StatusRow label="Organization" value={listing.organization_name || '—'} />
              <StatusRow label="Created At" value={formatDateLong(listing.created_at)} />
              <StatusRow label="Last Updated" value={formatDateLong(listing.updated_at)} />
              <StatusRow label="Featured" value={listing.is_featured ? 'Yes' : 'No'} />
              <StatusRow label="Default Package" value={defaultPackage?.label ?? '—'} />
              <StatusRow label="Table Setups" value={String(listing.setups?.length ?? 0)} />
              <StatusRow label="Blocked Dates" value={String(blockedDates.length)} />
            </section>

            <section className={cardClassName}>
              <h2 className="mb-4 text-base font-semibold text-foreground sm:text-lg">Best For</h2>
              <TagList tags={listing.best_for ?? []} empty="No event types selected." />
            </section>

            <section className={cardClassName}>
              <h2 className="mb-4 text-base font-semibold text-foreground sm:text-lg">Amenities</h2>
              <TagList tags={listing.amenities ?? []} empty="No amenities listed." />
            </section>
          </div>
        </div>
      </div>

      <BlockDateRangeModal
        open={showBlockModal}
        activityId={venueId}
        resource="venue-listings"
        onClose={() => setShowBlockModal(false)}
        onBlocked={loadBlockedDates}
      />

      <ConfirmModal
        open={showDelete}
        title="Delete venue"
        message={`Delete "${listing.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onClose={() => {
          if (!deleting) setShowDelete(false)
        }}
        onConfirm={() => void handleDelete()}
      />

      <ConfirmModal
        open={removeBlockedTarget !== null}
        title="Remove blocked date"
        message={
          removeBlockedTarget
            ? `Unblock ${formatDate(removeBlockedTarget.blocked_date.slice(0, 10))}? Customers will be able to inquire for this date again.`
            : ''
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        loading={removingBlocked}
        onClose={() => {
          if (!removingBlocked) setRemoveBlockedTarget(null)
        }}
        onConfirm={() => void handleRemoveBlocked()}
      />
    </div>
  )
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  className,
  disabled,
}: {
  label: string
  icon: LucideIcon
  onClick?: () => void
  className: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(actionButton, className)}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium break-words text-foreground">{value}</p>
    </div>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-violet-50 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium break-words text-foreground">
        {value}
      </span>
    </div>
  )
}

function SummaryTile({
  value,
  label,
  className,
}: {
  value: ReactNode
  label: string
  className: string
}) {
  return (
    <div className={cn('rounded-xl p-4 text-center', className)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function TagList({ tags, empty }: { tags: Array<string>; empty: string }) {
  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-medium text-paec-violet"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

function InquiryStatus({ inquiry }: { inquiry: VenueInquiry }) {
  return <InquiryStatusBadge status={inquiry.status} label={inquiry.status_label} />
}

const actionButton =
  'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm'

const pageButton =
  'inline-flex size-8 items-center justify-center rounded-lg border border-violet-100 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40'
