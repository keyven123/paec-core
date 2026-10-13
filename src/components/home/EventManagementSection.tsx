import { Link } from '@tanstack/react-router'
import { Building2, ChevronRight, MapPin, Users } from 'lucide-react'

import type { PublicVenueListing } from '@/services/venueListingService'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { resolveImageUrl } from '@/lib/imageUtils'

type EventManagementSectionProps = {
  venues: Array<PublicVenueListing>
  loading?: boolean
}

export function EventManagementSection({
  venues,
  loading = false,
}: EventManagementSectionProps) {
  return (
    <section className="bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-paec-orange uppercase">
            <Building2 className="size-3.5" />
            Event Management
          </p>
          <h2 className="text-2xl font-bold text-foreground sm:text-4xl">
            Your event <em className="text-paec-violet not-italic">Venue</em>
          </h2>
          {!loading && venues.length > 0 ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {venues.length} venue{venues.length !== 1 ? 's' : ''} available
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 py-12 text-center sm:py-16">
            <p className="text-muted-foreground">Loading venues…</p>
          </div>
        ) : venues.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {venues.map((venue) => (
              <VenueCard key={venue.uuid} venue={venue} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 px-6 py-10 text-center sm:py-16">
            <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-white text-paec-violet shadow-sm">
              <Building2 className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground sm:text-base">
              Venues are coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function VenueCard({ venue }: { venue: PublicVenueListing }) {
  const image = resolveImageUrl(venue.featured_image_url ?? venue.gallery_image_urls?.[0])
  const location = venue.location || venue.city

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        to="/venues/$slug"
        params={{ slug: venue.slug }}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <ImageWithFallback
            src={image}
            alt={venue.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackClassName="size-full"
          />
          {venue.badge ? (
            <span className="absolute top-2 left-2 rounded-md bg-paec-violet px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase sm:top-3 sm:left-3">
              {venue.badge}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <p className="line-clamp-1 text-[10px] font-bold tracking-wider text-paec-violet uppercase">
            {venue.type || 'Venue'}
          </p>
          <h3 className="line-clamp-2 text-sm leading-snug font-bold text-foreground sm:line-clamp-1 sm:text-base">
            {venue.name}
          </h3>
          {location ? (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs">
              <MapPin className="size-3 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </p>
          ) : null}
          {venue.capacity ? (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs">
              <Users className="size-3 shrink-0" />
              <span className="line-clamp-1">{venue.capacity}</span>
            </p>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            {venue.price_per_event > 0 ? (
              <p className="min-w-0 text-[11px] text-muted-foreground sm:text-xs">
                <span className="block sm:inline">From </span>
                <span className="text-sm font-bold text-foreground sm:text-base">
                  ₱{venue.price_per_event.toLocaleString()}
                </span>
              </p>
            ) : (
              <p className="min-w-0 text-xs font-semibold text-foreground sm:text-sm">
                Price on request
              </p>
            )}
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-paec-orange px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-paec-orange-light sm:px-3.5">
              Inquire
              <ChevronRight className="hidden size-3.5 sm:block" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
