import { Link } from '@tanstack/react-router'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { BrowseByCityLocation } from '@/services/marketplaceService'
import { cn } from '@/lib/utils'

const CARD_GRADIENTS = [
  'from-teal-900/90 via-cyan-900/80 to-blue-950/90',
  'from-violet-900/90 via-purple-900/80 to-fuchsia-950/90',
  'from-indigo-900/90 via-violet-900/80 to-purple-950/90',
  'from-emerald-900/90 via-teal-900/80 to-cyan-950/90',
  'from-rose-900/90 via-fuchsia-900/80 to-violet-950/90',
  'from-sky-900/90 via-indigo-900/80 to-violet-950/90',
] as const

type BrowseByCityCardProps = {
  location: BrowseByCityLocation
  index: number
}

export function BrowseByCityCard({ location, index }: BrowseByCityCardProps) {
  const attractionId = location.event_slug ?? location.event_uuid
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  const addressLine = [location.address, location.city].filter(Boolean).join(', ')

  return (
    <Link
      to="/attractions/$attractionId"
      params={{ attractionId }}
      className="group block h-full w-[200px] shrink-0 snap-start sm:w-[220px]"
    >
      <article
        className={cn(
          'relative flex h-full min-h-[160px] flex-col justify-end overflow-hidden rounded-xl border border-white/10 p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[170px]',
        )}
      >
        {location.image ? (
          <>
            <ImageWithFallback
              src={location.image}
              alt={location.label}
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
              fallbackClassName="absolute inset-0 size-full"
            />
            <div className={cn('absolute inset-0 bg-gradient-to-t', gradient)} />
          </>
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)} />
        )}

        <div className="relative space-y-1.5">
          <p className="text-[10px] font-bold tracking-widest text-paec-orange uppercase">
            {location.city}
          </p>
          <h3 className="font-serif text-base leading-tight font-bold text-white sm:text-lg">
            {location.label}
          </h3>
          {addressLine && (
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">
              {addressLine}
            </p>
          )}
          {location.event_name && location.label !== location.event_name && (
            <p className="line-clamp-1 text-[11px] text-slate-400">{location.event_name}</p>
          )}
        </div>
      </article>
    </Link>
  )
}
