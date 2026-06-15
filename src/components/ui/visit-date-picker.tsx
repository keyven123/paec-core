import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import {
  getEarliestBookableDate,
  getManilaTodayDate,
  getManilaTodayIso,
  isTodayPastCutoff,
  isVisitDateBookable,
} from '@/lib/visitDate'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

type VisitDatePickerProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  blockedDates?: string[]
  todayCutoffTime?: string | null
  minDate?: Date
  onRejectedDate?: (reason: 'blocked' | 'past' | 'cutoff') => void
}

function toIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function VisitDatePicker({
  value,
  onChange,
  label = 'Date of Visit',
  blockedDates = [],
  todayCutoffTime,
  minDate,
  onRejectedDate,
}: VisitDatePickerProps) {
  const today = useMemo(() => getManilaTodayDate(), [])
  const todayIso = useMemo(() => getManilaTodayIso(), [])
  const earliestDate = useMemo(
    () => minDate ?? getEarliestBookableDate(todayCutoffTime),
    [minDate, todayCutoffTime],
  )
  const todayBookable = !isTodayPastCutoff(todayCutoffTime)
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates])
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() =>
    value ? parseIso(value) : new Date(),
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells: { date: Date; inMonth: boolean }[] = []

    for (let i = startOffset - 1; i >= 0; i -= 1) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        inMonth: false,
      })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), inMonth: true })
    }

    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - startOffset - daysInMonth + 1
      cells.push({
        date: new Date(year, month + 1, nextDay),
        inMonth: false,
      })
    }

    return cells
  }, [year, month])

  const goToPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const selectDate = (date: Date) => {
    const normalized = startOfDay(date)
    const iso = toIsoDate(normalized)

    if (normalized < earliestDate) {
      onRejectedDate?.('past')
      return
    }

    if (blockedSet.has(iso)) {
      onRejectedDate?.('blocked')
      return
    }

    if (iso === todayIso && !isVisitDateBookable(iso, todayCutoffTime)) {
      onRejectedDate?.('cutoff')
      return
    }

    onChange(iso)
    setOpen(false)
  }

  const selectedDate = value ? parseIso(value) : null

  useEffect(() => {
    if (!value) return
    if (
      blockedSet.has(value) ||
      !isVisitDateBookable(value, todayCutoffTime)
    ) {
      onChange('')
    }
  }, [value, blockedSet, todayCutoffTime, onChange])

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-11 w-full items-center rounded-xl border border-violet-100 bg-white px-3 text-left text-sm transition-colors',
          'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
          open && 'border-paec-violet ring-2 ring-paec-violet/20',
        )}
      >
        <Calendar className="mr-2 size-4 shrink-0 text-paec-violet" />
        <span
          className={cn(
            'flex-1',
            value ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {value ? formatDisplay(value) : 'dd/mm/yyyy'}
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-2 w-full min-w-[280px] overflow-hidden rounded-xl border border-violet-100 bg-white p-3 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold text-foreground"
            >
              {MONTHS[month]} {year}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-paec-violet"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-paec-violet"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[11px] font-semibold text-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map(({ date, inMonth }) => {
              const iso = toIsoDate(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isToday = iso === todayIso
              const isBlocked = blockedSet.has(iso)
              const isPast = startOfDay(date) < earliestDate
              const isCutoff =
                isToday &&
                !todayBookable &&
                inMonth &&
                !isBlocked &&
                !isPast
              const isDisabled = isBlocked || isPast || isCutoff

              return (
                <button
                  key={iso + inMonth}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(date)}
                  title={
                    isBlocked
                      ? 'This date is not available'
                      : isCutoff
                        ? 'Today is no longer available for booking'
                        : undefined
                  }
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg text-sm transition-colors',
                    !inMonth && 'text-muted-foreground/50',
                    inMonth &&
                      !isSelected &&
                      !isDisabled &&
                      'text-foreground hover:bg-violet-50',
                    isDisabled &&
                      'cursor-not-allowed text-muted-foreground/40 line-through decoration-red-400/70',
                    isBlocked &&
                      inMonth &&
                      'bg-red-50/80 text-red-400/80 line-through decoration-red-400',
                    isToday &&
                      !isSelected &&
                      !isDisabled &&
                      'font-semibold text-paec-orange ring-1 ring-paec-orange/40',
                    isSelected &&
                      'bg-paec-violet font-semibold text-white shadow-sm ring-2 ring-paec-violet ring-offset-1',
                  )}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-violet-100 pt-2">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                if (blockedSet.has(todayIso) || today < earliestDate) {
                  onRejectedDate?.(blockedSet.has(todayIso) ? 'blocked' : 'past')
                  return
                }
                if (!todayBookable) {
                  onRejectedDate?.('cutoff')
                  return
                }
                onChange(todayIso)
                setViewDate(today)
                setOpen(false)
              }}
              className="text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
