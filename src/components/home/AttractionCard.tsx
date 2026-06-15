import { Link } from '@tanstack/react-router'
import { ChevronRight, Heart, MapPin } from 'lucide-react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { Attraction } from '@/data/mockAttractions'
import { cn } from '@/lib/utils'

type AttractionCardProps = {
  attraction: Attraction
}

export function AttractionCard({ attraction }: AttractionCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        to="/attractions/$attractionId"
        params={{ attractionId: attraction.id }}
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <ImageWithFallback
            src={attraction.image}
            alt={attraction.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackClassName="size-full"
          />
          {attraction.promo && (
            <span className="absolute top-3 left-3 rounded-md bg-paec-violet px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
              Promo
            </span>
          )}
          <span className="absolute top-3 right-3 rounded-full bg-paec-orange px-2.5 py-1 text-xs font-semibold text-white">
            From ₱{attraction.price.toLocaleString()}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm transition-colors hover:text-paec-violet"
            aria-label="Add to wishlist"
          >
            <Heart className="size-4" />
          </button>
        </div>

        <div className="space-y-2 p-4">
          <p className="text-[10px] font-bold tracking-wider text-paec-violet uppercase">
            Attraction
          </p>
          <h3 className="line-clamp-1 text-base font-bold text-foreground">
            {attraction.name}
          </h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="line-clamp-1">{attraction.location}</span>
          </p>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              {attraction.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ₱{attraction.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="font-bold text-foreground">
                ₱{attraction.price.toLocaleString()}
              </span>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full bg-paec-orange px-3.5 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-paec-orange-light',
              )}
            >
              Book
              <ChevronRight className="size-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
