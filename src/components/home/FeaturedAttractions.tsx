import { Link } from '@tanstack/react-router'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

import {
  FeaturedAttractionCard,
  type FeaturedAttractionItem,
} from '@/components/home/FeaturedAttractionCard'
import { cn } from '@/lib/utils'

type FeaturedAttractionsProps = {
  items: FeaturedAttractionItem[]
}

export function FeaturedAttractions({ items }: FeaturedAttractionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (items.length === 0) return null

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current
    if (!container) return
    const amount = Math.max(container.clientWidth * 0.75, 200)
    container.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  const showControls = items.length > 1

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md sm:p-3.5">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">
              Featured
            </span>
            <h3 className="text-sm font-semibold text-white">
              Popular Attractions
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {showControls && (
              <div className="hidden items-center gap-1 sm:flex">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  className="flex size-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Previous attractions"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  className="flex size-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Next attractions"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
            <Link
              to="/featured"
              className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-paec-orange transition-colors hover:text-paec-orange-light"
            >
              View all
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className={cn(
              'flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              showControls && 'snap-x snap-mandatory scroll-smooth',
            )}
          >
            {items.map((item) => (
              <FeaturedAttractionCard
                key={item.id}
                item={item}
                className={cn(
                  'w-[calc(100%-0.5rem)] shrink-0 snap-start sm:w-[calc(50%-0.25rem)] lg:w-[calc(25%-0.375rem)]',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
