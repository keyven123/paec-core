import { Tag } from 'lucide-react'

import { AttractionCard } from '@/components/home/AttractionCard'
import type { Attraction } from '@/data/mockAttractions'

type PromotionSectionProps = {
  activities: Attraction[]
  loading?: boolean
}

export function PromotionSection({
  activities,
  loading = false,
}: PromotionSectionProps) {
  return (
    <section className="bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-paec-orange uppercase">
            <Tag className="size-3.5" />
            Promotion
          </p>
          <h2 className="text-2xl font-bold text-foreground sm:text-4xl">
            Discounted{' '}
            <em className="text-paec-violet not-italic">tickets</em>
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}{' '}
            on promo
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 py-12 text-center sm:py-16">
            <p className="text-muted-foreground">Loading promotions…</p>
          </div>
        ) : activities.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {activities.map((attraction) => (
              <AttractionCard key={attraction.id} attraction={attraction} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 px-6 py-10 text-center sm:py-16">
            <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-white text-paec-violet shadow-sm">
              <Tag className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground sm:text-base">
              No discounted tickets right now. Check back soon.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
