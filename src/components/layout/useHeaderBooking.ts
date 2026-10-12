import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Attraction } from '@/data/mockAttractions'
import { saveCheckoutSession } from '@/lib/checkoutSession'
import { isVisitDateBookable } from '@/lib/visitDate'
import { blockedDateService } from '@/services/blockedDateService'
import { marketplaceService } from '@/services/marketplaceService'

const STALE_TIME = 5 * 60 * 1000

export function notifyRejectedVisitDate(reason: 'blocked' | 'past' | 'cutoff') {
  if (reason === 'blocked') {
    toast.error('This date is not available. Please choose another date.')
    return
  }
  if (reason === 'cutoff') {
    toast.error("Today's visit date is no longer available.")
    return
  }
  toast.error('Past dates cannot be selected.')
}

export function useHeaderBooking() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Attraction | null>(null)
  const [ticketTypeId, setTicketTypeId] = useState('')
  const [locationUuid, setLocationUuid] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [pax, setPax] = useState(1)

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['public-activities'],
    queryFn: () => marketplaceService.listActivities(),
    staleTime: STALE_TIME,
  })

  const { data: detail, isFetching: loadingDetail } = useQuery({
    queryKey: ['public-activity', selected?.id],
    queryFn: () => marketplaceService.getActivity(selected!.id),
    enabled: Boolean(selected),
    staleTime: STALE_TIME,
  })

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['public-blocked-dates', selected?.eventUuid],
    queryFn: async () => {
      const items = await blockedDateService.listPublicForEvent(
        selected!.eventUuid,
      )
      return items
        .map((item) => item.blocked_date.slice(0, 10))
        .filter((date): date is string => Boolean(date))
    },
    enabled: Boolean(selected?.eventUuid),
    staleTime: STALE_TIME,
  })

  const activity = selected ? (detail ?? null) : null
  const ticketTypes = activity?.ticketTypes ?? []
  const locations = activity?.locations ?? []
  const selectedTicket = ticketTypes.find((t) => t.id === ticketTypeId)
  const selectedLocation = locations.find((l) => l.uuid === locationUuid)

  useEffect(() => {
    setTicketTypeId(activity?.ticketTypes[0]?.id ?? '')
    setLocationUuid(activity?.locations[0]?.uuid ?? '')
  }, [activity])

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term || selected?.name === query) return activities

    return activities.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term),
    )
  }, [activities, query, selected])

  const updateQuery = (value: string) => {
    setQuery(value)
    setSelected(null)
  }

  const selectActivity = (item: Attraction) => {
    setSelected(item)
    setQuery(item.name)
  }

  const clearActivity = () => {
    setSelected(null)
    setQuery('')
  }

  const getTickets = (): boolean => {
    if (!selected) {
      toast.error('Please select an activity')
      return false
    }
    if (!activity) {
      toast.error('Ticket types are still loading. Please try again.')
      return false
    }
    if (!selectedTicket) {
      toast.error('Please select a ticket type')
      return false
    }
    if (locations.length > 0 && !selectedLocation) {
      toast.error('Please select a location')
      return false
    }
    if (!visitDate) {
      toast.error('Please select a date of visit')
      return false
    }
    if (blockedDates.includes(visitDate)) {
      toast.error(
        'This date is not available. Please choose another visit date.',
      )
      return false
    }
    if (!isVisitDateBookable(visitDate, activity.todayCutoffTime)) {
      toast.error(
        "Today's visit date is no longer available. Please choose another date.",
      )
      return false
    }

    const subtotal = selectedTicket.price * pax

    saveCheckoutSession({
      attractionId: activity.id,
      eventUuid: activity.eventUuid,
      eventLocationUuid: selectedLocation?.uuid ?? '',
      attractionName: activity.name,
      location: selectedLocation?.label ?? activity.location,
      image: activity.image,
      tickets: [
        {
          ticketTypeId: selectedTicket.id,
          name: selectedTicket.name,
          unitPrice: selectedTicket.price,
          originalUnitPrice: selectedTicket.originalPrice,
          quantity: pax,
        },
      ],
      visitDate,
      subtotal,
      promoDiscount: 0,
      total: subtotal,
      appliedPromoCode: null,
    })

    void navigate({ to: '/checkout' })
    return true
  }

  return {
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
  }
}
