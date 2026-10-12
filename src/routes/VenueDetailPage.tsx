import { Link, useParams } from '@tanstack/react-router'
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  LayoutGrid,
  Mail,
  MapPin,
  Maximize2,
  MessageSquareText,
  Phone,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { PublicVenueDetail } from '@/services/venueListingService'
import { ActivityShowcaseGallery } from '@/components/attraction/ActivityShowcaseGallery'
import { VenueSetupIcon } from '@/components/admin/event-management/VenueSetupIcon'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useSiteContact } from '@/components/layout/useSiteContact'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { VenueInquirySidebar } from '@/components/venue/VenueInquirySidebar'
import {
  getGoogleMapsHref,
  getMailtoHref,
  getPhoneHref,
  openEmailComposer,
} from '@/lib/contactLinks'
import { resolveImageUrl } from '@/lib/imageUtils'
import { cn } from '@/lib/utils'
import { venueListingService } from '@/services/venueListingService'

const ABOUT_PREVIEW_LENGTH = 420

export function VenueDetailPage() {
  const { slug } = useParams({ from: '/venues/$slug' })
  const [venue, setVenue] = useState<PublicVenueDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFullAbout, setShowFullAbout] = useState(false)
  const contact = useSiteContact()
  const inquiryRef = useRef<HTMLDivElement>(null)
  const [inquiryVisible, setInquiryVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    venueListingService
      .getPublic(slug)
      .then((detail) => {
        if (!cancelled) setVenue(detail)
      })
      .catch(() => {
        if (!cancelled) setVenue(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    const node = inquiryRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setInquiryVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -35% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [venue, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading venue…</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Venue not found</h1>
          <p className="mt-2 text-muted-foreground">
            This venue may no longer be available for inquiries.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1 text-paec-violet hover:underline"
          >
            Back to home
            <ChevronRight className="size-4" />
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const { listing } = venue
  const photos = [venue.featured_image_url, ...venue.gallery_image_urls]
    .filter((url): url is string => Boolean(url))
    .map(resolveImageUrl)
  const [heroImage = '', ...galleryImages] = photos
  const city = [listing.city, venue.region].filter(Boolean).join(', ')
  const fullAddress = [venue.address, city].filter(Boolean).join(', ')
  const startingPrice = listing.price_per_event
  const capacityLabel =
    venue.min_capacity && venue.max_capacity
      ? `${venue.min_capacity.toLocaleString()}–${venue.max_capacity.toLocaleString()} guests`
      : listing.capacity
  const about = venue.about?.trim() ?? ''
  const aboutPreview =
    about.length > ABOUT_PREVIEW_LENGTH && !showFullAbout
      ? `${about.slice(0, ABOUT_PREVIEW_LENGTH).trimEnd()}…`
      : about
  const emailSubject = `Venue inquiry: ${listing.name}`

  const highlights: Array<{ icon: LucideIcon; label: string; value: string }> = [
    capacityLabel ? { icon: Users, label: 'Capacity', value: capacityLabel } : null,
    listing.area ? { icon: Maximize2, label: 'Floor area', value: listing.area } : null,
    venue.setups.length > 0
      ? {
          icon: LayoutGrid,
          label: 'Layouts',
          value: `${venue.setups.length} setup${venue.setups.length !== 1 ? 's' : ''}`,
        }
      : null,
    venue.responds_in ? { icon: Clock, label: 'Response time', value: venue.responds_in } : null,
  ].filter((item): item is { icon: LucideIcon; label: string; value: string } => item !== null)

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: listing.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard.')
    } catch {
      // The user closed the share sheet.
    }
  }

  const scrollToInquiry = () =>
    inquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <nav className="mb-4 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground sm:mb-6">
          <Link to="/" className="shrink-0 transition-colors hover:text-paec-violet">
            Home
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="shrink-0">Venues</span>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="truncate font-medium text-foreground">{listing.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
          <div className="order-1 flex min-w-0 flex-col">
            <div className="mb-3 flex flex-wrap gap-2 sm:mb-4">
              {listing.type ? (
                <span className="rounded-full bg-paec-violet px-3 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                  {listing.type}
                </span>
              ) : null}
              {startingPrice > 0 ? (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold tracking-wide text-paec-orange uppercase">
                  From ₱{startingPrice.toLocaleString()}
                </span>
              ) : null}
              {venue.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                  <BadgeCheck className="size-3" />
                  Verified venue
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              {listing.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:mt-4">
              {fullAddress ? (
                <a
                  href={getGoogleMapsHref(fullAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-center gap-1.5 underline-offset-4 transition-colors hover:text-paec-violet hover:underline"
                  title="Open in Google Maps"
                >
                  <MapPin className="size-4 shrink-0 text-paec-violet" />
                  <span>{fullAddress}</span>
                </a>
              ) : null}
              {contact.contact_phone ? (
                <a
                  href={getPhoneHref(contact.contact_phone)}
                  className="inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:text-paec-violet hover:underline"
                  title="Call us"
                >
                  <Phone className="size-4 shrink-0 text-paec-violet" />
                  {contact.contact_phone}
                </a>
              ) : null}
              {contact.contact_email ? (
                <a
                  href={getMailtoHref(contact.contact_email, emailSubject)}
                  onClick={(event) =>
                    openEmailComposer(event, contact.contact_email, emailSubject)
                  }
                  className="inline-flex min-w-0 items-center gap-1.5 underline-offset-4 transition-colors hover:text-paec-violet hover:underline"
                  title="Send us an email"
                >
                  <Mail className="size-4 shrink-0 text-paec-violet" />
                  <span className="truncate">{contact.contact_email}</span>
                </a>
              ) : null}
            </div>

            <div className="relative order-first -mx-4 mb-5 overflow-hidden sm:mx-0 sm:rounded-2xl lg:order-none lg:mt-6 lg:mb-0">
              <ImageWithFallback
                src={heroImage}
                alt={listing.name}
                className="aspect-[16/9] w-full object-cover"
                fallbackClassName="aspect-[16/9] w-full"
              />
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="flex size-10 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm transition-colors hover:text-paec-violet"
                  aria-label="Share"
                >
                  <Share2 className="size-4" />
                </button>
              </div>
              {photos.length > 1 ? (
                <span className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {photos.length} photos
                </span>
              ) : null}
            </div>

            {highlights.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {highlights.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-paec-violet shadow-sm">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {label}
                      </p>
                      <p className="text-sm leading-snug font-semibold break-words text-foreground">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <ActivityShowcaseGallery
              images={galleryImages}
              activityName={listing.name}
              title="Venue gallery"
              subtitle="Take a closer look at the space"
              className="mt-8"
            />

            {about ? (
              <DetailSection title="About this venue">
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground sm:text-base">
                  {aboutPreview}
                </p>
                {about.length > ABOUT_PREVIEW_LENGTH ? (
                  <button
                    type="button"
                    onClick={() => setShowFullAbout((value) => !value)}
                    className="mt-2 inline-flex items-center gap-0.5 text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
                  >
                    {showFullAbout ? 'Show less' : 'Read more'}
                    <ChevronDown
                      className={cn('size-4 transition-transform', showFullAbout && 'rotate-180')}
                    />
                  </button>
                ) : null}
              </DetailSection>
            ) : null}

            {venue.min_capacity || venue.max_capacity ? (
              <DetailSection title="Capacity" subtitle="How many guests this venue can host">
                <div className="grid gap-3 sm:grid-cols-2">
                  {venue.min_capacity ? (
                    <CapacityCard
                      label="Minimum"
                      value={venue.min_capacity}
                      note={venue.min_capacity_note}
                    />
                  ) : null}
                  {venue.max_capacity ? (
                    <CapacityCard
                      label="Maximum"
                      value={venue.max_capacity}
                      note={venue.max_capacity_note}
                    />
                  ) : null}
                </div>
              </DetailSection>
            ) : null}

            {venue.setups.length > 0 ? (
              <DetailSection
                title="Table arrangements & setups"
                subtitle="Layouts available at this venue and their maximum capacity"
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {venue.setups.map((setup) => (
                    <div
                      key={setup.id}
                      className="flex flex-col items-center rounded-xl border border-violet-100 bg-white px-3 py-4 text-center"
                    >
                      <VenueSetupIcon setupId={setup.id} className="h-12 w-16" />
                      <p className="mt-2 text-sm font-semibold text-foreground">{setup.label}</p>
                      <p className="text-xs text-muted-foreground">
                        up to {setup.capacity.toLocaleString()} pax
                      </p>
                    </div>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            {venue.packages.length > 0 ? (
              <DetailSection
                title="Packages"
                subtitle="Indicative rates. The final quote depends on your date and requirements."
              >
                <div className="space-y-3">
                  {venue.packages.map((pkg) => {
                    const isDefault = pkg.id === venue.default_package_id
                    return (
                      <div
                        key={pkg.id}
                        className={cn(
                          'flex flex-col gap-3 rounded-xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between',
                          isDefault ? 'border-paec-violet/40 bg-violet-50/50' : 'border-violet-100',
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{pkg.label}</p>
                            {isDefault ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-paec-violet px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                                <Sparkles className="size-3" />
                                Recommended
                              </span>
                            ) : null}
                          </div>
                          {pkg.time_label ? (
                            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Clock className="size-3.5 shrink-0" />
                              {pkg.time_label}
                            </p>
                          ) : null}
                          {pkg.note ? (
                            <p className="mt-1 text-xs text-muted-foreground">{pkg.note}</p>
                          ) : null}
                        </div>
                        <div className="shrink-0 sm:text-right">
                          {pkg.priceFrom > 0 ? (
                            <>
                              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                From
                              </p>
                              <p className="text-lg font-bold text-paec-violet">
                                ₱{pkg.priceFrom.toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-foreground">Price on request</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </DetailSection>
            ) : null}

            {venue.specs.length > 0 ? (
              <DetailSection title="Venue specifications">
                <dl className="grid gap-3 sm:grid-cols-2">
                  {venue.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex items-center justify-between gap-4 rounded-xl border border-violet-100 px-4 py-3"
                    >
                      <dt className="text-sm text-muted-foreground">{spec.label}</dt>
                      <dd className="text-right text-sm font-semibold text-foreground">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </DetailSection>
            ) : null}

            {venue.best_for.length > 0 ? (
              <DetailSection title="Best for">
                <div className="flex flex-wrap gap-2">
                  {venue.best_for.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-medium text-paec-violet"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            {venue.amenities.length > 0 ? (
              <DetailSection title="Amenities">
                <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {venue.amenities.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Check className="size-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </DetailSection>
            ) : null}
          </div>

          <div
            ref={inquiryRef}
            id="inquire"
            className="order-2 min-w-0 scroll-mt-32 self-start lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2"
          >
            <VenueInquirySidebar
              slug={venue.slug}
              venueName={listing.name}
              startingPrice={startingPrice}
              maxCapacity={venue.max_capacity}
              respondsIn={venue.responds_in}
            />
          </div>
        </div>
      </main>

      <Footer />
      <div className="h-20 bg-[#0b1120] lg:hidden" aria-hidden />

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(76,29,149,0.25)] backdrop-blur-md transition-transform duration-300 lg:hidden',
          inquiryVisible && 'translate-y-full',
        )}
        aria-hidden={inquiryVisible}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {startingPrice > 0 ? 'From / event' : 'Pricing'}
            </p>
            <p className="text-xl leading-tight font-bold text-foreground">
              {startingPrice > 0 ? `₱${startingPrice.toLocaleString()}` : 'On request'}
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToInquiry}
            tabIndex={inquiryVisible ? -1 : 0}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-paec-orange px-6 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-colors hover:bg-paec-orange-light"
          >
            <MessageSquareText className="size-4" />
            Send Inquire
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="mt-8 border-t border-violet-100 pt-8">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function CapacityCard({
  label,
  value,
  note,
}: {
  label: string
  value: number
  note: string | null
}) {
  const description = note?.replace(/^guests\s*·\s*/i, '').trim()
  return (
    <div className="rounded-xl border border-violet-100 px-4 py-3.5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold text-foreground">
        {value.toLocaleString()}
        <span className="ml-1 text-sm font-medium text-muted-foreground">guests</span>
      </p>
      {description ? (
        <p className="mt-0.5 text-xs text-muted-foreground first-letter:uppercase">{description}</p>
      ) : null}
    </div>
  )
}
