import { CheckCircle2, Loader2, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Attraction, AttractionLocation } from '@/data/mockAttractions'
import type { CheckoutTicketLine } from '@/lib/checkoutSession'
import type { PublicPromoCode } from '@/services/promoCodeService'
import { PromoCodeBlock } from '@/components/attraction/PromoCodeBlock'
import { TicketTypeCard } from '@/components/attraction/TicketTypeCard'
import { Button } from '@/components/ui/button'
import { ThemedSelect } from '@/components/ui/themed-select'
import { VisitDatePicker } from '@/components/ui/visit-date-picker'
import { getTicketCount } from '@/lib/checkoutSession'
import { useStartBooking } from '@/lib/useStartBooking'
import { useStoredUser } from '@/lib/useStoredUser'
import { getPromoDiscountAmount } from '@/lib/promoUtils'
import {
  isTicketAvailableForVisitDate,
  isVisitDateBookable,
} from '@/lib/visitDate'
import { cn } from '@/lib/utils'
import { blockedDateService } from '@/services/blockedDateService'

type BookingSidebarProps = {
  attraction: Attraction
  onLocationChange?: (location: AttractionLocation) => void
}

function formatLocationOption(location: AttractionLocation): string {
  if (location.name) {
    return `${location.name} — ${location.city}`
  }

  return location.label
}

export function BookingSidebar({
  attraction,
  onLocationChange,
}: BookingSidebarProps) {
  const { startBooking, adding } = useStartBooking()
  const signedIn = Boolean(useStoredUser())
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [locationUuid, setLocationUuid] = useState(
    attraction.locations[0]?.uuid ?? '',
  )
  const [visitDate, setVisitDate] = useState('')
  const [blockedDates, setBlockedDates] = useState<Array<string>>([])
  const [appliedPromoCode, setAppliedPromoCode] =
    useState<PublicPromoCode | null>(null)

  const selectedLocation =
    attraction.locations.find((location) => location.uuid === locationUuid) ??
    attraction.locations[0]

  useEffect(() => {
    const defaultLocation = attraction.locations[0]
    setLocationUuid(defaultLocation?.uuid ?? '')
    setAppliedPromoCode(null)
    setVisitDate('')
    setQuantities({})
  }, [attraction.eventUuid, attraction.locations])

  useEffect(() => {
    if (selectedLocation) {
      onLocationChange?.(selectedLocation)
    }
  }, [selectedLocation, onLocationChange])

  useEffect(() => {
    if (!attraction.eventUuid || attraction.eventUuid.startsWith('mock-')) {
      setBlockedDates([])
      return
    }

    let cancelled = false

    void blockedDateService
      .listPublicForEvent(attraction.eventUuid)
      .then((items) => {
        if (cancelled) return
        setBlockedDates(
          items
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
  }, [attraction.eventUuid])

  useEffect(() => {
    if (!visitDate) return

    setQuantities((prev) => {
      let changed = false
      const next = { ...prev }
      for (const ticket of attraction.ticketTypes) {
        if (
          (next[ticket.id] ?? 0) > 0 &&
          !isTicketAvailableForVisitDate(ticket, visitDate)
        ) {
          next[ticket.id] = 0
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [visitDate, attraction.ticketTypes])

  const ticketLines: Array<CheckoutTicketLine> = attraction.ticketTypes
    .filter(
      (ticket) =>
        (quantities[ticket.id] ?? 0) > 0 &&
        isTicketAvailableForVisitDate(ticket, visitDate),
    )
    .map((ticket) => ({
      ticketTypeId: ticket.id,
      name: ticket.name,
      unitPrice: ticket.price,
      originalUnitPrice: ticket.originalPrice,
      quantity: quantities[ticket.id],
    }))
  const ticketCount = getTicketCount({ tickets: ticketLines })
  const subtotal = ticketLines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  )
  const promoDiscount = useMemo(
    () => getPromoDiscountAmount(subtotal, appliedPromoCode),
    [subtotal, appliedPromoCode],
  )
  const total = Math.max(0, subtotal - promoDiscount)

  const changeQuantity = (ticketId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [ticketId]: Math.max(0, (prev[ticketId] ?? 0) + delta),
    }))
  }

  const handleGetTickets = () => {
    if (ticketLines.length === 0) {
      toast.error('Please add at least one ticket')
      return
    }
    if (attraction.locations.length > 0 && !locationUuid) {
      toast.error('Please select a location')
      return
    }
    if (!visitDate) {
      toast.error('Please select a date of visit')
      return
    }
    if (blockedDates.includes(visitDate)) {
      toast.error(
        'This date is not available. Please choose another visit date.',
      )
      return
    }
    if (!isVisitDateBookable(visitDate, attraction.todayCutoffTime)) {
      toast.error(
        "Today's visit date is no longer available. Please choose another date.",
      )
      return
    }

    void startBooking({
      attractionId: attraction.id,
      eventUuid: attraction.eventUuid,
      eventLocationUuid: locationUuid,
      attractionName: attraction.name,
      location: selectedLocation?.label ?? attraction.location,
      image: attraction.image,
      tickets: ticketLines,
      visitDate,
      subtotal,
      promoDiscount,
      total,
      appliedPromoCode: appliedPromoCode
        ? {
            uuid: appliedPromoCode.uuid,
            code: appliedPromoCode.code,
            discountType: appliedPromoCode.discount_type,
            discountValue: appliedPromoCode.discount_value,
          }
        : null,
    })
  }

  return (
    <aside className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg">
      <div className="bg-paec-violet px-5 py-4 text-white">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <Ticket className="size-3.5" />
          Get Tickets
        </div>
        <p className="mt-1 text-lg font-semibold leading-snug">
          {attraction.name}
        </p>
      </div>

      <div className="space-y-4 p-5">
        {attraction.locations.length > 0 && (
          <ThemedSelect
            label="Location"
            value={locationUuid}
            onChange={setLocationUuid}
            options={attraction.locations.map((location) => ({
              value: location.uuid,
              label: formatLocationOption(location),
            }))}
          />
        )}

        <VisitDatePicker
          value={visitDate}
          onChange={setVisitDate}
          blockedDates={blockedDates}
          todayCutoffTime={attraction.todayCutoffTime}
          onRejectedDate={(reason) => {
            if (reason === 'blocked') {
              toast.error(
                'This date is not available. Please choose another visit date.',
              )
              return
            }
            if (reason === 'cutoff') {
              toast.error(
                "Today's visit date is no longer available. Please choose another date.",
              )
              return
            }
            toast.error('Past dates cannot be selected.')
          }}
        />

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Ticket Types
          </p>
          {attraction.ticketTypes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 px-4 py-3 text-sm text-muted-foreground">
              No tickets are available for this activity yet.
            </p>
          ) : (
            <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-0.5">
              {attraction.ticketTypes.map((ticket) => {
                const unavailable =
                  Boolean(visitDate) &&
                  !isTicketAvailableForVisitDate(ticket, visitDate)

                return (
                  <TicketTypeCard
                    key={ticket.id}
                    ticket={ticket}
                    quantity={quantities[ticket.id] ?? 0}
                    unavailable={unavailable}
                    onDecrease={() => changeQuantity(ticket.id, -1)}
                    onIncrease={() => {
                      if (!visitDate) {
                        toast.error('Please select a date of visit first')
                        return
                      }
                      if (unavailable) {
                        toast.error(
                          'This ticket is unavailable for the selected date.',
                        )
                        return
                      }
                      changeQuantity(ticket.id, 1)
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>

        <PromoCodeBlock
          eventUuid={attraction.eventUuid}
          subtotal={subtotal}
          appliedPromoCode={appliedPromoCode}
          onAppliedChange={setAppliedPromoCode}
        />

        <div className="space-y-2 border-t border-violet-100 pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          {appliedPromoCode && promoDiscount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600">
                Promo{' '}
                <span className="font-mono text-xs text-paec-violet">
                  {appliedPromoCode.code}
                </span>
              </span>
              <span className="font-medium text-emerald-600">
                −₱{promoDiscount.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Total
              </p>
              <p className="text-2xl font-bold text-foreground">
                ₱{total.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGetTickets}
          disabled={adding}
          className={cn(
            'h-12 w-full rounded-xl bg-paec-orange text-base font-semibold hover:bg-paec-orange-light',
          )}
        >
          {adding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Ticket className="size-4" />
          )}
          {signedIn ? 'Add to Cart & Checkout' : 'Get Tickets'}
        </Button>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-emerald-600">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            Instant confirmation
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            Secure checkout
          </span>
        </div>
      </div>
    </aside>
  )
}
