import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { BrowseByCityCard } from '@/components/home/BrowseByCityCard'
import {
  marketplaceService,
  type BrowseByCityLocation,
} from '@/services/marketplaceService'

type BrowseByCitySectionProps = {
  loading?: boolean
}

export function BrowseByCitySection({ loading: parentLoading = false }: BrowseByCitySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [locations, setLocations] = useState<BrowseByCityLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadBrowseByCity() {
      setLoading(true)
      try {
        const data = await marketplaceService.listBrowseByCity()
        if (!cancelled) {
          setLocations(data.locations)
        }
      } catch {
        if (!cancelled) {
          setLocations([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadBrowseByCity()

    return () => {
      cancelled = true
    }
  }, [])

  const scrollCarousel = (direction: 'left' | 'right') => {
    const container = scrollRef.current
    if (!container) return

    const firstCard = container.firstElementChild as HTMLElement | null
    const scrollAmount = firstCard ? firstCard.offsetWidth + 12 : 212

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const isLoading = parentLoading || loading

  if (isLoading) {
    return (
      <section className="bg-[#0f0a1a] py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-400 sm:px-6 lg:px-8">
          Loading locations…
        </div>
      </section>
    )
  }

  if (locations.length === 0) return null

  return (
    <section className="bg-[#0f0a1a] pb-8 pt-2 sm:pb-10 sm:pt-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 max-w-xl">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold tracking-widest text-paec-orange uppercase">
            <MapPin className="size-3.5 fill-paec-orange text-paec-orange" />
            Browse by city
          </p>
          <h2 className="font-serif text-2xl leading-tight font-bold text-white sm:text-3xl lg:text-4xl">
            What&apos;s playing{' '}
            <em className="text-paec-violet not-italic">near you</em>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollCarousel('left')}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-white/30 hover:bg-white/10"
            aria-label="Scroll locations left"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div
            ref={scrollRef}
            className="scrollbar-hide flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {locations.map((location, index) => (
              <BrowseByCityCard key={location.uuid} location={location} index={index} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollCarousel('right')}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-white/30 hover:bg-white/10"
            aria-label="Scroll locations right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
