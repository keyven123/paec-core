import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
} from 'lucide-react'
import { useState } from 'react'

import { FeaturedAttractions } from '@/components/home/FeaturedAttractions'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { HeroSlide } from '@/data/mockAttractions'
import { cn } from '@/lib/utils'

type FeaturedItem = {
  id: string
  name: string
  price: number
  image: string
}

type HeroSectionProps = {
  slides: HeroSlide[]
  featuredAttractions: FeaturedItem[]
  loading?: boolean
}

export function HeroSection({
  slides,
  featuredAttractions,
  loading = false,
}: HeroSectionProps) {
  const [slideIndex, setSlideIndex] = useState(0)
  const slide = slides[slideIndex] ?? slides[0]

  const goTo = (index: number) => setSlideIndex(index)
  const prev = () =>
    setSlideIndex((i) => (i === 0 ? slides.length - 1 : i - 1))
  const next = () =>
    setSlideIndex((i) => (i === slides.length - 1 ? 0 : i + 1))

  if (loading || !slide) {
    return (
      <section className="relative bg-[#0f0a1a]">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center text-white/70 sm:px-6 lg:px-8">
          Loading activities…
        </div>
      </section>
    )
  }

  return (
    <section className="relative bg-[#0f0a1a]">
      {/* Background slides */}
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              i === slideIndex ? 'opacity-100' : 'opacity-0',
            )}
          >
            <ImageWithFallback
              src={s.image}
              alt=""
              className="size-full scale-105 object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[#1a0b2e]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0b2e]/95 via-[#1a0b2e]/75 to-[#1a0b2e]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1a] via-transparent to-[#1a0b2e]/40" />
      </div>

      {/* Main hero content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8 lg:pt-16 lg:pb-10">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left — copy */}
          <div className="lg:col-span-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-white/90 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-paec-orange" />
              {slide.badge}
            </div>

            <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              {slide.title}
              <br />
              <span className="text-paec-orange">{slide.highlight}</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              {slide.subtitle}
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
              <MapPin className="size-4 shrink-0 text-paec-orange" />
              {slide.location}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                className="h-12 rounded-xl bg-paec-violet px-7 text-base font-semibold shadow-lg shadow-paec-violet/25 hover:bg-paec-violet-dark"
              >
                <Link
                  to="/attractions/$attractionId"
                  params={{ attractionId: slide.attractionId }}
                >
                  Book Now
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <div className="flex items-baseline gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm">
                <span className="text-sm text-white/60">From</span>
                <span className="text-2xl font-bold text-paec-orange">
                  ₱{slide.priceFrom.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Slide controls */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === slideIndex
                        ? 'w-8 bg-paec-orange'
                        : 'w-1.5 bg-white/30 hover:bg-white/50',
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={prev}
                  className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Next slide"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right — spotlight card */}
          <div className="hidden lg:col-span-5 lg:block">
            <Link
              to="/attractions/$attractionId"
              params={{ attractionId: slide.featuredCard.attractionId }}
              className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/10"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <ImageWithFallback
                  src={slide.featuredCard.image}
                  alt={slide.featuredCard.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-paec-orange px-2.5 py-1 text-[11px] font-semibold text-white">
                  <Star className="size-3 fill-white" />
                  Featured
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  From ₱{slide.priceFrom.toLocaleString()}
                </div>
              </div>
              <div className="border-t border-white/10 p-5">
                <p className="text-[11px] font-semibold tracking-widest text-paec-orange uppercase">
                  {slide.featuredCard.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {slide.featuredCard.name}
                </p>
                <p className="mt-1 text-sm text-white/50">{slide.location}</p>
                <span className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-foreground transition-colors group-hover:bg-white/90">
                  View Details
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <FeaturedAttractions items={featuredAttractions} />
    </section>
  )
}
