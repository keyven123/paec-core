import { Link } from '@tanstack/react-router'
import { ChevronRight, Heart, MapPin } from 'lucide-react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { Attraction } from '@/data/mockAttractions'
import {
  discountOffLabel,
  formatPesoValue as formatPrice,
} from '@/lib/discountLabel'
import { cn } from '@/lib/utils'

type AttractionCardProps = {
  attraction: Attraction
  className?: string
}

export function AttractionCard({ attraction, className }: AttractionCardProps) {
  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <Link
        to="/attractions/$attractionId"
        params={{ attractionId: attraction.id }}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <ImageWithFallback
            src={attraction.image}
            alt={attraction.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackClassName="size-full"
          />
          {attraction.discountPercent ? (
            <span className="absolute top-2 left-2 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase shadow-sm sm:top-3 sm:left-3 sm:text-[11px]">
              {discountOffLabel(attraction)}
            </span>
          ) : attraction.promo ? (
            <span className="absolute top-2 left-2 rounded-md bg-paec-violet px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase sm:top-3 sm:left-3">
              Promo
            </span>
          ) : null}
          <span className="absolute top-3 right-3 hidden rounded-full bg-paec-orange px-2.5 py-1 text-xs font-semibold text-white sm:inline-flex">
            From ₱{formatPrice(attraction.price)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm transition-colors hover:text-paec-violet sm:right-3 sm:bottom-3 sm:size-8"
            aria-label="Add to wishlist"
          >
            <Heart className="size-3.5 sm:size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <p className="text-[10px] font-bold tracking-wider text-paec-violet uppercase">
            Attraction
          </p>
          <h3 className="line-clamp-2 text-sm leading-snug font-bold text-foreground sm:line-clamp-1 sm:text-base">
            {attraction.name}
          </h3>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs">
            <MapPin className="size-3 shrink-0" />
            <span className="line-clamp-1">{attraction.location}</span>
          </p>

          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <div className="min-w-0">
              <span className="block text-[10px] text-muted-foreground sm:hidden">
                From
              </span>
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                {attraction.originalPrice && (
                  <span className="text-[11px] text-muted-foreground line-through sm:text-xs">
                    ₱{formatPrice(attraction.originalPrice)}
                  </span>
                )}
                <span className="text-sm font-bold text-foreground sm:text-base">
                  ₱{formatPrice(attraction.price)}
                </span>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-paec-orange px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-paec-orange-light sm:px-3.5">
              Book
              <ChevronRight className="hidden size-3.5 sm:block" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
