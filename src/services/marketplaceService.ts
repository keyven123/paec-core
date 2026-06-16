import type { Attraction, HeroSlide } from '@/data/mockAttractions'
import type { TrendingEvent } from '@/data/mockTrending'
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
  address: string
  city?: string
  category_name?: string
  event_section_name?: string
  price_start?: string | number | null
  portrait_image?: PublicEventImage | null
  featured_image?: PublicEventImage | null
  event_showcase?: PublicEventImage[] | null
  category?: { uuid: string; name: string }
  schedules?: Array<{
    date_from?: string
    date_to?: string
  }>
  event_locations?: PublicEventLocation[]
}

export type PublicEventTicket = {
  uuid: string
  name: string
  price: string
  description?: string
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
  cities: string[]
  locations: BrowseByCityLocationApi[]
}

export type BrowseByCityData = {
  cities: string[]
  locations: BrowseByCityLocation[]
}

type PaginatedPublicEvents = {
  data: PublicEvent[]
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

function formatScheduleLabel(_event: PublicEvent): string {
  return 'Open Daily'
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

function formatLocationSummary(locations: Attraction['locations'], fallback: string): string {
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
  tickets: PublicEventTicket[] = [],
): Attraction {
  const categoryName =
    event.category_name ?? event.category?.name ?? 'Activity'
  const locations = mapEventLocations(event)
  const fallbackLocation = event.city || event.address || 'Philippines'

  return {
    id: event.slug ?? event.uuid,
    eventUuid: event.uuid,
    name: event.event_name,
    location: formatLocationSummary(locations, fallbackLocation),
    locations,
    category: categoryName,
    categoryLabel: categoryName.toUpperCase(),
    price: toNumber(event.price_start),
    image: getEventImage(event),
    featured: event.event_section_name === 'featured',
    hours: formatScheduleLabel(event),
    intensity: 'All ages',
    rating: 4.8,
    reviewCount: 0,
    description: event.event_description,
    tags: categoryName ? [categoryName] : [],
    ticketTypes: tickets.map((ticket) => ({
      id: ticket.uuid,
      name: ticket.name,
      price: toNumber(ticket.price),
    })),
  }
}

export function buildHeroSlides(activities: Attraction[]): HeroSlide[] {
  if (activities.length === 0) return []

  return activities.slice(0, 2).map((activity, index) => {
    const words = activity.name.split(' ')
    const splitAt = Math.max(1, Math.ceil(words.length / 2))
    const title = words.slice(0, splitAt).join(' ')
    const highlight = words.slice(splitAt).join(' ') || 'Experience'

    return {
      id: String(index + 1),
      attractionId: activity.id,
      badge: index === 0 ? 'Top Picks' : 'Featured',
      title,
      highlight,
      subtitle:
        activity.description.slice(0, 120) ||
        'Book tickets for the best activities and experiences across the Philippines.',
      location: activity.location,
      priceFrom: activity.price,
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

export function buildTrendingEvents(activities: Attraction[]): TrendingEvent[] {
  const badges = ['SELLING FAST', 'FEATURED', 'NEW', 'POPULAR', 'LIMITED']

  return activities.slice(0, 5).map((activity, index) => ({
    id: `trending-${activity.id}`,
    attractionId: activity.id,
    title: activity.name,
    location: activity.location,
    date: activity.hours,
    price: activity.price,
    category: activity.categoryLabel,
    badge: badges[index % badges.length],
    image: activity.image,
    featured: index === 0,
    sellingFast: index === 0,
  }))
}

export const marketplaceService = {
  async listActivities(perPage = 100): Promise<Attraction[]> {
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

      let tickets: PublicEventTicket[] = []
      try {
        const ticketsRes = await api.get<{ data: PublicEventTicket[] }>(
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
}
