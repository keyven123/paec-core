import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

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

export type DateRange = {
  start: string
  end: string
}

type DateRangePickerProps = {
  value: DateRange | null
  onChange: (value: DateRange | null) => void
  placeholder?: string
  className?: string
}

function toIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function normalizeRange(start: string, end: string): DateRange {
  if (start <= end) return { start, end }
  return { start: end, end: start }
}

function formatRangeLabel(range: DateRange | null) {
  if (!range) return ''

  const start = parseIso(range.start)
  const end = parseIso(range.end)
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth =
    sameYear &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  if (sameMonth && isSameDay(start, end)) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const startLabel = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  })
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return `${startLabel} – ${endLabel}`
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Date of visit',
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() =>
    value?.start ? parseIso(value.start) : new Date(),
  )
  const [draftStart, setDraftStart] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
        setDraftStart(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) setDraftStart(null)
  }, [open])

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

  const activeRange = value

  const isInRange = (iso: string) => {
    if (!activeRange) return false
    return iso >= activeRange.start && iso <= activeRange.end
  }

  const isRangeEdge = (iso: string) => {
    if (!activeRange) return false
    return iso === activeRange.start || iso === activeRange.end
  }

  const handleSelectDate = (date: Date) => {
    const iso = toIsoDate(startOfDay(date))

    if (!draftStart) {
      setDraftStart(iso)
      return
    }

    const nextRange = normalizeRange(draftStart, iso)
    onChange(nextRange)
    setDraftStart(null)
    setOpen(false)
  }

  const selectionHint = draftStart
    ? 'Select end date'
    : 'Select start date'

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex h-11 w-full items-center rounded-xl border border-violet-100 bg-white px-3 text-sm transition-colors',
          open && 'border-paec-violet ring-2 ring-paec-violet/20',
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center text-left focus:outline-none"
        >
          <Calendar className="mr-2 size-4 shrink-0 text-paec-violet" />
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              value ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {value ? formatRangeLabel(value) : placeholder}
          </span>
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setDraftStart(null)
            }}
            className="mr-1 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-violet-50 hover:text-foreground"
            aria-label="Clear date range"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-violet-50 hover:text-foreground"
          aria-label="Toggle calendar"
        >
          <ChevronDown
            className={cn(
              'size-4 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
      </div>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-xl border border-violet-100 bg-white p-3 shadow-lg sm:left-auto sm:w-[320px]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{selectionHint}</p>
            {draftStart ? (
              <button
                type="button"
                onClick={() => setDraftStart(null)}
                className="text-xs font-semibold text-paec-violet hover:text-paec-violet-dark"
              >
                Reset
              </button>
            ) : null}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="text-sm font-semibold text-foreground"
            >
              {MONTHS[month]} {year}
            </button>
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-paec-violet"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
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
              const isDraftStart = draftStart === iso
              const inSelectedRange = isInRange(iso)
              const isEdge = isRangeEdge(iso) || isDraftStart

              return (
                <button
                  key={iso + inMonth}
                  type="button"
                  onClick={() => handleSelectDate(date)}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg text-sm transition-colors',
                    !inMonth && 'text-muted-foreground/50',
                    inMonth &&
                      !inSelectedRange &&
                      !isEdge &&
                      'text-foreground hover:bg-violet-50',
                    inSelectedRange &&
                      !isEdge &&
                      'bg-violet-100/80 text-foreground',
                    isEdge &&
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
                onChange(null)
                setDraftStart(null)
                setOpen(false)
              }}
              className="text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftStart(null)
                setOpen(false)
              }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
