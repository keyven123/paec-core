import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { cn } from '@/lib/utils'
import { VisitDatePicker } from '@/components/ui/visit-date-picker'
import {
  activityService,
  type ApiEvent,
} from '@/services/activityService'
import { adminEventService } from '@/services/adminEventService'
import {
  adminEventTicketService,
  type AdminEventTicket,
} from '@/services/adminEventTicketService'
import {
  eventLocationService,
  type EventLocation,
} from '@/services/eventLocationService'
import { userStatsService } from '@/services/userStatsService'
import { blockedDateService } from '@/services/blockedDateService'
import { venueSeatService, type VenueSeat } from '@/services/venueSeatService'

type AddTicketModalProps = {
  open: boolean
  onClose: () => void
  userUuid: string
  onSuccess?: () => void
}

const fieldClassName = cn(
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const labelClassName = 'text-xs font-medium text-foreground'

function formatPhpMoney(amount: number): string {
  return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatLocationLabel(location: EventLocation): string {
  if (location.name) {
    return `${location.name} — ${location.city}`
  }
  return location.label || location.city
}

function getEventOtherInfoFieldNames(
  otherInfo: Record<string, unknown> | null | undefined,
): string[] {
  if (!otherInfo || typeof otherInfo !== 'object') return []
  return Object.keys(otherInfo)
}

function buildEmptyOtherInfoPerTicket(
  fieldNames: string[],
  quantity: number,
): Array<Record<string, string>> {
  if (fieldNames.length === 0 || quantity < 1) return []
  const emptyEntry = Object.fromEntries(fieldNames.map((name) => [name, '']))
  return Array.from({ length: quantity }, () => ({ ...emptyEntry }))
}

function getEventTicketSalePrice(et: AdminEventTicket): number {
  const list = parseFloat(String(et.price)) || 0
  const discountType = et.discount_type
  const discountRaw = et.discount_value
  if (
    !discountType ||
    discountRaw === null ||
    discountRaw === undefined ||
    String(discountRaw).trim() === ''
  ) {
    return list
  }
  const discount = parseFloat(String(discountRaw))
  if (Number.isNaN(discount) || discount <= 0) return list
  if (discountType === 'percentage') return Math.max(0, list * (1 - discount / 100))
  if (discountType === 'amount') return Math.max(0, list - discount)
  return list
}

function flattenErrors(
  errors: Record<string, string | string[]>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  )
}

export function AddTicketModal({
  open,
  onClose,
  userUuid,
  onSuccess,
}: AddTicketModalProps) {
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [showEventDropdown, setShowEventDropdown] = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null)
  const eventDropdownRef = useRef<HTMLDivElement>(null)
  const eventSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedEventConfig, setSelectedEventConfig] = useState<string | null>(null)
  const [eventOtherInfoFieldNames, setEventOtherInfoFieldNames] = useState<string[]>([])
  const [eventLocations, setEventLocations] = useState<EventLocation[]>([])
  const [eventTickets, setEventTickets] = useState<AdminEventTicket[]>([])
  const [venueSeats, setVenueSeats] = useState<VenueSeat[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [venueSeatSearch, setVenueSeatSearch] = useState('')
  const [showVenueSeatDropdown, setShowVenueSeatDropdown] = useState(false)
  const [loadingVenueSeats, setLoadingVenueSeats] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const venueSeatDropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    event_uuid: '',
    event_location_uuid: '',
    event_ticket_uuid: '',
    venue_seat_uuid: '',
    col: '',
    row: '',
    type: '',
    amount: '',
    quantity: '1',
    visitDate: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = useCallback(() => {
    setFormData({
      event_uuid: '',
      event_location_uuid: '',
      event_ticket_uuid: '',
      venue_seat_uuid: '',
      col: '',
      row: '',
      type: '',
      amount: '',
      quantity: '1',
      visitDate: '',
    })
    setBlockedDates([])
    setEventLocations([])
    setEventTickets([])
    setVenueSeats([])
    setVenueSeatSearch('')
    setShowVenueSeatDropdown(false)
    setSelectedEventConfig(null)
    setEventOtherInfoFieldNames([])
    setEventSearchQuery('')
    setShowEventDropdown(false)
    setSelectedEvent(null)
    setErrors({})
  }, [])

  const fetchEvents = useCallback(async (query: string) => {
    try {
      setLoadingEvents(true)
      const data = await activityService.searchPublishedEvents({
        per_page: 10,
        q: query.trim() || undefined,
      })
      setEvents(data)
    } catch {
      toast.error('Failed to load events.')
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  const fetchEventDetails = useCallback(async (eventUuid: string) => {
    try {
      const [details, locations] = await Promise.all([
        adminEventService.getEventDetails(eventUuid),
        eventLocationService.list(eventUuid),
      ])
      setSelectedEventConfig(details.data.event_config ?? null)
      setEventOtherInfoFieldNames(
        getEventOtherInfoFieldNames(details.data.other_info ?? null),
      )
      setEventLocations(locations.filter((location) => location.is_active))
    } catch {
      toast.error('Failed to load event details.')
      setSelectedEventConfig(null)
      setEventOtherInfoFieldNames([])
      setEventLocations([])
    }
  }, [])

  const fetchEventTickets = useCallback(async () => {
    if (!formData.event_uuid) {
      setEventTickets([])
      return
    }
    try {
      const tickets = await adminEventTicketService.getEventTickets(formData.event_uuid)
      setEventTickets(tickets)
    } catch {
      toast.error('Failed to load event tickets.')
      setEventTickets([])
    }
  }, [formData.event_uuid])

  const fetchVenueSeats = useCallback(async () => {
    if (!formData.event_uuid || venueSeatSearch.trim().length < 1) {
      setVenueSeats([])
      return
    }
    try {
      setLoadingVenueSeats(true)
      const params: Parameters<typeof venueSeatService.searchSeats>[0] = {
        event_uuid: formData.event_uuid,
        q: venueSeatSearch.trim(),
      }
      if (formData.event_ticket_uuid) {
        const selectedTicket = eventTickets.find(
          (ticket) => ticket.uuid === formData.event_ticket_uuid,
        )
        if (selectedTicket?.code) params.category = selectedTicket.code
      }
      const seats = await venueSeatService.searchSeats(params)
      setVenueSeats(seats)
    } catch {
      toast.error('Failed to load venue seats.')
      setVenueSeats([])
    } finally {
      setLoadingVenueSeats(false)
    }
  }, [
    formData.event_uuid,
    formData.event_ticket_uuid,
    eventTickets,
    venueSeatSearch,
  ])

  useEffect(() => {
    if (!open) {
      resetForm()
      return
    }
    void fetchEvents('')
  }, [open, fetchEvents, resetForm])

  useEffect(() => {
    if (!open) return
    if (eventSearchDebounceRef.current) clearTimeout(eventSearchDebounceRef.current)
    eventSearchDebounceRef.current = setTimeout(() => {
      void fetchEvents(eventSearchQuery)
    }, 300)
    return () => {
      if (eventSearchDebounceRef.current) clearTimeout(eventSearchDebounceRef.current)
    }
  }, [eventSearchQuery, open, fetchEvents])

  useEffect(() => {
    if (!formData.event_uuid) {
      setSelectedEventConfig(null)
      setEventLocations([])
      setEventOtherInfoFieldNames([])
      return
    }
    void fetchEventDetails(formData.event_uuid)
  }, [formData.event_uuid, fetchEventDetails])

  useEffect(() => {
    if (eventLocations.length === 1) {
      setFormData((prev) => ({
        ...prev,
        event_location_uuid: eventLocations[0].uuid,
      }))
      return
    }

    setFormData((prev) => {
      if (
        prev.event_location_uuid &&
        eventLocations.some((location) => location.uuid === prev.event_location_uuid)
      ) {
        return prev
      }
      return { ...prev, event_location_uuid: '' }
    })
  }, [eventLocations])

  useEffect(() => {
    if (!formData.event_uuid) {
      setBlockedDates([])
      return
    }

    let cancelled = false
    void blockedDateService
      .list('events', formData.event_uuid)
      .then((response) => {
        if (cancelled) return
        setBlockedDates(
          (response.data ?? [])
            .map((item) => item.blocked_date?.slice(0, 10))
            .filter((date): date is string => Boolean(date)),
        )
      })
      .catch(() => {
        if (!cancelled) setBlockedDates([])
      })

    return () => {
      cancelled = true
    }
  }, [formData.event_uuid])

  useEffect(() => {
    if (selectedEventConfig === 'seat_selection') {
      setFormData((prev) => ({ ...prev, quantity: '1' }))
      return
    }
    setFormData((prev) => ({
      ...prev,
      venue_seat_uuid: '',
      row: '',
      col: '',
    }))
    setVenueSeats([])
    setVenueSeatSearch('')
    setShowVenueSeatDropdown(false)
  }, [selectedEventConfig])

  useEffect(() => {
    void fetchEventTickets()
  }, [fetchEventTickets])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (selectedEventConfig !== 'seat_selection' || !formData.event_uuid) {
      setVenueSeats([])
      return
    }
    if (venueSeatSearch.trim().length < 1) {
      setVenueSeats([])
      return
    }
    searchTimeoutRef.current = setTimeout(() => {
      void fetchVenueSeats()
    }, 750)
  }, [
    venueSeatSearch,
    formData.event_uuid,
    formData.event_ticket_uuid,
    selectedEventConfig,
    fetchVenueSeats,
  ])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        venueSeatDropdownRef.current &&
        !venueSeatDropdownRef.current.contains(event.target as Node)
      ) {
        setShowVenueSeatDropdown(false)
      }
      if (
        eventDropdownRef.current &&
        !eventDropdownRef.current.contains(event.target as Node)
      ) {
        setShowEventDropdown(false)
      }
    }
    if (showVenueSeatDropdown || showEventDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showVenueSeatDropdown, showEventDropdown])

  const selectedEventTicket = eventTickets.find(
    (ticket) => ticket.uuid === formData.event_ticket_uuid,
  )
  const requiresVisitDate =
    !!selectedEventTicket && selectedEventTicket.visit_policy !== 'flexible'
  const requiresLocation = eventLocations.length > 1

  const handleVenueSeatSelect = (seat: VenueSeat) => {
    setFormData((prev) => ({
      ...prev,
      venue_seat_uuid: seat.uuid,
      row: seat.row.toString(),
      col: seat.col.toString(),
    }))
    setVenueSeatSearch(
      `${seat.row}${seat.col} - Seat ${seat.seat_no} (${seat.category})`,
    )
    setShowVenueSeatDropdown(false)
  }

  const handleVenueSeatClear = () => {
    setFormData((prev) => ({
      ...prev,
      venue_seat_uuid: '',
      row: '',
      col: '',
    }))
    setVenueSeatSearch('')
    setVenueSeats([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!formData.event_uuid) newErrors.event_uuid = 'Event is required'
    if (!formData.event_ticket_uuid) {
      newErrors.event_ticket_uuid = 'Event ticket is required'
    }
    if (!formData.type) newErrors.type = 'Type is required'
    if (!formData.quantity || Number(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    }
    if (formData.type === 'paid-nr') {
      if (formData.amount === '') {
        newErrors.amount = 'Total amount paid is required'
      } else if (Number.isNaN(Number(formData.amount)) || Number(formData.amount) < 0) {
        newErrors.amount = 'Total amount must be 0 or greater'
      }
    }
    if (selectedEventConfig === 'seat_selection' && !formData.venue_seat_uuid) {
      newErrors.venue_seat_uuid = 'Venue seat is required for seat selection events'
    }
    if (requiresVisitDate && !formData.visitDate) {
      newErrors.visitDate = 'Date of visit is required for this ticket'
    }
    if (requiresLocation && !formData.event_location_uuid) {
      newErrors.event_location_uuid = 'Location is required'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const payload: Parameters<typeof userStatsService.addTicketToUser>[0] = {
        event_uuid: formData.event_uuid,
        user_uuid: userUuid,
        event_ticket_uuid: formData.event_ticket_uuid,
        type: formData.type,
        quantity: Number(formData.quantity) || 1,
      }
      if (formData.type === 'paid-nr' && formData.amount !== '') {
        payload.amount = Number(formData.amount)
      }
      if (formData.visitDate) {
        payload.valid_until = formData.visitDate
      }
      if (formData.event_location_uuid) {
        payload.event_location_uuid = formData.event_location_uuid
      }
      if (selectedEventConfig === 'seat_selection') {
        if (formData.venue_seat_uuid) payload.venue_seat_uuid = formData.venue_seat_uuid
        if (formData.col) payload.col = formData.col
        if (formData.row) payload.row = formData.row
      }
      const quantity = Number(formData.quantity) || 1
      const otherInfo = buildEmptyOtherInfoPerTicket(eventOtherInfoFieldNames, quantity)
      if (otherInfo.length > 0) payload.other_info = otherInfo

      await userStatsService.addTicketToUser(payload)
      toast.success('Ticket added successfully!')
      resetForm()
      onClose()
      onSuccess?.()
    } catch (error) {
      const validationErrors = getApiValidationErrors(error)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(flattenErrors(validationErrors))
      } else {
        toast.error(getApiErrorMessage(error, 'Failed to add ticket.'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
        aria-label="Close modal"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-ticket-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl"
      >
        <div className="shrink-0 border-b border-violet-100 px-6 py-4 text-center">
          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <h2 id="add-ticket-title" className="text-lg font-bold text-foreground">
            Add Ticket to User
          </h2>
        </div>

        <form
          id="add-ticket-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div className="space-y-1.5" ref={eventDropdownRef}>
            <label className={labelClassName}>
              Event <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={selectedEvent ? selectedEvent.event_name : eventSearchQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setEventSearchQuery(value)
                  if (selectedEvent) {
                    setSelectedEvent(null)
                    setFormData((prev) => ({ ...prev, event_uuid: '' }))
                  }
                  setShowEventDropdown(true)
                }}
                onFocus={() => setShowEventDropdown(true)}
                placeholder="Type to search events"
                className={cn(fieldClassName, 'pl-9 pr-9')}
                disabled={loading}
              />
              {selectedEvent ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvent(null)
                    setEventSearchQuery('')
                    setFormData((prev) => ({ ...prev, event_uuid: '' }))
                    setShowEventDropdown(true)
                    void fetchEvents('')
                  }}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear selection"
                >
                  <X className="size-4" />
                </button>
              ) : null}
              {showEventDropdown ? (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-violet-100 bg-white shadow-lg">
                  {loadingEvents ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Loading events...
                    </p>
                  ) : events.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {eventSearchQuery.trim() ? 'No events found.' : 'Type to search events.'}
                    </p>
                  ) : (
                    events.map((event) => (
                      <button
                        key={event.uuid}
                        type="button"
                        className="w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-violet-50"
                        onClick={() => {
                          setSelectedEvent(event)
                          setSelectedEventConfig(event.event_config ?? null)
                          setFormData((prev) => ({
                            ...prev,
                            event_uuid: event.uuid,
                            event_location_uuid: '',
                            event_ticket_uuid: '',
                            venue_seat_uuid: '',
                            row: '',
                            col: '',
                            visitDate: '',
                          }))
                          setEventSearchQuery(event.event_name)
                          setShowEventDropdown(false)
                        }}
                      >
                        {event.event_name}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
            {errors.event_uuid ? (
              <p className="text-xs text-red-600">{errors.event_uuid}</p>
            ) : null}
          </div>

          {formData.event_uuid ? (
            <div>
              <label className={labelClassName}>
                Location{' '}
                {requiresLocation ? <span className="text-red-500">*</span> : null}
              </label>
              <select
                value={formData.event_location_uuid}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    event_location_uuid: e.target.value,
                  }))
                }
                disabled={
                  !formData.event_uuid ||
                  eventLocations.length === 0 ||
                  eventLocations.length === 1 ||
                  loading
                }
                className={cn(fieldClassName, 'mt-1.5')}
              >
                <option value="">
                  {eventLocations.length === 0
                    ? 'No locations available'
                    : 'Select location'}
                </option>
                {eventLocations.map((location) => (
                  <option key={location.uuid} value={location.uuid}>
                    {formatLocationLabel(location)}
                  </option>
                ))}
              </select>
              {eventLocations.length === 1 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatLocationLabel(eventLocations[0])}
                </p>
              ) : null}
              {errors.event_location_uuid ? (
                <p className="mt-1 text-xs text-red-600">{errors.event_location_uuid}</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className={labelClassName}>
              Event Ticket <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.event_ticket_uuid}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  event_ticket_uuid: e.target.value,
                  venue_seat_uuid: '',
                  row: '',
                  col: '',
                  visitDate: '',
                }))
              }
              disabled={!formData.event_uuid || eventTickets.length === 0 || loading}
              className={cn(fieldClassName, 'mt-1.5')}
            >
              <option value="">Select event ticket</option>
              {eventTickets.map((ticket) => {
                const listPrice = parseFloat(String(ticket.price)) || 0
                const salePrice = getEventTicketSalePrice(ticket)
                const showStruckList = salePrice < listPrice - 0.005
                return (
                  <option key={ticket.uuid} value={ticket.uuid}>
                    {ticket.name} - {formatPhpMoney(salePrice)}
                    {showStruckList ? ` (was ${formatPhpMoney(listPrice)})` : ''}
                  </option>
                )
              })}
            </select>
            {errors.event_ticket_uuid ? (
              <p className="mt-1 text-xs text-red-600">{errors.event_ticket_uuid}</p>
            ) : null}
          </div>

          {formData.event_ticket_uuid ? (
            <div>
              <VisitDatePicker
                label={
                  requiresVisitDate
                    ? 'Date of Visit *'
                    : 'Date of Visit (optional)'
                }
                value={formData.visitDate}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, visitDate: value }))
                }
                blockedDates={blockedDates}
                onRejectedDate={(reason) => {
                  toast.error(
                    reason === 'blocked'
                      ? 'This date is not available. Please choose another visit date.'
                      : 'Past dates cannot be selected.',
                  )
                }}
              />
              {selectedEventTicket?.visit_policy === 'flexible' ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave blank to use the ticket&apos;s flexible validity period.
                </p>
              ) : null}
              {errors.visitDate ? (
                <p className="mt-1 text-xs text-red-600">{errors.visitDate}</p>
              ) : null}
              {errors.valid_until ? (
                <p className="mt-1 text-xs text-red-600">{errors.valid_until}</p>
              ) : null}
            </div>
          ) : null}

          {selectedEventConfig === 'seat_selection' ? (
            <div className="space-y-1.5" ref={venueSeatDropdownRef}>
              <label className={labelClassName}>
                Venue Seat <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search venue seat (type at least 1 character)"
                  value={venueSeatSearch}
                  onChange={(e) => {
                    setVenueSeatSearch(e.target.value)
                    setShowVenueSeatDropdown(e.target.value.length >= 1)
                  }}
                  onFocus={() => setShowVenueSeatDropdown(true)}
                  disabled={!formData.event_uuid || loading}
                  className={cn(fieldClassName, 'pl-9 pr-9')}
                />
                {formData.venue_seat_uuid ? (
                  <button
                    type="button"
                    onClick={handleVenueSeatClear}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
                {showVenueSeatDropdown && formData.event_uuid ? (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-violet-100 bg-white shadow-lg">
                    {loadingVenueSeats ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">Searching...</p>
                    ) : venueSeats.length > 0 ? (
                      venueSeats.map((seat) => (
                        <button
                          key={seat.uuid}
                          type="button"
                          onClick={() => handleVenueSeatSelect(seat)}
                          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-violet-50"
                        >
                          <span>
                            Row {seat.row}, Col {seat.col} - Seat {seat.seat_no}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {seat.category}
                          </span>
                        </button>
                      ))
                    ) : venueSeatSearch.trim().length >= 1 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">No seats found</p>
                    ) : (
                      <p className="p-4 text-center text-sm text-muted-foreground">
                        Type at least 1 character to search
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
              {formData.venue_seat_uuid ? (
                <p className="text-xs text-muted-foreground">
                  Selected: Row {formData.row}, Column {formData.col}
                </p>
              ) : null}
              {errors.venue_seat_uuid ? (
                <p className="text-xs text-red-600">{errors.venue_seat_uuid}</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className={labelClassName}>
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value,
                  amount: e.target.value === 'paid-nr' ? prev.amount : '',
                }))
              }
              disabled={loading}
              className={cn(fieldClassName, 'mt-1.5')}
            >
              <option value="">Select ticket type</option>
              <option value="paid-nr">Paid Not Reflected</option>
              <option value="complementary">Complementary</option>
            </select>
            {errors.type ? <p className="mt-1 text-xs text-red-600">{errors.type}</p> : null}
          </div>

          <div>
            <label className={labelClassName}>
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={formData.quantity}
              disabled={selectedEventConfig === 'seat_selection' || loading}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: e.target.value }))
              }
              className={cn(fieldClassName, 'mt-1.5')}
            />
            {selectedEventConfig === 'seat_selection' ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Seat selection events are limited to 1 ticket per seat.
              </p>
            ) : null}
            {errors.quantity ? (
              <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
            ) : null}
          </div>

          {formData.type === 'paid-nr' ? (
            <div>
              <label className={labelClassName}>
                Total amount paid <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="Full amount for this order (all tickets)"
                disabled={loading}
                className={cn(fieldClassName, 'mt-1.5')}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter the full amount collected for the quantity above, not the price per ticket.
              </p>
              {errors.amount ? (
                <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
              ) : null}
            </div>
          ) : null}
        </form>

        <div className="flex shrink-0 justify-end gap-2 border-t border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-ticket-form"
            disabled={loading}
            className="rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-violet/90 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}
