import { Link, useParams } from '@tanstack/react-router'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Heart,
  Mail,
  MapPin,
  Phone,
  Share2,
  Star,
  Ticket,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Attraction, AttractionLocation } from '@/data/mockAttractions'
import { BookingSidebar } from '@/components/attraction/BookingSidebar'
import { ActivityShowcaseGallery } from '@/components/attraction/ActivityShowcaseGallery'
import { RelatedAttractions } from '@/components/attraction/RelatedAttractions'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useSiteContact } from '@/components/layout/useSiteContact'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import {
  getGoogleMapsHref,
  getMailtoHref,
  getPhoneHref,
  openEmailComposer,
} from '@/lib/contactLinks'
import { persistAffiliateRefFromUrl } from '@/lib/affiliateRef'
import { cn } from '@/lib/utils'
import { affiliatePublicService } from '@/services/affiliatePublicService'
import { marketplaceService } from '@/services/marketplaceService'

export function AttractionDetailPage() {
  const { attractionId } = useParams({ from: '/attractions/$attractionId' })
  const [attraction, setAttraction] = useState<Attraction | null>(null)
  const [selectedLocation, setSelectedLocation] =
    useState<AttractionLocation | null>(null)
  const [related, setRelated] = useState<Array<Attraction>>([])
  const [loading, setLoading] = useState(true)
  const [showFull, setShowFull] = useState(false)
  const contact = useSiteContact()
  const bookingRef = useRef<HTMLDivElement>(null)
  const [bookingVisible, setBookingVisible] = useState(false)

  useEffect(() => {
    const node = bookingRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => setBookingVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -35% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [attraction, loading])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [detail, all] = await Promise.all([
          marketplaceService.getActivity(attractionId),
          marketplaceService.listActivities(),
        ])
        if (cancelled) return
        setAttraction(detail)
        setRelated(
          detail ? all.filter((item) => item.id !== detail.id).slice(0, 4) : [],
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [attractionId])

  // Affiliate referral: remember the code for this activity and count the click once per visit.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')?.trim()
    if (!ref) return
    persistAffiliateRefFromUrl(ref, attractionId)
    void affiliatePublicService.trackClick(
      ref,
      `/attractions/${attractionId}`,
    )
  }, [attractionId])

  // Also key the stored code by the activity's uuid/id so checkout can find it either way.
  useEffect(() => {
    if (!attraction) return
    const ref = new URLSearchParams(window.location.search).get('ref')?.trim()
    if (!ref) return
    persistAffiliateRefFromUrl(ref, attraction.eventUuid)
    persistAffiliateRefFromUrl(ref, attraction.id)
  }, [attraction])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading activity…</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!attraction) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Attraction not found</h1>
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

  const locationLabel = selectedLocation?.label ?? attraction.location
  const mapsQuery = selectedLocation?.address || locationLabel
  const contactEmail = attraction.contactEmail?.trim() || contact.contact_email
  const contactPhone =
    attraction.contactNumber?.trim() ||
    (contact.contact_phone ? contact.contact_phone.trim() : '')
  const emailSubject = `Inquiry: ${attraction.name}`

  const ticketPrices = attraction.ticketTypes
    .map((ticket) => ticket.price)
    .filter((price) => price > 0)
  const startingPrice =
    attraction.price > 0
      ? attraction.price
      : ticketPrices.length > 0
        ? Math.min(...ticketPrices)
        : 0

  const truncated =
    attraction.description.length > 220 && !showFull
      ? `${attraction.description.slice(0, 220)}...`
      : attraction.description

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <nav className="mb-4 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground sm:mb-6">
          <Link
            to="/"
            className="shrink-0 transition-colors hover:text-paec-violet"
          >
            Home
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="truncate font-medium text-foreground">
            {attraction.name}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          <div className="order-1 flex min-w-0 flex-col">
            <div className="mb-3 flex flex-wrap gap-2 sm:mb-4">
              <span className="rounded-full bg-paec-violet px-3 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                {attraction.categoryLabel}
              </span>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold tracking-wide text-paec-orange uppercase">
                From ₱{startingPrice.toLocaleString()}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              {attraction.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:mt-4">
              <a
                href={getGoogleMapsHref(mapsQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:text-paec-violet hover:underline"
                title="Open in Google Maps"
              >
                <MapPin className="size-4 shrink-0 text-paec-violet" />
                {locationLabel}
              </a>
              {contactPhone ? (
                <a
                  href={getPhoneHref(contactPhone)}
                  className="inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:text-paec-violet hover:underline"
                  title="Call us"
                >
                  <Phone className="size-4 shrink-0 text-paec-violet" />
                  {contactPhone}
                </a>
              ) : null}
              {contactEmail ? (
                <a
                  href={getMailtoHref(contactEmail, emailSubject)}
                  onClick={(event) =>
                    openEmailComposer(event, contactEmail, emailSubject)
                  }
                  className="inline-flex min-w-0 items-center gap-1.5 underline-offset-4 transition-colors hover:text-paec-violet hover:underline"
                  title="Send us an email"
                >
                  <Mail className="size-4 shrink-0 text-paec-violet" />
                  <span className="truncate">{contactEmail}</span>
                </a>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 shrink-0 text-paec-violet" />
                {attraction.hours}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <Zap className="size-3" />
                {attraction.intensity}
              </span>
            </div>

            <div className="relative order-first -mx-4 mb-5 overflow-hidden sm:mx-0 sm:rounded-2xl lg:order-none lg:mt-6 lg:mb-0">
              <ImageWithFallback
                src={attraction.image}
                alt={attraction.name}
                className="aspect-[16/9] w-full object-cover"
                fallbackClassName="aspect-[16/9] w-full"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm transition-colors hover:text-paec-violet"
                  aria-label="Add to wishlist"
                >
                  <Heart className="size-4" />
                </button>
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm transition-colors hover:text-paec-violet"
                  aria-label="Share"
                >
                  <Share2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'size-4',
                      i < Math.floor(attraction.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-violet-100',
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {attraction.rating}
              </span>
              <span className="text-sm text-muted-foreground">
                ({attraction.reviewCount}+ reviews)
              </span>
            </div>

            <ActivityShowcaseGallery
              images={attraction.showcaseImages ?? []}
              activityName={attraction.name}
            />

            <section className="mt-8">
              <h2 className="text-xl font-bold text-foreground">
                About this event
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
                {truncated}
              </p>
              {attraction.description.length > 220 && (
                <button
                  type="button"
                  onClick={() => setShowFull((v) => !v)}
                  className="mt-2 inline-flex items-center gap-0.5 text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
                >
                  {showFull ? 'Show less' : 'Show full'}
                  <ChevronDown
                    className={cn(
                      'size-4 transition-transform',
                      showFull && 'rotate-180',
                    )}
                  />
                </button>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {attraction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-medium text-paec-violet"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div
            ref={bookingRef}
            id="booking"
            className="order-2 min-w-0 scroll-mt-32 self-start lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2"
          >
            <BookingSidebar
              attraction={attraction}
              onLocationChange={setSelectedLocation}
            />
          </div>

          <div className="order-3 min-w-0 lg:col-start-1">
            <RelatedAttractions attractions={related} />
          </div>
        </div>
      </main>

      <Footer />
      <div className="h-20 bg-[#0b1120] lg:hidden" aria-hidden />

      <MobileBookingBar
        price={startingPrice}
        hidden={bookingVisible}
        onSelect={() =>
          bookingRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      />
    </div>
  )
}

type MobileBookingBarProps = {
  price: number
  hidden: boolean
  onSelect: () => void
}

function MobileBookingBar({ price, hidden, onSelect }: MobileBookingBarProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(76,29,149,0.25)] backdrop-blur-md transition-transform duration-300 lg:hidden',
        hidden && 'translate-y-full',
      )}
      aria-hidden={hidden}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            From
          </p>
          <p className="text-xl leading-tight font-bold text-foreground">
            ₱{price.toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={onSelect}
          tabIndex={hidden ? -1 : 0}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-paec-orange px-6 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-colors hover:bg-paec-orange-light"
        >
          <Ticket className="size-4" />
          Select Tickets
        </button>
      </div>
    </div>
  )
}
