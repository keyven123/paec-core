import { Link } from '@tanstack/react-router'
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  Download,
  Edit,
  Plus,
  Share2,
  Ticket,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState, type ComponentType } from 'react'
import { toast } from 'sonner'

import type { ActivityStatus } from '@/data/mockAdminActivities'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
import { formatCutoffTimeLabel } from '@/lib/visitDate'
import { cn } from '@/lib/utils'
import {
  adminEventService,
  type AdminEvent,
  type EventReportExportType,
  type EventTicketsSold,
  type RecentActivityItem,
} from '@/services/adminEventService'
import {
  eventLocationService,
  type EventLocation,
} from '@/services/eventLocationService'
import {
  blockedDateService,
  type BlockedDate,
} from '@/services/blockedDateService'

type AdminActivityDetailSectionProps = {
  activityId: string
}

const EXPORT_OPTIONS: { value: EventReportExportType; label: string }[] = [
  { value: 'purchasers', label: 'Purchasers' },
  { value: 'used_tickets', label: 'Customer Attended' },
  { value: 'attendee_registration', label: 'Attendee Registration Report' },
  { value: 'ticket_list', label: 'Ticket List' },
]

const cardClassName =
  'rounded-xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6'

function getDefaultExportDates() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    start: firstOfMonth.toISOString().slice(0, 10),
    end: today.toISOString().slice(0, 10),
  }
}

function formatDateLong(dateString: string) {
  return new Date(dateString)
    .toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase()
}

function formatPrice(value: number | string) {
  const amount = typeof value === 'number' ? value : Number.parseFloat(value)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount)
}

function getDateRangeLabel(event: AdminEvent) {
  const schedule = event.schedules?.[0]
  if (!schedule?.date_from) return 'No date set'

  const from = formatDateLong(schedule.date_from)
  if (!schedule.date_to || schedule.date_to === schedule.date_from) {
    return from
  }

  return `${from} – ${formatDateLong(schedule.date_to)}`
}

function getScheduleTypeLabel(scheduleType?: string) {
  if (!scheduleType) return '—'
  if (scheduleType === 'daily') return 'Daily'
  if (scheduleType === 'single') return 'Single'
  return scheduleType.charAt(0).toUpperCase() + scheduleType.slice(1)
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status as ActivityStatus
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        normalized === 'published' && 'bg-paec-violet text-white',
        normalized === 'pending' && 'bg-amber-100 text-amber-700',
        normalized === 'draft' && 'bg-violet-100 text-muted-foreground',
        !['published', 'pending', 'draft'].includes(normalized) &&
          'bg-slate-100 text-slate-700',
      )}
    >
      {status}
    </span>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-violet-50 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">
        {value}
      </span>
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
  icon: ComponentType<{ className?: string }>
  onClick?: () => void
  className: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
        className,
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

export function AdminActivityDetailSection({
  activityId,
}: AdminActivityDetailSectionProps) {
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [ticketsSold, setTicketsSold] = useState<EventTicketsSold | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>(
    [],
  )
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const defaultExportDates = getDefaultExportDates()
  const [exportType, setExportType] =
    useState<EventReportExportType>('purchasers')
  const [exportStartDate, setExportStartDate] = useState(defaultExportDates.start)
  const [exportEndDate, setExportEndDate] = useState(defaultExportDates.end)
  const [blockedDatesLoading, setBlockedDatesLoading] = useState(false)
  const [showBlockedDateModal, setShowBlockedDateModal] = useState(false)
  const [blockedDateForm, setBlockedDateForm] = useState({
    blocked_date: '',
    reason: '',
  })
  const [isCreatingBlockedDate, setIsCreatingBlockedDate] = useState(false)
  const [deleteBlockedTarget, setDeleteBlockedTarget] =
    useState<BlockedDate | null>(null)
  const [deletingBlockedDateId, setDeletingBlockedDateId] = useState<
    string | null
  >(null)
  const [todayCutoffTime, setTodayCutoffTime] = useState('')
  const [isSavingTodayCutoff, setIsSavingTodayCutoff] = useState(false)
  const [locations, setLocations] = useState<EventLocation[]>([])
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<EventLocation | null>(
    null,
  )
  const [locationForm, setLocationForm] = useState({
    name: '',
    city: '',
    address: '',
  })
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [deleteLocationTarget, setDeleteLocationTarget] =
    useState<EventLocation | null>(null)

  const fetchBlockedDates = useCallback(async () => {
    setBlockedDatesLoading(true)
    try {
      const response = await blockedDateService.list('events', activityId)
      setBlockedDates(response.data ?? [])
    } catch {
      setBlockedDates([])
    } finally {
      setBlockedDatesLoading(false)
    }
  }, [activityId])

  const loadActivity = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [eventResponse, ticketsSoldResponse, activitiesResponse, locationsResponse] =
        await Promise.all([
          adminEventService.getEventDetails(activityId),
          adminEventService.getEventTicketsSold(activityId),
          adminEventService.getRecentPurchasedTickets(activityId),
          eventLocationService.list(activityId),
        ])

      setEvent(eventResponse.data)
      setTodayCutoffTime(eventResponse.data.today_cutoff_time ?? '')
      setTicketsSold(ticketsSoldResponse)
      setRecentActivities(activitiesResponse.activities ?? [])
      setLocations(locationsResponse)

      if (eventResponse.data.event_section_name === 'amusements') {
        await fetchBlockedDates()
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load activity details.'))
    } finally {
      setLoading(false)
    }
  }, [activityId, fetchBlockedDates])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  const openLocationModal = (location?: EventLocation) => {
    setEditingLocation(location ?? null)
    setLocationForm({
      name: location?.name ?? '',
      city: location?.city ?? event?.city ?? '',
      address: location?.address ?? '',
    })
    setShowLocationModal(true)
  }

  const handleSaveLocation = async () => {
    if (!locationForm.city.trim()) {
      toast.error('City is required')
      return
    }

    setIsSavingLocation(true)
    try {
      if (editingLocation) {
        await eventLocationService.update(activityId, editingLocation.uuid, {
          name: locationForm.name.trim() || undefined,
          city: locationForm.city.trim(),
          address: locationForm.address.trim() || undefined,
        })
        toast.success('Location updated')
      } else {
        await eventLocationService.create(activityId, {
          name: locationForm.name.trim() || undefined,
          city: locationForm.city.trim(),
          address: locationForm.address.trim() || undefined,
        })
        toast.success('Location added')
      }
      setShowLocationModal(false)
      await loadActivity()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save location'))
    } finally {
      setIsSavingLocation(false)
    }
  }

  const handleDeleteLocation = async () => {
    if (!deleteLocationTarget) return

    try {
      await eventLocationService.remove(activityId, deleteLocationTarget.uuid)
      toast.success('Location removed')
      setDeleteLocationTarget(null)
      await loadActivity()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to remove location'))
    }
  }

  const handleShare = async () => {
    if (!event) return

    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
    const shareUrl = `${frontendUrl}/attractions/${event.slug || event.uuid}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard.')
    } catch {
      toast.error('Failed to copy link.')
    }
  }

  const handleConfirmExport = async () => {
    if (!exportStartDate || !exportEndDate || exportStartDate > exportEndDate) {
      return
    }

    const exportLabel =
      EXPORT_OPTIONS.find((option) => option.value === exportType)?.label ??
      'Report'

    setIsExporting(true)
    try {
      await adminEventService.exportEventReport(activityId, exportType, {
        start_date: exportStartDate,
        end_date: exportEndDate,
      })
      setShowExportModal(false)
      toast.success(`${exportLabel} downloaded successfully.`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Export failed.'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleCreateBlockedDate = async () => {
    if (!blockedDateForm.blocked_date.trim()) {
      toast.error('Please select a date.')
      return
    }

    setIsCreatingBlockedDate(true)
    try {
      await blockedDateService.create('events', activityId, {
        blocked_date: blockedDateForm.blocked_date,
        reason: blockedDateForm.reason.trim() || null,
      })
      toast.success('Blocked date added.')
      setShowBlockedDateModal(false)
      setBlockedDateForm({ blocked_date: '', reason: '' })
      await fetchBlockedDates()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to add blocked date.'))
    } finally {
      setIsCreatingBlockedDate(false)
    }
  }

  const handleDeleteBlockedDate = async () => {
    if (!deleteBlockedTarget) return

    setDeletingBlockedDateId(deleteBlockedTarget.uuid)
    try {
      await blockedDateService.remove(
        'events',
        activityId,
        deleteBlockedTarget.uuid,
      )
      toast.success('Blocked date deleted.')
      setDeleteBlockedTarget(null)
      await fetchBlockedDates()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete blocked date.'))
    } finally {
      setDeletingBlockedDateId(null)
    }
  }

  const handleSaveTodayCutoff = async () => {
    setIsSavingTodayCutoff(true)
    try {
      const result = await adminEventService.updateTodayCutoff(
        activityId,
        todayCutoffTime.trim() || null,
      )
      const saved = result.today_cutoff_time ?? ''
      setTodayCutoffTime(saved)
      setEvent((current) =>
        current ? { ...current, today_cutoff_time: saved || null } : current,
      )
      toast.success(
        saved
          ? `Today's booking cut-off set to ${formatCutoffTimeLabel(saved)}.`
          : "Today's booking cut-off removed.",
      )
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save cut-off time.'))
    } finally {
      setIsSavingTodayCutoff(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading activity details…</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-red-600">
          {error ?? 'Activity not found.'}
        </p>
        <Link
          to="/admin/activities"
          className="text-sm font-medium text-paec-violet hover:text-paec-violet-dark"
        >
          Back to activities
        </Link>
      </div>
    )
  }

  const isAmusement = event.event_section_name === 'amusements'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 border-b border-violet-100 pb-4">
        <Link
          to="/admin/activities"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back to Activities
        </Link>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground break-words sm:text-2xl lg:text-3xl">
              {event.event_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={event.status} />
              {event.is_featured ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  Featured
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/activities/$activityId/scanner"
            params={{ activityId }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-paec-orange px-3 py-2 text-xs font-semibold text-white transition-opacity hover:bg-paec-orange-light hover:opacity-90 sm:text-sm"
          >
            <Camera className="size-4" />
            Scanner
          </Link>
          <Link
            to="/admin/activities/$activityId/tickets"
            params={{ activityId }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:bg-emerald-700 hover:opacity-90 sm:text-sm"
          >
            <Ticket className="size-4" />
            Manage Tickets
          </Link>
          <Link
            to="/admin/activities/$activityId/edit"
            params={{ activityId }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white transition-opacity hover:bg-paec-violet-dark hover:opacity-90 sm:text-sm"
          >
            <Edit className="size-4" />
            Edit Activity
          </Link>
          <ActionButton
            label={isExporting ? 'Exporting…' : 'Export'}
            icon={Download}
            className="bg-[#9333ea] text-white hover:bg-[#7e22ce]"
            onClick={() => {
              const { start, end } = getDefaultExportDates()
              setExportType('purchasers')
              setExportStartDate(start)
              setExportEndDate(end)
              setShowExportModal(true)
            }}
            disabled={isExporting}
          />
          {isAmusement ? (
            <Link
              to="/admin/activities/$activityId/calendar"
              params={{ activityId }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-violet-50 sm:text-sm"
            >
              <CalendarDays className="size-4" />
              Calendar
            </Link>
          ) : null}
          {event.status !== 'draft' ? (
            <ActionButton
              label="Share"
              icon={Share2}
              className="bg-sky-600 text-white hover:bg-sky-700"
              onClick={() => void handleShare()}
            />
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="space-y-4 lg:col-span-2 lg:space-y-6">
            <section className={cardClassName}>
              <h2 className="mb-4 text-base font-semibold text-foreground sm:text-lg">
                Activity Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Activity Name" value={event.event_name} />
                <DetailField label="Category" value={event.category?.name ?? '—'} />
                <div className="sm:col-span-2">
                  <DetailField
                    label="Description"
                    value={event.event_description || 'No description provided'}
                  />
                </div>
                <DetailField label="Date Range" value={getDateRangeLabel(event)} />
                <DetailField
                  label="Venue"
                  value={event.venue?.name || 'No venue specified'}
                />
                <DetailField
                  label="Contact Email"
                  value={event.contact_email || '—'}
                />
                <DetailField
                  label="City"
                  value={event.city || '—'}
                />
                <DetailField
                  label="Activity Address"
                  value={event.address || '—'}
                />
              </div>
            </section>

            <section className={cardClassName}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">
                  Locations
                </h2>
                <button
                  type="button"
                  onClick={() => openLocationModal()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-paec-orange px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Plus className="size-4" />
                  Add Location
                </button>
              </div>

              {locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No locations configured yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-violet-100 text-left text-xs tracking-wide text-muted-foreground uppercase">
                        <th className="px-2 py-2">Location</th>
                        <th className="px-2 py-2">City</th>
                        <th className="px-2 py-2">Account</th>
                        <th className="px-2 py-2">Revenue</th>
                        <th className="px-2 py-2">Tickets</th>
                        <th className="px-2 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((location) => {
                        const sales = ticketsSold?.location_sales?.find(
                          (item) => item.uuid === location.uuid,
                        )

                        return (
                          <tr
                            key={location.uuid}
                            className="border-b border-violet-50 last:border-0"
                          >
                            <td className="px-2 py-3 font-medium text-foreground">
                              {location.label}
                              {!location.is_active ? (
                                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 uppercase">
                                  Inactive
                                </span>
                              ) : null}
                            </td>
                            <td className="px-2 py-3 text-muted-foreground">
                              {location.city}
                            </td>
                            <td className="px-2 py-3 text-muted-foreground">
                              {location.organization?.name ?? 'Default account'}
                            </td>
                            <td className="px-2 py-3 font-medium text-paec-orange">
                              {formatPrice(sales?.total_amount ?? 0)}
                            </td>
                            <td className="px-2 py-3 text-muted-foreground">
                              {sales?.ticket_sold ?? 0}
                            </td>
                            <td className="px-2 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => openLocationModal(location)}
                                className="mr-2 text-xs font-semibold text-paec-violet hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteLocationTarget(location)}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {isAmusement ? (
              <section className={cardClassName}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-foreground sm:text-lg">
                    Blocked Dates
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowBlockedDateModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-paec-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-paec-orange-light"
                  >
                    <Plus className="size-3.5" />
                    Add Date
                  </button>
                </div>

                <div className="mb-5 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Today&apos;s booking cut-off
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        After this time, customers can no longer book visits for
                        today on the marketplace.
                      </p>
                      {event.today_cutoff_time ? (
                        <p className="mt-2 text-xs font-medium text-paec-violet">
                          Current: {formatCutoffTimeLabel(event.today_cutoff_time)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <div>
                        <label
                          htmlFor="today-cutoff-time"
                          className="mb-1 block text-xs font-medium text-muted-foreground"
                        >
                          Cut-off time
                        </label>
                        <input
                          id="today-cutoff-time"
                          type="time"
                          value={todayCutoffTime}
                          onChange={(event) =>
                            setTodayCutoffTime(event.target.value)
                          }
                          className="h-10 rounded-lg border border-violet-100 bg-white px-3 text-sm focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSaveTodayCutoff()}
                        disabled={
                          isSavingTodayCutoff ||
                          todayCutoffTime === (event.today_cutoff_time ?? '')
                        }
                        className="inline-flex h-10 items-center rounded-lg bg-paec-violet px-4 text-xs font-semibold text-white hover:bg-paec-violet-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSavingTodayCutoff ? 'Saving…' : 'Save'}
                      </button>
                      {todayCutoffTime ? (
                        <button
                          type="button"
                          onClick={() => setTodayCutoffTime('')}
                          disabled={isSavingTodayCutoff}
                          className="inline-flex h-10 items-center rounded-lg border border-violet-100 px-3 text-xs font-semibold text-muted-foreground hover:bg-white disabled:opacity-50"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {blockedDatesLoading ? (
                  <p className="py-6 text-sm text-muted-foreground">
                    Loading blocked dates…
                  </p>
                ) : blockedDates.length === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">
                    No blocked dates for this activity.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-violet-100">
                    <table className="w-full min-w-[420px] text-left text-sm">
                      <thead className="bg-violet-50/80">
                        <tr>
                          <th className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Date
                          </th>
                          <th className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Reason
                          </th>
                          <th className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockedDates.map((blockedDate) => (
                          <tr
                            key={blockedDate.uuid}
                            className="border-t border-violet-50"
                          >
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {blockedDate.blocked_date
                                ? formatDateLong(blockedDate.blocked_date)
                                : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {blockedDate.reason?.trim() || '—'}
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteBlockedTarget(blockedDate)
                                }
                                disabled={
                                  deletingBlockedDateId === blockedDate.uuid
                                }
                                className="inline-flex size-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                aria-label="Delete blocked date"
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
            ) : null}

            <section className={cardClassName}>
              <h2 className="mb-4 text-base font-semibold text-foreground sm:text-lg">
                Sales Information
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-violet-50/60 p-4 text-center">
                  <p className="text-2xl font-bold text-paec-orange">
                    {formatPrice(ticketsSold?.total_amount ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total Revenue
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50/60 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {ticketsSold?.ticket_sold ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tickets Sold
                  </p>
                </div>
                <div className="rounded-xl bg-sky-50/60 p-4 text-center">
                  <p className="text-2xl font-bold text-sky-600">
                    {ticketsSold?.total_orders ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total Orders
                  </p>
                </div>
              </div>

              {(ticketsSold?.location_sales?.length ?? 0) > 1 ? (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ticketsSold?.location_sales?.map((location) => (
                    <div
                      key={location.uuid}
                      className="rounded-xl border border-violet-100 p-4"
                    >
                      <p className="font-semibold text-foreground">
                        {location.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {location.city}
                        {location.organization?.name
                          ? ` · ${location.organization.name}`
                          : ''}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-semibold text-paec-orange">
                          {formatPrice(location.total_amount ?? 0)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tickets sold</span>
                        <span className="font-medium text-foreground">
                          {location.ticket_sold ?? 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className={cardClassName}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">
                  Activity Tickets Sold
                </h2>
                <Link
                  to="/admin/activities/$activityId/tickets"
                  params={{ activityId }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Ticket className="size-3.5" />
                  Add Activity Ticket
                </Link>
              </div>
              {ticketsSold?.data && ticketsSold.data.length > 0 ? (
                <div className="space-y-3">
                  {ticketsSold.data.map((ticket) => (
                    <div
                      key={ticket.name}
                      className="rounded-xl border border-violet-100 bg-violet-50/30 p-4"
                    >
                      <p className="font-semibold text-foreground">
                        {ticket.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-bold text-paec-orange">
                          {formatPrice(ticket.total_sold_amount)}
                        </span>
                        <span className="text-muted-foreground">
                          Sold: {ticket.total_sold_tickets}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No ticket sales data available
                </p>
              )}
            </section>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <section className={cardClassName}>
              <h2 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
                Activity Status
              </h2>
              <StatusRow
                label="Status"
                value={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              />
              <StatusRow
                label="Created By"
                value={event.creator?.name || '—'}
              />
              <StatusRow
                label="Created At"
                value={
                  event.created_at ? formatDateLong(event.created_at) : '—'
                }
              />
              <StatusRow
                label="Published At"
                value={
                  event.published_at
                    ? formatDateLong(event.published_at)
                    : '—'
                }
              />
              <StatusRow
                label="Approved By"
                value={event.approvedBy?.name || '—'}
              />
              <StatusRow
                label="Date Type"
                value={getScheduleTypeLabel(event.schedule_type)}
              />
              <StatusRow
                label="Has Seats"
                value={event.has_seats ? 'Yes' : 'No'}
              />
              <StatusRow
                label="Open Tickets"
                value={event.event_config === 'open_ticket' ? 'Yes' : 'No'}
              />
              <StatusRow
                label="Private Activity"
                value={event.event_config === 'private_event' ? 'Yes' : 'No'}
              />
            </section>

            <section className={cardClassName}>
              <h2 className="mb-4 text-base font-semibold text-foreground sm:text-lg">
                Recent Activity
              </h2>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={`${activity.timestamp}-${index}`} className="flex gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                        P
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No recent activity
                </p>
              )}
            </section>
          </div>
        </div>
      </div>

      {showExportModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isExporting && setShowExportModal(false)}
            aria-label="Close export modal"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">Export Report</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose an export type and date range.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="export-type"
                  className="text-xs font-medium text-foreground"
                >
                  Export Type
                </label>
                <select
                  id="export-type"
                  value={exportType}
                  onChange={(e) =>
                    setExportType(e.target.value as EventReportExportType)
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm"
                >
                  {EXPORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="export-start"
                  className="text-xs font-medium text-foreground"
                >
                  Start Date
                </label>
                <input
                  id="export-start"
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="export-end"
                  className="text-xs font-medium text-foreground"
                >
                  End Date
                </label>
                <input
                  id="export-end"
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm"
                />
              </div>
              {exportStartDate &&
              exportEndDate &&
              exportStartDate > exportEndDate ? (
                <p className="text-sm text-red-600">
                  Start date must be on or before end date.
                </p>
              ) : null}
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmExport()}
                disabled={
                  isExporting ||
                  !exportStartDate ||
                  !exportEndDate ||
                  exportStartDate > exportEndDate
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white hover:bg-paec-violet-dark disabled:opacity-50"
              >
                <Download className="size-4" />
                {isExporting ? 'Exporting…' : 'Download CSV'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showBlockedDateModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isCreatingBlockedDate && setShowBlockedDateModal(false)}
            aria-label="Close blocked date modal"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">Add Blocked Date</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tickets cannot be purchased on blocked dates.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="blocked-date"
                  className="text-xs font-medium text-foreground"
                >
                  Date
                </label>
                <input
                  id="blocked-date"
                  type="date"
                  value={blockedDateForm.blocked_date}
                  onChange={(e) =>
                    setBlockedDateForm((current) => ({
                      ...current,
                      blocked_date: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="blocked-reason"
                  className="text-xs font-medium text-foreground"
                >
                  Reason (optional)
                </label>
                <input
                  id="blocked-reason"
                  type="text"
                  value={blockedDateForm.reason}
                  onChange={(e) =>
                    setBlockedDateForm((current) => ({
                      ...current,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="e.g. Maintenance, Holiday closure"
                  className="mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowBlockedDateModal(false)}
                disabled={isCreatingBlockedDate}
                className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreateBlockedDate()}
                disabled={
                  isCreatingBlockedDate || !blockedDateForm.blocked_date.trim()
                }
                className="rounded-lg bg-paec-orange px-4 py-2 text-sm font-semibold text-white hover:bg-paec-orange-light disabled:opacity-50"
              >
                {isCreatingBlockedDate ? 'Adding…' : 'Add Blocked Date'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showLocationModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Branch Name (optional)
                </label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) =>
                    setLocationForm((current) => ({
                      ...current,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. BGC Branch"
                  className="mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">
                  City
                </label>
                <input
                  type="text"
                  value={locationForm.city}
                  onChange={(e) =>
                    setLocationForm((current) => ({
                      ...current,
                      city: e.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">
                  Address
                </label>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) =>
                    setLocationForm((current) => ({
                      ...current,
                      address: e.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                disabled={isSavingLocation}
                className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveLocation()}
                disabled={isSavingLocation || !locationForm.city.trim()}
                className="rounded-lg bg-paec-orange px-4 py-2 text-sm font-semibold text-white hover:bg-paec-orange-light disabled:opacity-50"
              >
                {isSavingLocation ? 'Saving…' : 'Save Location'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={deleteBlockedTarget !== null}
        title="Delete blocked date"
        message="Remove this blocked date? Tickets will be available again on that day."
        confirmLabel="Delete"
        variant="danger"
        loading={deletingBlockedDateId !== null}
        onClose={() => {
          if (deletingBlockedDateId) return
          setDeleteBlockedTarget(null)
        }}
        onConfirm={() => void handleDeleteBlockedDate()}
      />

      <ConfirmModal
        open={deleteLocationTarget !== null}
        title="Remove location"
        message="Remove this location? Locations with existing sales will be deactivated instead of deleted."
        confirmLabel="Remove"
        variant="danger"
        onClose={() => setDeleteLocationTarget(null)}
        onConfirm={() => void handleDeleteLocation()}
      />
    </div>
  )
}
