import { Link } from '@tanstack/react-router'
import { ArrowRight, Heart } from 'lucide-react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { TrendingEvent } from '@/data/mockTrending'
import { cn } from '@/lib/utils'

type TrendingCardProps = {
  event: TrendingEvent
  variant?: 'featured' | 'compact'
}

export function TrendingCard({ event, variant = 'compact' }: TrendingCardProps) {
  const isFeatured = variant === 'featured'

  return (
    <Link
      to="/attractions/$attractionId"
      params={{ attractionId: event.attractionId }}
      className="block h-full"
    >
      <article
        className={cn(
          'group relative h-full overflow-hidden rounded-2xl shadow-lg transition-shadow hover:shadow-xl',
          isFeatured ? 'min-h-[340px] sm:min-h-[380px]' : 'min-h-[180px]',
        )}
      >
        <ImageWithFallback
          src={event.image}
          alt={event.title}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackClassName="absolute inset-0 size-full"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {event.sellingFast && isFeatured && (
                <span className="rounded-full bg-paec-orange px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                  🔥 {event.badge}
                </span>
              )}
              {!event.sellingFast && (
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                  {event.badge === 'FEATURED' && '★ '}
                  {event.badge}
                </span>
              )}
              {isFeatured && (
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                  {event.category}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              aria-label="Add to wishlist"
            >
              <Heart className="size-3.5" />
            </button>
          </div>

          <div className="flex items-end justify-between gap-3">
            <p
              className={cn(
                'font-semibold text-white',
                isFeatured ? 'text-lg' : 'text-sm',
              )}
            >
              From{' '}
              <span className={cn('font-bold', isFeatured && 'text-xl')}>
                ₱{event.price.toLocaleString()}
              </span>
            </p>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full bg-paec-orange font-semibold text-white transition-colors group-hover:bg-paec-orange-light',
                isFeatured ? 'px-5 py-2.5 text-sm' : 'px-3.5 py-1.5 text-xs',
              )}
            >
              {isFeatured ? 'Get Tickets' : 'Tickets'}
              <ArrowRight className={isFeatured ? 'size-4' : 'size-3'} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
