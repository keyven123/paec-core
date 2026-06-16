import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, MapPin, Star, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { FeaturedAttractionItem } from '@/components/home/FeaturedAttractionCard'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { Attraction } from '@/data/mockAttractions'
import { marketplaceService } from '@/services/marketplaceService'

function toFeaturedItem(activity: Attraction): FeaturedAttractionItem {
  return {
    id: activity.id,
    name: activity.name,
    price: activity.price,
    image: activity.image,
    location: activity.location,
  }
}

export function FeaturedActivitiesPage() {
  const [activities, setActivities] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const featured = await marketplaceService.listFeaturedActivities(100)
        if (!cancelled) setActivities(featured)
      } catch {
        if (!cancelled) setActivities([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(() => activities.map(toFeaturedItem), [activities])

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative overflow-hidden bg-[#0f0a1a]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e]/90 via-[#1a0b2e]/70 to-[#0f0a1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(124,58,237,0.15),_transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to marketplace
          </Link>

          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-paec-orange uppercase">
              <Star className="size-3.5 fill-paec-orange" />
              Featured
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Popular{' '}
              <span className="text-paec-orange">Attractions</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg">
              Hand-picked experiences curated by our team. Book tickets for the
              best activities and attractions across the Philippines.
            </p>
            {!loading && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                <Ticket className="size-4 text-paec-violet" />
                {items.length} featured{' '}
                {items.length === 1 ? 'activity' : 'activities'}
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading featured activities…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/40 px-6 py-16 text-center">
            <Star className="mx-auto mb-3 size-10 text-paec-violet/40" />
            <h2 className="text-lg font-semibold text-foreground">
              No featured activities yet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon for curated picks from our team.
            </p>
            <Button asChild className="mt-6 bg-paec-violet hover:bg-paec-violet-dark">
              <Link to="/">Browse all activities</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <Link
                key={item.id}
                to="/attractions/$attractionId"
                params={{ attractionId: item.id }}
                className="group overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition-all hover:border-paec-violet/30 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-paec-orange px-2.5 py-1 text-[11px] font-semibold text-white">
                    <Star className="size-3 fill-white" />
                    #{index + 1} Featured
                  </span>
                  <span className="absolute top-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    From ₱{item.price.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2 p-4 sm:p-5">
                  <p className="text-[10px] font-bold tracking-widest text-paec-violet uppercase">
                    Featured Activity
                  </p>
                  <h2 className="line-clamp-2 text-lg font-bold text-foreground">
                    {item.name}
                  </h2>
                  {item.location && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-paec-orange" />
                      <span className="line-clamp-1">{item.location}</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-bold text-paec-orange">
                      ₱{item.price.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-paec-violet px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-paec-violet-dark">
                      View Details
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
