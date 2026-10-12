import {
  Check,
  ChevronDown,
  MapPin,
  Minus,
  Plus,
  Search,
  Ticket,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import type { Attraction } from '@/data/mockAttractions'
import {
  notifyRejectedVisitDate,
  useHeaderBooking,
} from '@/components/layout/useHeaderBooking'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { VisitDatePicker } from '@/components/ui/visit-date-picker'
import { cn } from '@/lib/utils'

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onOutside])

  return ref
}

type CompactSelectProps = {
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; hint?: string }>
  placeholder: string
  disabled?: boolean
  className?: string
}

function CompactSelect({
  icon,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
}: CompactSelectProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useClickOutside(close)
  const selected = options.find((option) => option.value === value)

  return (
    <div ref={ref} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={placeholder}
        className="flex h-9 w-full items-center gap-2 rounded-full px-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {icon}
        <span
          className={cn(
            'flex-1 truncate',
            selected ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border border-violet-100 bg-white py-1 shadow-lg">
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                  isSelected
                    ? 'bg-paec-violet font-medium text-white'
                    : 'text-foreground hover:bg-violet-50',
                )}
              >
                <span className="truncate">{option.label}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {option.hint && (
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        isSelected ? 'text-white' : 'text-paec-orange',
                      )}
                    >
                      {option.hint}
                    </span>
                  )}
                  {isSelected && <Check className="size-4" />}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

type ActivityOptionProps = {
  activity: Attraction
  highlighted?: boolean
  selected?: boolean
  onHover?: () => void
  onSelect: () => void
}

export function ActivityOption({
  activity,
  highlighted = false,
  selected = false,
  onHover,
  onSelect,
}: ActivityOptionProps) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-violet-50',
        highlighted && 'bg-violet-50',
        selected && 'bg-paec-violet/10',
      )}
    >
      <ImageWithFallback
        src={activity.image}
        alt=""
        className="size-10 shrink-0 rounded-lg object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {activity.name}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{activity.location}</span>
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-paec-orange">
        ₱{activity.price.toLocaleString()}
      </span>
    </button>
  )
}

export function HeaderSearch() {
  const {
    query,
    updateQuery,
    matches,
    loadingActivities,
    selected,
    selectActivity: chooseActivity,
    activity,
    loadingDetail,
    ticketTypes,
    ticketTypeId,
    setTicketTypeId,
    locations,
    locationUuid,
    setLocationUuid,
    blockedDates,
    visitDate,
    setVisitDate,
    pax,
    setPax,
    getTickets,
  } = useHeaderBooking()
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const closeSearch = useCallback(() => setOpen(false), [])
  const containerRef = useClickOutside(closeSearch)

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  const selectActivity = (item: Attraction) => {
    chooseActivity(item)
    setOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setHighlighted((i) => Math.min(i + 1, matches.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && open && matches[highlighted]) {
      event.preventDefault()
      selectActivity(matches[highlighted])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleGetTickets = () => {
    if (!getTickets() && !selected) setOpen(true)
  }

  const divider = <div className="h-6 w-px shrink-0 bg-violet-100" />

  return (
    <div className="flex h-11 w-full items-center rounded-full border border-violet-100 bg-violet-50/50 pl-1 transition-colors focus-within:border-paec-violet/40">
      <div ref={containerRef} className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            updateQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search activities..."
          aria-label="Search activities"
          className="h-9 w-full rounded-full bg-transparent pr-3 pl-9 text-sm placeholder:text-muted-foreground focus:outline-none"
        />

        {open && (
          <div className="absolute top-full left-0 z-50 mt-3 max-h-80 w-[420px] overflow-y-auto rounded-xl border border-violet-100 bg-white py-1 shadow-lg">
            {loadingActivities ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Loading activities…
              </p>
            ) : matches.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                No activities found.
              </p>
            ) : (
              matches.map((item, index) => (
                <ActivityOption
                  key={item.eventUuid}
                  activity={item}
                  highlighted={index === highlighted}
                  selected={selected?.eventUuid === item.eventUuid}
                  onHover={() => setHighlighted(index)}
                  onSelect={() => selectActivity(item)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {locations.length > 1 && (
        <>
          {divider}
          <CompactSelect
            className="w-40"
            icon={<MapPin className="size-4 shrink-0 text-paec-violet" />}
            value={locationUuid}
            onChange={setLocationUuid}
            placeholder="Location"
            options={locations.map((location) => ({
              value: location.uuid,
              label: location.name
                ? `${location.name} — ${location.city}`
                : location.label,
            }))}
          />
        </>
      )}

      {divider}
      <CompactSelect
        className="w-44"
        icon={<Ticket className="size-4 shrink-0 text-paec-violet" />}
        value={ticketTypeId}
        onChange={setTicketTypeId}
        disabled={!activity || ticketTypes.length === 0}
        placeholder={
          selected && loadingDetail
            ? 'Loading tickets…'
            : activity && ticketTypes.length === 0
              ? 'No tickets'
              : 'Ticket type'
        }
        options={ticketTypes.map((ticket) => ({
          value: ticket.id,
          label: ticket.name,
          hint: `₱${ticket.price.toLocaleString()}`,
        }))}
      />

      {divider}
      <div className="w-36 shrink-0">
        <VisitDatePicker
          label=""
          placeholder="Select date"
          value={visitDate}
          onChange={setVisitDate}
          blockedDates={blockedDates}
          todayCutoffTime={activity?.todayCutoffTime}
          triggerClassName="h-9 rounded-full border-0 bg-transparent focus:ring-0"
          onRejectedDate={notifyRejectedVisitDate}
        />
      </div>

      {divider}
      <div className="flex shrink-0 items-center gap-1 px-2">
        <Users className="size-4 text-paec-violet" />
        <button
          type="button"
          onClick={() => setPax((p) => Math.max(1, p - 1))}
          disabled={pax <= 1}
          className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-100 hover:text-foreground disabled:opacity-40"
          aria-label="Decrease pax"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-12 text-center text-sm font-medium text-foreground">
          {pax} pax
        </span>
        <button
          type="button"
          onClick={() => setPax((p) => p + 1)}
          className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-100 hover:text-foreground"
          aria-label="Increase pax"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleGetTickets}
        className="m-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-paec-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-paec-orange-light"
      >
        <Ticket className="size-4" />
        Get Tickets
      </button>
    </div>
  )
}
