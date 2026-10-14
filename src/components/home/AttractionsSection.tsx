import { Sparkles, Star, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { Attraction } from '@/data/mockAttractions'
import { AttractionCard } from '@/components/home/AttractionCard'
import { ALL_CATEGORIES } from '@/lib/activityCategories'
import { cn } from '@/lib/utils'

type AttractionsSectionProps = {
  activeCategory: string
  activities: Array<Attraction>
  loading?: boolean
}

type FilterTab = 'all' | 'promo' | 'new'

export function AttractionsSection({
  activeCategory,
  activities,
  loading = false,
}: AttractionsSectionProps) {
  const [filter, setFilter] = useState<FilterTab>('all')

  const filtered = useMemo(() => {
    let list = activities

    if (activeCategory !== ALL_CATEGORIES) {
      list = list.filter((a) => a.category === activeCategory)
    }

    if (filter === 'promo') {
      list = list.filter((a) => a.promo)
    }

    if (filter === 'new') {
      list = list.slice(0, 4)
    }

    return list
  }, [activeCategory, filter, activities])

  return (
    <section className="bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-paec-orange uppercase">
              <Sparkles className="size-3.5" />
              Attractions
            </p>
            <h2 className="text-2xl font-bold text-foreground sm:text-4xl">
              Explore exciting{' '}
              <em className="text-paec-violet not-italic">activities</em>
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {filtered.length} experience{filtered.length !== 1 ? 's' : ''}{' '}
              available
            </p>
          </div>

          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <button
              type="button"
              onClick={() => setFilter('promo')}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                filter === 'promo'
                  ? 'border-paec-violet bg-paec-violet text-white'
                  : 'border-violet-100 bg-white text-foreground hover:bg-violet-50',
              )}
            >
              <Tag className="size-3.5" />
              Promo
              <span className="rounded bg-paec-orange px-1.5 py-0.5 text-[10px] font-bold text-white">
                DEALS
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('new')}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                filter === 'new'
                  ? 'border-paec-violet bg-paec-violet text-white'
                  : 'border-violet-100 bg-white text-foreground hover:bg-violet-50',
              )}
            >
              <Sparkles className="size-3.5" />
              New
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                filter === 'all'
                  ? 'bg-paec-violet text-white shadow-md'
                  : 'border border-violet-100 bg-white text-foreground hover:bg-violet-50',
              )}
            >
              <Star className="size-3.5" />
              All Activities
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 py-16 text-center">
            <p className="text-muted-foreground">Loading activities…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((attraction) => (
              <AttractionCard key={attraction.id} attraction={attraction} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 py-16 text-center">
            <p className="text-muted-foreground">
              No attractions found in this category.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
