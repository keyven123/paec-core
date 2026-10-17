import { MapPin, Minus, Plus, Search, Ticket, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { ActivityOption } from '@/components/layout/HeaderSearch'
import {
  notifyRejectedVisitDate,
  useHeaderBooking,
} from '@/components/layout/useHeaderBooking'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { ThemedSelect } from '@/components/ui/themed-select'
import { VisitDatePicker } from '@/components/ui/visit-date-picker'
import { isTicketAvailableForBooking } from '@/lib/visitDate'
import { cn } from '@/lib/utils'

type MobileHeaderSearchProps = {
  className?: string
}

export function MobileHeaderSearch({ className }: MobileHeaderSearchProps) {
  const {
    query,
    updateQuery,
    matches,
    loadingActivities,
    selected,
    selectActivity,
    clearActivity,
    activity,
    loadingDetail,
    ticketTypes,
    ticketTypeId,
    setTicketTypeId,
    selectedTicket,
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open && !selected) inputRef.current?.focus()
  }, [open, selected])

  const total = (selectedTicket?.price ?? 0) * pax

  const handleGetTickets = () => {
    if (getTickets()) setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-10 min-w-0 items-center gap-2 rounded-full border border-violet-100 bg-violet-50/50 pr-1 pl-3.5 text-left transition-colors hover:border-paec-violet/30 hover:bg-violet-50',
          className,
        )}
        aria-label="Search activities and get tickets"
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm',
            selected ? 'font-medium text-foreground' : 'text-muted-foreground',
          )}
        >
          {selected?.name ?? 'Search activities'}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paec-orange text-white">
          <Ticket className="size-4" />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] xl:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Get tickets"
          >
            <div
              className="absolute inset-0 bg-[#0f0a1a]/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <div className="absolute inset-0 flex flex-col bg-white shadow-2xl sm:inset-x-auto sm:top-6 sm:bottom-auto sm:left-1/2 sm:max-h-[calc(100dvh-3rem)] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:overflow-hidden sm:rounded-2xl">
              <div className="flex shrink-0 items-start justify-between gap-3 bg-paec-violet px-5 py-4 text-white">
                <div>
                  <p className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
                    <Ticket className="size-3.5" />
                    Get Tickets
                  </p>
                  <p className="mt-1 text-lg leading-snug font-semibold">
                    Book your next adventure
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Activity
                  </label>

                  {selected ? (
                    <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/40 p-2.5">
                      <ImageWithFallback
                        src={selected.image}
                        alt=""
                        className="size-14 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {selected.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{selected.location}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearActivity}
                        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-paec-violet transition-colors hover:bg-violet-100"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          ref={inputRef}
                          type="search"
                          value={query}
                          onChange={(event) => updateQuery(event.target.value)}
                          placeholder="Search activities..."
                          aria-label="Search activities"
                          className="h-11 w-full rounded-xl border border-violet-100 bg-white pr-3 pl-9 text-sm placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
                        />
                      </div>

                      <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-violet-100 py-1">
                        {loadingActivities ? (
                          <p className="px-4 py-3 text-sm text-muted-foreground">
                            Loading activities…
                          </p>
                        ) : matches.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-muted-foreground">
                            No activities found.
                          </p>
                        ) : (
                          matches.map((item) => (
                            <ActivityOption
                              key={item.eventUuid}
                              activity={item}
                              onSelect={() => selectActivity(item)}
                            />
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                {selected && (
                  <>
                    {locations.length > 1 && (
                      <ThemedSelect
                        label="Location"
                        value={locationUuid}
                        onChange={setLocationUuid}
                        options={locations.map((location) => ({
                          value: location.uuid,
                          label: location.name
                            ? `${location.name} — ${location.city}`
                            : location.label,
                        }))}
                      />
                    )}

                    {loadingDetail && !activity ? (
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                          Ticket Type
                        </p>
                        <div className="h-11 animate-pulse rounded-xl bg-violet-50" />
                      </div>
                    ) : ticketTypes.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 px-4 py-3 text-sm text-muted-foreground">
                        No tickets are available for this activity yet.
                      </p>
                    ) : (
                      <ThemedSelect
                        label="Ticket Type"
                        value={ticketTypeId}
                        onChange={setTicketTypeId}
                        options={ticketTypes.map((ticket) => {
                          const unavailable = !isTicketAvailableForBooking(
                            ticket,
                            visitDate,
                          )

                          return {
                            value: ticket.id,
                            label: unavailable
                              ? `${ticket.name} — Unavailable`
                              : `${ticket.name} — ₱${ticket.price.toLocaleString()}`,
                            disabled: unavailable,
                          }
                        })}
                      />
                    )}

                    <VisitDatePicker
                      value={visitDate}
                      onChange={setVisitDate}
                      blockedDates={blockedDates}
                      todayCutoffTime={activity?.todayCutoffTime}
                      onRejectedDate={notifyRejectedVisitDate}
                    />

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Pax
                      </label>
                      <div className="flex h-11 items-center justify-between rounded-xl border border-violet-100 px-3">
                        <button
                          type="button"
                          onClick={() => setPax((p) => Math.max(1, p - 1))}
                          disabled={pax <= 1}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground disabled:opacity-40"
                          aria-label="Decrease pax"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="text-sm font-semibold">
                          {pax} {pax === 1 ? 'person' : 'people'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPax((p) => p + 1)}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
                          aria-label="Increase pax"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-violet-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {selected && selectedTicket && (
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Total
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedTicket.name} × {pax}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      ₱{total.toLocaleString()}
                    </p>
                  </div>
                )}
                <Button
                  type="button"
                  onClick={handleGetTickets}
                  disabled={!selected}
                  className="h-12 w-full rounded-xl bg-paec-orange text-base font-semibold hover:bg-paec-orange-light"
                >
                  <Ticket className="size-4" />
                  {selected ? 'Get Tickets' : 'Select an activity to continue'}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
