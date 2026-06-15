import { ArrowRight, Star } from 'lucide-react'

import { TrendingCard } from '@/components/home/TrendingCard'
import type { TrendingEvent } from '@/data/mockTrending'

type TrendingSectionProps = {
  events: TrendingEvent[]
  loading?: boolean
}

export function TrendingSection({
  events,
  loading = false,
}: TrendingSectionProps) {
  const trendingFeatured = events[0]
  const trendingGrid = events.slice(1, 5)

  if (loading) {
    return (
      <section className="border-t border-violet-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          Loading trending activities…
        </div>
      </section>
    )
  }

  if (!trendingFeatured) return null
  return (
    <section className="border-t border-violet-100 bg-white pt-8 pb-12 sm:pt-10 sm:pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold tracking-widest text-paec-orange uppercase">
              <Star className="size-3.5 fill-paec-orange" />
              Trending now
            </p>
            <h2 className="font-serif text-2xl leading-tight font-bold text-foreground sm:text-3xl lg:text-4xl">
              Hottest tickets{' '}
              <em className="text-paec-violet not-italic">this week</em>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Curated by our editors and updated every hour. These are flying
              off the shelves.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
          >
            View all {events.length} activities
            <ArrowRight className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            {trendingGrid.map((event) => (
              <TrendingCard key={event.id} event={event} variant="compact" />
            ))}
          </div>

          <TrendingCard event={trendingFeatured} variant="featured" />
        </div>
      </div>
    </section>
  )
}
