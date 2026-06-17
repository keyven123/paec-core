import { Link, useNavigate } from '@tanstack/react-router'
import { isPaecFunActivity } from '@/lib/eventTicketForm'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api'
import { adminEventService, type AdminEvent } from '@/services/adminEventService'
import { blockedDateService } from '@/services/blockedDateService'

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

interface DayTicketCounts {
  priority_ticket_count: number
  flexible_ticket_count: number
  redeemed_count: number
}

interface BlockedDateInfo {
  uuid: string
  reason: string | null
}

interface CalendarDay {
  date: Date
  dateKey: string
  inCurrentMonth: boolean
  isToday: boolean
  isBlocked: boolean
  blockedReason: string | null
  counts: DayTicketCounts
}

interface MonthSummaryCounts {
  flexible_ticket_count: number
  new_sales_count: number
  redeemed_count: number
  total_ticket_count: number
}

type AdminActivityCalendarSectionProps = {
  activityId: string
}

function normalizeDateKey(date: string): string {
  return date.slice(0, 10)
}

function dayHasScheduledTickets(counts: DayTicketCounts): boolean {
  return counts.priority_ticket_count > 0 || counts.flexible_ticket_count > 0
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildCalendarDays(
  year: number,
  month: number,
  countsByDate: Record<string, DayTicketCounts>,
  blockedDatesByKey: Record<string, BlockedDateInfo>,
): CalendarDay[] {
  const todayKey = toDateKey(new Date())
  const firstOfMonth = new Date(year, month - 1, 1)
  const startOffset = firstOfMonth.getDay()
  const gridStart = new Date(year, month - 1, 1 - startOffset)

  const days: CalendarDay[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    const dateKey = toDateKey(date)
    const blocked = blockedDatesByKey[dateKey]
    days.push({
      date,
      dateKey,
      inCurrentMonth: date.getMonth() === month - 1,
      isToday: dateKey === todayKey,
      isBlocked: Boolean(blocked),
      blockedReason: blocked?.reason ?? null,
      counts: countsByDate[dateKey] ?? {
        priority_ticket_count: 0,
        flexible_ticket_count: 0,
        redeemed_count: 0,
      },
    })
  }
  return days
}

function formatMonthSummary(summary: MonthSummaryCounts): string {
  return [
    `Flexible: ${summary.flexible_ticket_count}`,
    `New Sales: ${summary.new_sales_count}`,
    `Redeemed: ${summary.redeemed_count}`,
    `Total Tickets: ${summary.total_ticket_count}`,
  ].join(' | ')
}

const BLOCKED_DAY_STRIPE_STYLE: CSSProperties = {
  backgroundColor: 'rgba(254, 226, 226, 0.5)',
  backgroundImage: `repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 5px,
    rgba(248, 113, 113, 0.18) 5px,
    rgba(248, 113, 113, 0.18) 6px
  )`,
}

function CalendarCountPill({
  label,
  className,
}: {
  label: string
  className: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    const timeoutId = window.setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown)
      document.addEventListener('touchstart', handlePointerDown)
    }, 0)
    document.addEventListener('keydown', handleEscape)
    return () => {
      window.clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-30' : 'z-0'}`}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className={`w-full min-h-[28px] cursor-pointer touch-manipulation truncate rounded px-1.5 py-1 text-left text-[10px] font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-paec-violet/40 sm:text-xs ${className}`}
        aria-expanded={open}
        aria-label={label}
      >
        <span className="block truncate">{label}</span>
      </button>
      {open ? (
        <div
          role="tooltip"
          className={`absolute bottom-[calc(100%+6px)] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-black/10 ${className}`}
        >
          {label}
        </div>
      ) : null}
    </div>
  )
}

function DayCellWrapper({
  day,
  children,
  isBlocked = false,
}: {
  day: CalendarDay
  children: React.ReactNode
  isBlocked?: boolean
}) {
  return (
    <div
      className={`relative h-full min-h-0 min-w-0 overflow-hidden border-r border-b border-violet-100 p-1 sm:p-1.5 ${
        isBlocked
          ? 'bg-red-50'
          : day.inCurrentMonth
            ? 'bg-white'
            : 'bg-violet-50/40'
      }`}
    >
      {children}
    </div>
  )
}

function CalendarDayCell({ day }: { day: CalendarDay }) {
  const { priority_ticket_count, flexible_ticket_count, redeemed_count } =
    day.counts
  const showBlocked = day.inCurrentMonth && day.isBlocked
  const showPriority =
    day.inCurrentMonth && !day.isBlocked && priority_ticket_count > 0
  const showFlexible =
    day.inCurrentMonth && !day.isBlocked && flexible_ticket_count > 0
  const showRedeemed =
    day.inCurrentMonth && !day.isBlocked && redeemed_count > 0

  if (showBlocked) {
    return (
      <DayCellWrapper day={day} isBlocked>
        <div
          className="pointer-events-none absolute inset-0"
          style={BLOCKED_DAY_STRIPE_STYLE}
          aria-hidden
        />
        <div
          className="relative z-10 flex h-full min-h-0 flex-col justify-between"
          title={day.blockedReason?.trim() || 'Closed'}
        >
          <span
            className={
              day.isToday
                ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-medium text-white ring-2 ring-red-300'
                : 'text-sm font-medium text-red-700'
            }
          >
            {day.date.getDate()}
          </span>
          <span className="self-end text-[10px] font-semibold text-red-600 sm:text-xs">
            Closed
          </span>
        </div>
      </DayCellWrapper>
    )
  }

  return (
    <DayCellWrapper day={day}>
      {day.isToday ? (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-paec-violet text-sm font-medium text-white">
          {day.date.getDate()}
        </span>
      ) : (
        <span
          className={`inline-flex h-7 w-7 items-center justify-center text-sm ${
            day.inCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {day.date.getDate()}
        </span>
      )}
      <div className="mt-1 space-y-0.5">
        {showPriority ? (
          <CalendarCountPill
            label={`Booked Tickets: ${priority_ticket_count}`}
            className="bg-paec-violet"
          />
        ) : null}
        {showFlexible ? (
          <CalendarCountPill
            label={`Flexible: ${flexible_ticket_count}`}
            className="bg-emerald-600"
          />
        ) : null}
        {showRedeemed ? (
          <CalendarCountPill
            label={`Redeemed: ${redeemed_count}`}
            className="bg-paec-orange"
          />
        ) : null}
      </div>
    </DayCellWrapper>
  )
}

export function AdminActivityCalendarSection({
  activityId,
}: AdminActivityCalendarSectionProps) {
  const navigate = useNavigate()
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [loadingCalendar, setLoadingCalendar] = useState(true)
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [countsByDate, setCountsByDate] = useState<
    Record<string, DayTicketCounts>
  >({})
  const [monthSummary, setMonthSummary] = useState<MonthSummaryCounts>({
    flexible_ticket_count: 0,
    new_sales_count: 0,
    redeemed_count: 0,
    total_ticket_count: 0,
  })
  const [blockedDatesByKey, setBlockedDatesByKey] = useState<
    Record<string, BlockedDateInfo>
  >({})
  const [showBlockedDateModal, setShowBlockedDateModal] = useState(false)
  const [blockedDateForm, setBlockedDateForm] = useState({
    blocked_date: '',
    reason: '',
  })
  const [isCreatingBlockedDate, setIsCreatingBlockedDate] = useState(false)

  const monthLabel = useMemo(
    () =>
      new Date(viewDate.year, viewDate.month - 1, 1).toLocaleDateString(
        'en-US',
        { month: 'long', year: 'numeric' },
      ),
    [viewDate.year, viewDate.month],
  )

  const calendarDays = useMemo(
    () =>
      buildCalendarDays(
        viewDate.year,
        viewDate.month,
        countsByDate,
        blockedDatesByKey,
      ),
    [viewDate.year, viewDate.month, countsByDate, blockedDatesByKey],
  )

  const monthSummaryLabel = useMemo(
    () => formatMonthSummary(monthSummary),
    [monthSummary],
  )

  const fetchCalendar = useCallback(async () => {
    setLoadingCalendar(true)
    try {
      const response = await adminEventService.getEventTicketCalendar(
        activityId,
        { year: viewDate.year, month: viewDate.month },
      )
      const counts: Record<string, DayTicketCounts> = {}
      for (const day of response.data.days) {
        counts[day.date] = {
          priority_ticket_count: day.priority_ticket_count,
          flexible_ticket_count: day.flexible_ticket_count,
          redeemed_count: day.redeemed_count,
        }
      }
      setCountsByDate(counts)
      setMonthSummary({
        flexible_ticket_count: response.data.month_summary.flexible_ticket_count,
        new_sales_count: response.data.month_summary.new_sales_count,
        redeemed_count: response.data.month_summary.redeemed_count,
        total_ticket_count: response.data.month_summary.total_ticket_count,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load calendar data.'))
      setCountsByDate({})
      setMonthSummary({
        flexible_ticket_count: 0,
        new_sales_count: 0,
        redeemed_count: 0,
        total_ticket_count: 0,
      })
    } finally {
      setLoadingCalendar(false)
    }
  }, [activityId, viewDate.year, viewDate.month])

  const fetchBlockedDates = useCallback(async () => {
    try {
      const response = await blockedDateService.list('events', activityId)
      const byKey: Record<string, BlockedDateInfo> = {}
      for (const item of response.data ?? []) {
        if (!item.blocked_date) continue
        const key = normalizeDateKey(item.blocked_date)
        byKey[key] = { uuid: item.uuid, reason: item.reason }
      }
      setBlockedDatesByKey(byKey)
    } catch {
      setBlockedDatesByKey({})
    }
  }, [activityId])

  const handleCreateBlockedDate = async () => {
    const dateKey = blockedDateForm.blocked_date.trim()
    if (!dateKey) {
      toast.error('Please select a date.')
      return
    }

    if (blockedDatesByKey[dateKey]) {
      toast.error('This date is already blocked for the event.')
      return
    }

    const dayCounts = countsByDate[dateKey]
    if (dayCounts && dayHasScheduledTickets(dayCounts)) {
      toast.error('There are existing tickets scheduled for this date.')
      return
    }

    setIsCreatingBlockedDate(true)
    try {
      await blockedDateService.create('events', activityId, {
        blocked_date: dateKey,
        reason: blockedDateForm.reason.trim() || null,
      })
      toast.success('Blocked date added successfully.')
      setShowBlockedDateModal(false)
      setBlockedDateForm({ blocked_date: '', reason: '' })
      await fetchBlockedDates()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add blocked date.'))
    } finally {
      setIsCreatingBlockedDate(false)
    }
  }

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoadingEvent(true)
        const response = await adminEventService.getEventDetails(activityId)
        if (!isPaecFunActivity(response.data)) {
          toast.error('Calendar is only available for amusement activities.')
          navigate({ to: '/admin/activities/$activityId', params: { activityId } })
          return
        }
        setEvent(response.data)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load activity.'))
        navigate({ to: '/admin/activities' })
      } finally {
        setLoadingEvent(false)
      }
    }
    void fetchEvent()
  }, [activityId, navigate])

  useEffect(() => {
    if (!loadingEvent && event) {
      void fetchCalendar()
      void fetchBlockedDates()
    }
  }, [loadingEvent, event, fetchCalendar, fetchBlockedDates])

  const goToPreviousMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }

  const goToNextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }

  const goToToday = () => {
    const now = new Date()
    setViewDate({ year: now.getFullYear(), month: now.getMonth() + 1 })
  }

  if (loadingEvent) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-paec-violet" />
        <span className="text-sm text-muted-foreground">Loading calendar…</span>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Activity not found.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b border-violet-100 pb-3">
        <Link
          to="/admin/activities/$activityId"
          params={{ activityId }}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back to Activity
        </Link>

        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl lg:text-2xl">
            {event.event_name}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ticket schedule calendar
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col pt-3">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
          <div className="flex shrink-0 flex-col gap-2 border-b border-violet-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-violet-50"
              >
                Today
              </button>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                {monthLabel}
              </h2>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <button
                type="button"
                onClick={() => setShowBlockedDateModal(true)}
                className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-paec-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-orange-light"
              >
                <Plus className="size-4" />
                Block Date
              </button>
              <p className="break-words text-left text-xs leading-relaxed text-muted-foreground sm:text-right sm:text-sm">
                {loadingCalendar ? 'Loading…' : monthSummaryLabel}
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="grid shrink-0 grid-cols-7 border-b border-violet-100 bg-violet-50/60">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="py-1.5 text-center text-[10px] font-medium tracking-wide text-muted-foreground sm:text-[11px]"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="relative min-h-0 flex-1">
              {loadingCalendar ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                  <Loader2 className="size-8 animate-spin text-paec-violet" />
                </div>
              ) : null}
              <div className="grid h-full grid-cols-7 grid-rows-6">
                {calendarDays.map((day) => (
                  <CalendarDayCell key={day.dateKey} day={day} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBlockedDateModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              !isCreatingBlockedDate && setShowBlockedDateModal(false)
            }
            aria-label="Close block date modal"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() =>
                !isCreatingBlockedDate && setShowBlockedDateModal(false)
              }
              className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <h3 className="text-center text-lg font-bold text-foreground">
              Block Date
            </h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Block a specific date for this event. Tickets cannot be purchased
              for blocked dates.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="calendar-blocked-date"
                  className="text-xs font-medium text-foreground"
                >
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="calendar-blocked-date"
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
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="calendar-blocked-reason"
                  className="text-xs font-medium text-foreground"
                >
                  Reason (optional)
                </label>
                <input
                  id="calendar-blocked-reason"
                  type="text"
                  value={blockedDateForm.reason}
                  onChange={(e) =>
                    setBlockedDateForm((current) => ({
                      ...current,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="e.g., Maintenance, Holiday closure"
                  maxLength={255}
                  className="mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowBlockedDateModal(false)
                  setBlockedDateForm({ blocked_date: '', reason: '' })
                }}
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
                {isCreatingBlockedDate ? 'Adding…' : 'Block Date'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
