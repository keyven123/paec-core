import { Link, useParams } from '@tanstack/react-router'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Share2,
  Star,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { BookingSidebar } from '@/components/attraction/BookingSidebar'
import { RelatedAttractions } from '@/components/attraction/RelatedAttractions'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { Attraction, AttractionLocation } from '@/data/mockAttractions'
import { cn } from '@/lib/utils'
import { marketplaceService } from '@/services/marketplaceService'

export function AttractionDetailPage() {
  const { attractionId } = useParams({ from: '/attractions/$attractionId' })
  const [attraction, setAttraction] = useState<Attraction | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<AttractionLocation | null>(
    null,
  )
  const [related, setRelated] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [showFull, setShowFull] = useState(false)

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
          detail
            ? all.filter((item) => item.id !== detail.id).slice(0, 4)
            : [],
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

  const truncated =
    attraction.description.length > 220 && !showFull
      ? `${attraction.description.slice(0, 220)}...`
      : attraction.description

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-paec-violet">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-foreground">{attraction.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          <div className="order-1">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-paec-violet px-3 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                {attraction.categoryLabel}
              </span>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold tracking-wide text-paec-orange uppercase">
                From ₱{attraction.price.toLocaleString()}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {attraction.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0 text-paec-violet" />
                {selectedLocation?.label ?? attraction.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 shrink-0 text-paec-violet" />
                {attraction.hours}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <Zap className="size-3" />
                {attraction.intensity}
              </span>
            </div>

            <div className="relative mt-6 overflow-hidden rounded-2xl">
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

            <section className="mt-8">
              <h2 className="text-xl font-bold text-foreground">
                About this event
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
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

          <div className="order-2 self-start lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2">
            <BookingSidebar
              attraction={attraction}
              onLocationChange={setSelectedLocation}
            />
          </div>

          <div className="order-3 lg:col-start-1">
            <RelatedAttractions attractions={related} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
