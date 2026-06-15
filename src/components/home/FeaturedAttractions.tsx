import { Link } from '@tanstack/react-router'
import { ArrowRight, Ticket } from 'lucide-react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'

type FeaturedItem = {
  id: string
  name: string
  price: number
  image: string
}

type FeaturedAttractionsProps = {
  items: FeaturedItem[]
}

export function FeaturedAttractions({ items }: FeaturedAttractionsProps) {
  if (items.length === 0) return null
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
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-paec-orange transition-colors hover:text-paec-orange-light"
          >
            View all
            <ArrowRight className="size-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to="/attractions/$attractionId"
              params={{ attractionId: item.id }}
              className="group flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 p-2 text-left transition-colors hover:border-white/20 hover:bg-white/10"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-md sm:size-14">
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="size-full object-cover"
                  fallbackClassName="size-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[11px] leading-snug font-medium text-white sm:text-xs">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs font-bold text-paec-orange">
                  ₱{item.price.toLocaleString()}
                </p>
              </div>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-paec-violet/80 text-white transition-colors group-hover:bg-paec-violet">
                <Ticket className="size-2.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
