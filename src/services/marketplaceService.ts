import type { Attraction, HeroSlide } from '@/data/mockAttractions'
import type {
  PaymentGatewayEnvironment,
  PaymentGatewayProvider,
  PaynamicsChannel,
} from '@/services/paymentGatewayService'
import { api } from '@/lib/api'
import { resolveImageUrl } from '@/lib/imageUtils'

export type PublicEventImage = {
  uuid: string
  url: string
  disk?: string
}

export type PublicEventLocation = {
  uuid: string
  name?: string | null
  city: string
  address?: string | null
  label: string
  organization_uuid?: string | null
}

export type PublicEvent = {
  uuid: string
  slug: string | null
  event_name: string
  event_description: string
  contact_email?: string | null
  contact_number?: string | null
  address: string
  city?: string
  category_name?: string
  event_section_name?: string
  price_start?: string | number | null
  discounted_price_start?: number | null
  max_discount_percent?: number | null
  max_discount_amount?: number | null
  discount_type?: 'percentage' | 'amount' | null
  logo?: PublicEventImage | null
  portrait_image?: PublicEventImage | null
  featured_image?: PublicEventImage | null
  event_showcase?: Array<PublicEventImage> | null
  category?: { uuid: string; name: string }
  event_type?: string
  schedule_type?: string
  schedules?: Array<{
    date_from?: string
    date_to?: string
    schedule_times?: Array<{
      time_start?: string
      time_end?: string
    }>
  }>
  event_locations?: Array<PublicEventLocation>
  today_cutoff_time?: string | null
  payment_gateways?: Array<PublicPaymentGateway>
}

export type PublicPaymentGateway = {
  uuid: string
  name: string
  provider: PaymentGatewayProvider
  environment: PaymentGatewayEnvironment | null
  /** Paynamics only: channels the customer can choose. */
  payment_channels?: Array<PaynamicsChannel> | null
}

export type PublicEventTicket = {
  uuid: string
  name: string
  price: string
  discounted_price?: number | string | null
  description?: string
  available_from?: string | null
  available_to?: string | null
  feature_on_flash_sale?: boolean
  flash_sale_from?: string | null
  flash_sale_to?: string | null
  operation_days?: string | null
  operation_custom_days?: Array<string> | null
  operation_hours_from?: string | null
  operation_hours_to?: string | null
}

export type BrowseByCityLocation = {
  uuid: string
  city: string
  name?: string | null
  address?: string | null
  label: string
  event_uuid: string
  event_slug: string | null
  event_name: string
  price_start?: string | number | null
  image?: string | null
}

type BrowseByCityLocationApi = Omit<BrowseByCityLocation, 'image'> & {
  image?: { url?: string | null } | null
}

type BrowseByCityApiData = {
  cities: Array<string>
  locations: Array<BrowseByCityLocationApi>
}

export type BrowseByCityData = {
  cities: Array<string>
  locations: Array<BrowseByCityLocation>
}

type PaginatedPublicEvents = {
  data: Array<PublicEvent>
  meta: {
    total: number
    current_page: number
    last_page: number
  }
}

function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getEventImage(event: PublicEvent): string {
  const candidates = [
    event.featured_image?.url,
    event.portrait_image?.url,
    event.event_showcase?.[0]?.url,
  ]

  for (const url of candidates) {
    const resolved = resolveImageUrl(url)
    if (resolved) return resolved
  }

  return ''
}

function mapShowcaseImages(
  event: PublicEvent,
  heroImage: string,
): Array<string> {
  const images = (event.event_showcase ?? [])
    .map((image) => resolveImageUrl(image.url))
    .filter((url): url is string => Boolean(url))

  if (!heroImage) return images

  return images.filter((url) => url !== heroImage)
}

function toTimeLabel(value: string | null | undefined): string {
  if (!value) return ''
  const hhmm = value.slice(0, 5)
  const [hoursRaw, minutes] = hhmm.split(':').map(Number)
  if (Number.isNaN(hoursRaw) || Number.isNaN(minutes)) return hhmm
  const period = hoursRaw >= 12 ? 'PM' : 'AM'
  const hours = hoursRaw % 12 || 12
  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`
}

function formatScheduleLabel(event: PublicEvent): string {
  const isSingle =
    event.event_type === 'single' || event.schedule_type === 'single'
  const schedule = event.schedules?.[0]
  const date = schedule?.date_from?.slice(0, 10)
  if (isSingle && date) {
    const time = schedule?.schedule_times?.[0]
    const start = toTimeLabel(time?.time_start)
    const end = toTimeLabel(time?.time_end)
    if (start && end) return `${date} · ${start} – ${end}`
    return date
  }
  return 'Open Daily'
}

function fixedVisitFromEvent(event: PublicEvent): {
  fixedVisitDate: string | null
  fixedVisitTimeStart: string | null
  fixedVisitTimeEnd: string | null
} {
  const isSingle =
    event.event_type === 'single' || event.schedule_type === 'single'
  if (!isSingle) {
    return {
      fixedVisitDate: null,
      fixedVisitTimeStart: null,
      fixedVisitTimeEnd: null,
    }
  }
  const schedule = event.schedules?.[0]
  const time = schedule?.schedule_times?.[0]
  return {
    fixedVisitDate: schedule?.date_from?.slice(0, 10) ?? null,
    fixedVisitTimeStart: time?.time_start?.slice(0, 5) ?? null,
    fixedVisitTimeEnd: time?.time_end?.slice(0, 5) ?? null,
  }
}

function formatLocationLabel(location: PublicEventLocation): string {
  if (location.label) return location.label
  if (location.address) return location.address
  return location.city
}

function mapEventLocations(event: PublicEvent): Attraction['locations'] {
  const locations = event.event_locations ?? []
  return locations.map((location) => ({
    uuid: location.uuid,
    name: location.name,
    city: location.city,
    address: location.address,
    label: formatLocationLabel(location),
    organizationUuid: location.organization_uuid ?? null,
  }))
}

function formatLocationSummary(
  locations: Attraction['locations'],
  fallback: string,
): string {
  if (locations.length === 0) return fallback
  if (locations.length === 1) return locations[0].label
  const cities = [...new Set(locations.map((location) => location.city))]
  return cities.join(' · ')
}

function mapBrowseByCityLocation(
  location: BrowseByCityLocationApi,
): BrowseByCityLocation {
  return {
    uuid: location.uuid,
    city: location.city,
    name: location.name,
    address: location.address,
    label: location.label,
    event_uuid: location.event_uuid,
    event_slug: location.event_slug,
    event_name: location.event_name,
    price_start: location.price_start,
    image: resolveImageUrl(location.image?.url) || null,
  }
}

export function mapPublicEventToAttraction(
  event: PublicEvent,
  tickets: Array<PublicEventTicket> = [],
): Attraction {
  const categoryName = event.category_name ?? event.category?.name ?? 'Activity'
  const locations = mapEventLocations(event)
  const fallbackLocation = event.city || event.address || 'Philippines'
  const heroImage = getEventImage(event)
  const basePrice = toNumber(event.price_start)
  const discountPercent = event.max_discount_percent ?? 0
  const discountedPrice =
    discountPercent > 0 && event.discounted_price_start != null
      ? toNumber(event.discounted_price_start)
      : null
  const hasLowerPrice = discountedPrice !== null && discountedPrice < basePrice
  const fixedVisit = fixedVisitFromEvent(event)

  return {
    id: event.slug ?? event.uuid,
    eventUuid: event.uuid,
    name: event.event_name,
    location: formatLocationSummary(locations, fallbackLocation),
    locations,
    category: categoryName,
    categoryLabel: categoryName.toUpperCase(),
    price: hasLowerPrice ? discountedPrice : basePrice,
    originalPrice: hasLowerPrice ? basePrice : undefined,
    discountPercent: discountPercent > 0 ? discountPercent : undefined,
    discountType:
      discountPercent > 0 ? (event.discount_type ?? 'percentage') : undefined,
    discountAmount:
      discountPercent > 0
        ? (event.max_discount_amount ?? undefined)
        : undefined,
    promo: discountPercent > 0,
    image: heroImage,
    logoUrl: resolveImageUrl(event.logo?.url) || null,
    showcaseImages: mapShowcaseImages(event, heroImage),
    featured: event.event_section_name === 'featured',
    hours: formatScheduleLabel(event),
    intensity: 'All ages',
    rating: 4.8,
    reviewCount: 0,
    description: event.event_description,
    tags: categoryName ? [categoryName] : [],
    fixedVisitDate: fixedVisit.fixedVisitDate,
    fixedVisitTimeStart: fixedVisit.fixedVisitTimeStart,
    fixedVisitTimeEnd: fixedVisit.fixedVisitTimeEnd,
    ticketTypes: tickets.map((ticket) => {
      const listPrice = toNumber(ticket.price)
      const finalPrice =
        ticket.discounted_price != null
          ? toNumber(ticket.discounted_price)
          : listPrice
      const discounted = finalPrice < listPrice

      return {
        id: ticket.uuid,
        name: ticket.name,
        price: discounted ? finalPrice : listPrice,
        originalPrice: discounted ? listPrice : undefined,
        description: ticket.description,
        availableFrom: ticket.available_from ?? null,
        availableTo: ticket.available_to ?? null,
        featureOnFlashSale: !!ticket.feature_on_flash_sale,
        flashSaleFrom: ticket.flash_sale_from ?? null,
        flashSaleTo: ticket.flash_sale_to ?? null,
        operationDays:
          ticket.operation_days === 'weekdays' ||
          ticket.operation_days === 'weekends' ||
          ticket.operation_days === 'custom'
            ? ticket.operation_days
            : 'any',
        operationCustomDays: Array.isArray(ticket.operation_custom_days)
          ? (ticket.operation_custom_days.filter((day) =>
              ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(day),
            ) as Array<
              'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
            >)
          : null,
        operationHoursFrom: ticket.operation_hours_from
          ? String(ticket.operation_hours_from).slice(0, 5)
          : null,
        operationHoursTo: ticket.operation_hours_to
          ? String(ticket.operation_hours_to).slice(0, 5)
          : null,
      }
    }),
    todayCutoffTime: event.today_cutoff_time ?? null,
    contactEmail: event.contact_email ?? null,
    contactNumber: event.contact_number ?? null,
  }
}

export function mergeCatalogActivities(
  catalog: Array<Attraction>,
  featured: Array<Attraction>,
): Array<Attraction> {
  const seen = new Set<string>()
  const merged: Array<Attraction> = []

  for (const activity of [...catalog, ...featured]) {
    const key = activity.eventUuid
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(activity)
  }

  return merged
}

/** Cuts activity copy at a sentence or word boundary so the hero never ends mid-word. */
export function featuredDescriptionExcerpt(
  description: string | undefined,
  maxLength = 200,
): string {
  const fallback =
    'Book tickets for the best activities and experiences across the Philippines.'
  const cleaned = (description ?? '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return fallback
  if (cleaned.length <= maxLength) return cleaned

  const slice = cleaned.slice(0, maxLength)
  const sentence = slice.match(/^([\s\S]+?[.!?])(?:\s|$)/)
  if (sentence && sentence[1].length >= Math.floor(maxLength * 0.45)) {
    return sentence[1].trim()
  }

  const atWord = slice.replace(/\s+\S*$/, '').trim()
  return `${atWord || slice.trim()}…`
}

export function buildHeroSlides(
  activities: Array<Attraction>,
): Array<HeroSlide> {
  if (activities.length === 0) return []

  return activities.map((activity, index) => {
    const words = activity.name.split(' ')
    const splitAt = Math.max(1, Math.ceil(words.length / 2))
    const title = words.slice(0, splitAt).join(' ')
    const highlight = words.slice(splitAt).join(' ') || 'Experience'

    return {
      id: activity.id,
      attractionId: activity.id,
      badge: index === 0 ? 'Top Picks' : 'Featured',
      title,
      highlight,
      subtitle: featuredDescriptionExcerpt(activity.description),
      location: activity.location,
      contactNumber: activity.contactNumber ?? null,
      priceFrom: activity.price,
      originalPrice: activity.originalPrice,
      discountPercent: activity.discountPercent,
      discountType: activity.discountType,
      discountAmount: activity.discountAmount,
      image: activity.image,
      featuredCard: {
        label: 'Featured Activity',
        name: activity.name,
        image: activity.image,
        attractionId: activity.id,
      },
    }
  })
}

export const marketplaceService = {
  async listFeaturedActivities(limit = 100): Promise<Array<Attraction>> {
    const { data } = await api.get<PaginatedPublicEvents>('/v1/public/events', {
      params: {
        type: 'featured',
        per_page: limit,
      },
    })

    return data.data.map((event) => mapPublicEventToAttraction(event))
  },

  async listActivities(perPage = 100): Promise<Array<Attraction>> {
    const { data } = await api.get<PaginatedPublicEvents>('/v1/public/events', {
      params: {
        type: 'amusements',
        per_page: perPage,
        sort_by: 'created_at',
        sort: 'desc',
      },
    })

    return data.data.map((event) => mapPublicEventToAttraction(event))
  },

  async listPromoActivities(perPage = 100): Promise<Array<Attraction>> {
    const { data } = await api.get<PaginatedPublicEvents>('/v1/public/events', {
      params: {
        type: 'amusements',
        fun_type: 'promo',
        per_page: perPage,
        sort_by: 'created_at',
        sort: 'desc',
      },
    })

    return data.data.map((event) => ({
      ...mapPublicEventToAttraction(event),
      promo: true,
    }))
  },

  async listBrowseByCity(params?: {
    city?: string
    limit?: number
  }): Promise<BrowseByCityData> {
    const { data } = await api.get<{ data: BrowseByCityApiData }>(
      '/v1/public/events/browse-by-city',
      {
        params: {
          type: 'amusements',
          limit: params?.limit ?? 12,
          city: params?.city,
        },
      },
    )

    return {
      cities: data.data.cities ?? [],
      locations: (data.data.locations ?? []).map(mapBrowseByCityLocation),
    }
  },

  async getActivity(identifier: string): Promise<Attraction | null> {
    try {
      const { data } = await api.get<{ data: PublicEvent }>(
        `/v1/public/events/${identifier}`,
      )

      let tickets: Array<PublicEventTicket> = []
      try {
        const ticketsRes = await api.get<{ data: Array<PublicEventTicket> }>(
          `/v1/public/events/${data.data.uuid}/tickets`,
        )
        tickets = ticketsRes.data.data ?? []
      } catch {
        tickets = []
      }

      return mapPublicEventToAttraction(data.data, tickets)
    } catch {
      return null
    }
  },

  async getEventTickets(eventUuid: string): Promise<Array<PublicEventTicket>> {
    try {
      const { data } = await api.get<{ data: Array<PublicEventTicket> }>(
        `/v1/public/events/${eventUuid}/tickets`,
      )
      return data.data ?? []
    } catch {
      return []
    }
  },


  async getActivityPaymentGateways(
    identifier: string,
  ): Promise<Array<PublicPaymentGateway>> {
    const { data } = await api.get<{ data: PublicEvent }>(
      `/v1/public/events/${identifier}`,
    )
    return data.data.payment_gateways ?? []
  },
}
