import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Minus, Plus, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PromoCodeBlock } from '@/components/attraction/PromoCodeBlock'
import { Button } from '@/components/ui/button'
import { ThemedSelect } from '@/components/ui/themed-select'
import { VisitDatePicker } from '@/components/ui/visit-date-picker'
import type { Attraction, AttractionLocation } from '@/data/mockAttractions'
import { saveCheckoutSession } from '@/lib/checkoutSession'
import { getPromoDiscountAmount } from '@/lib/promoUtils'
import { isVisitDateBookable } from '@/lib/visitDate'
import { cn } from '@/lib/utils'
import { blockedDateService } from '@/services/blockedDateService'
import type { PublicPromoCode } from '@/services/promoCodeService'

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
  const navigate = useNavigate()
  const [ticketTypeId, setTicketTypeId] = useState(
    attraction.ticketTypes[0]?.id ?? '',
  )
  const [locationUuid, setLocationUuid] = useState(
    attraction.locations[0]?.uuid ?? '',
  )
  const [quantity, setQuantity] = useState(1)
  const [visitDate, setVisitDate] = useState('')
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [appliedPromoCode, setAppliedPromoCode] = useState<PublicPromoCode | null>(
    null,
  )

  const selectedLocation =
    attraction.locations.find((location) => location.uuid === locationUuid) ??
    attraction.locations[0]

  useEffect(() => {
    const defaultLocation = attraction.locations[0]
    setLocationUuid(defaultLocation?.uuid ?? '')
    setAppliedPromoCode(null)
    setVisitDate('')
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

  const selectedTicket = attraction.ticketTypes.find((t) => t.id === ticketTypeId)
  const unitPrice = selectedTicket?.price ?? attraction.price
  const subtotal = unitPrice * quantity
  const promoDiscount = useMemo(
    () => getPromoDiscountAmount(subtotal, appliedPromoCode),
    [subtotal, appliedPromoCode],
  )
  const total = Math.max(0, subtotal - promoDiscount)

  const handleGetTickets = () => {
    if (!ticketTypeId) {
      toast.error('Please select a ticket type')
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
      toast.error('This date is not available. Please choose another visit date.')
      return
    }
    if (!isVisitDateBookable(visitDate, attraction.todayCutoffTime)) {
      toast.error(
        "Today's visit date is no longer available. Please choose another date.",
      )
      return
    }

    saveCheckoutSession({
      attractionId: attraction.id,
      eventUuid: attraction.eventUuid,
      eventLocationUuid: locationUuid,
      attractionName: attraction.name,
      location: selectedLocation?.label ?? attraction.location,
      image: attraction.image,
      ticketTypeId,
      ticketTypeName: selectedTicket?.name ?? 'General Admission',
      unitPrice,
      quantity,
      visitDate,
      subtotal,
      promoDiscount,
      total,
      appliedPromoCode: appliedPromoCode
        ? { uuid: appliedPromoCode.uuid, code: appliedPromoCode.code }
        : null,
    })

    void navigate({ to: '/checkout' })
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

        <ThemedSelect
          label="Ticket Type"
          value={ticketTypeId}
          onChange={setTicketTypeId}
          options={attraction.ticketTypes.map((ticket) => ({
            value: ticket.id,
            label: `${ticket.name} — ₱${ticket.price.toLocaleString()}`,
          }))}
        />

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
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Quantity
          </label>
          <div className="flex h-11 items-center justify-between rounded-xl border border-violet-100 px-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>
            <span className="text-sm font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>
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
                {quantity} ticket{quantity !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGetTickets}
          className={cn(
            'h-12 w-full rounded-xl bg-paec-orange text-base font-semibold hover:bg-paec-orange-light',
          )}
        >
          <Ticket className="size-4" />
          Get Tickets
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
