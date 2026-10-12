import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Star,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { HeroSlide } from '@/data/mockAttractions'
import type { DiscountInfo } from '@/lib/discountLabel'

import { useSiteContact } from '@/components/layout/useSiteContact'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { getGoogleMapsHref, getPhoneHref } from '@/lib/contactLinks'
import {
  discountValueLabel,
  formatPesoValue as formatPrice,
  isAmountDiscount,
} from '@/lib/discountLabel'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 7000
const UP_NEXT_COUNT = 3

function SaleSticker({
  info,
  size,
  className,
}: {
  info: DiscountInfo
  size: 'sm' | 'lg'
  className?: string
}) {
  const amount = isAmountDiscount(info)
  const value = discountValueLabel(info)
  const large = size === 'lg'
  const valueSize = large
    ? value.length <= 3
      ? 'text-5xl xl:text-6xl'
      : value.length <= 5
        ? 'text-4xl xl:text-5xl'
        : 'text-3xl xl:text-4xl'
    : value.length <= 3
      ? 'text-3xl'
      : value.length <= 5
        ? 'text-2xl'
        : 'text-lg'

  return (
    <div
      className={cn(
        'pointer-events-none relative flex rotate-12 animate-in flex-col items-center justify-center rounded-full bg-gradient-to-br shadow-2xl duration-500 zoom-in-50',
        amount
          ? 'from-amber-200 via-yellow-400 to-amber-500 text-red-700 shadow-amber-950/50'
          : 'from-red-500 via-red-600 to-paec-orange text-white shadow-red-950/50',
        large
          ? 'size-36 ring-4 ring-white/15 xl:size-40'
          : 'size-[88px] ring-2 ring-white/20',
        className,
      )}
      aria-hidden
    >
      <span
        className={cn(
          'absolute rounded-full border-dashed',
          large ? 'inset-2 border-2' : 'inset-1.5 border',
          amount ? 'border-red-700/35' : 'border-white/35',
        )}
      />
      <span
        className={cn(
          'font-bold uppercase',
          large
            ? 'text-[11px] tracking-[0.2em]'
            : 'text-[8px] tracking-[0.15em]',
        )}
      >
        {amount ? 'Save up to' : 'Up to'}
      </span>
      <span className={cn('leading-none font-black tracking-tight', valueSize)}>
        {value}
      </span>
      <span
        className={cn(
          'font-extrabold uppercase',
          large ? 'text-sm tracking-[0.3em]' : 'text-[10px] tracking-[0.25em]',
        )}
      >
        Off
      </span>
    </div>
  )
}

type HeroSectionProps = {
  slides: Array<HeroSlide>
  loading?: boolean
}

export function HeroSection({ slides, loading = false }: HeroSectionProps) {
  const [slideIndex, setSlideIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const slide = slides.at(slideIndex) ?? slides.at(0)
  const contact = useSiteContact()

  useEffect(() => {
    if (slideIndex >= slides.length) {
      setSlideIndex(0)
    }
  }, [slideIndex, slides.length])

  useEffect(() => {
    if (paused || slides.length < 2) return
    const timer = window.setTimeout(() => {
      setSlideIndex((i) => (i + 1) % slides.length)
    }, AUTOPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [paused, slideIndex, slides.length])

  const goTo = (index: number) => setSlideIndex(index)
  const prev = () => setSlideIndex((i) => (i === 0 ? slides.length - 1 : i - 1))
  const next = () => setSlideIndex((i) => (i === slides.length - 1 ? 0 : i + 1))

  if (loading || !slide) {
    return (
      <section className="relative bg-[#0f0a1a]">
        <div className="mx-auto flex min-h-[420px] max-w-7xl items-center justify-center px-4 text-white/70 sm:px-6 lg:min-h-[540px] lg:px-8">
          Loading activities…
        </div>
      </section>
    )
  }

  const discountPercent = slide.discountPercent ?? 0
  const savings = slide.originalPrice
    ? slide.originalPrice - slide.priceFrom
    : 0

  const upNext = Array.from(
    { length: Math.min(UP_NEXT_COUNT, slides.length - 1) },
    (_value, offset) => (slideIndex + offset + 1) % slides.length,
  )

  return (
    <section
      className="relative isolate overflow-hidden bg-[#0f0a1a]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Background banner image */}
      <div className="absolute inset-0 -z-10">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              i === slideIndex ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={i !== slideIndex}
          >
            <ImageWithFallback
              src={s.image}
              alt=""
              className={cn(
                'size-full object-cover object-center transition-transform ease-out',
                i === slideIndex
                  ? 'scale-100 duration-[8000ms]'
                  : 'scale-110 duration-0',
              )}
            />
          </div>
        ))}
        {/* Keep the copy legible on the left while the photo stays visible on the right. */}
        <div className="absolute inset-0 bg-[#0f0a1a]/55 lg:bg-transparent" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#0f0a1a]/95 via-[#0f0a1a]/65 to-[#0f0a1a]/5 lg:block" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0f0a1a] via-[#0f0a1a]/60 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[460px] max-w-7xl flex-col justify-center px-4 pt-14 pb-10 sm:min-h-[500px] sm:px-6 lg:min-h-[560px] lg:px-8 lg:pt-16 lg:pb-12">
        {discountPercent ? (
          <SaleSticker
            key={`sale-${slide.id}`}
            info={slide}
            size="lg"
            className="absolute top-14 right-8 hidden lg:flex"
          />
        ) : null}

        <div
          key={slide.id}
          className="max-w-2xl animate-in duration-700 fade-in slide-in-from-bottom-2"
        >
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
              <Star className="size-3.5 fill-paec-orange text-paec-orange" />
              {slide.badge}
            </div>
            {discountPercent ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-paec-orange px-3.5 py-1.5 text-xs font-bold tracking-wide text-white uppercase shadow-lg shadow-red-950/40">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/80" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                {isAmountDiscount(slide)
                  ? `Sale · Save ${discountValueLabel(slide)} on tickets`
                  : `Sale · ${discountValueLabel(slide)} off tickets`}
              </div>
            ) : null}
          </div>

          <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl">
            {slide.title}
            <br />
            <span className="text-paec-orange">{slide.highlight}</span>
          </h1>

          <p className="mt-5 line-clamp-3 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            {slide.subtitle}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
            <a
              href={getGoogleMapsHref(slide.location)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 underline-offset-4 transition-colors hover:text-white hover:underline"
              title="Open in Google Maps"
            >
              <MapPin className="size-4 shrink-0 text-paec-orange" />
              {slide.location}
            </a>
            {contact.contact_phone ? (
              <a
                href={getPhoneHref(contact.contact_phone)}
                className="inline-flex items-center gap-2 underline-offset-4 transition-colors hover:text-white hover:underline"
                title="Call us"
              >
                <Phone className="size-4 shrink-0 text-paec-orange" />
                {contact.contact_phone}
              </a>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="h-12 rounded-xl bg-paec-violet px-7 text-base font-semibold shadow-lg shadow-paec-violet/30 hover:bg-paec-violet-dark"
            >
              <Link
                to="/attractions/$attractionId"
                params={{ attractionId: slide.attractionId }}
              >
                Book Now
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Link
              to="/attractions/$attractionId"
              params={{ attractionId: slide.featuredCard.attractionId }}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              View Details
            </Link>
            {discountPercent ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-red-400/40 bg-gradient-to-r from-red-600/30 to-paec-orange/20 py-1.5 pr-1.5 pl-4 backdrop-blur-md">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-red-100 uppercase">
                      Sale price from
                    </p>
                    <div className="flex items-baseline gap-2">
                      {slide.originalPrice ? (
                        <span className="text-sm text-white/60 line-through">
                          ₱{formatPrice(slide.originalPrice)}
                        </span>
                      ) : null}
                      <span className="text-2xl leading-tight font-bold text-white">
                        ₱{formatPrice(slide.priceFrom)}
                      </span>
                    </div>
                  </div>
                  {savings > 0 ? (
                    <span className="rounded-lg bg-white px-2.5 py-2 text-xs font-bold whitespace-nowrap text-red-600 shadow-sm">
                      Save ₱{formatPrice(savings)}
                    </span>
                  ) : null}
                </div>
                <SaleSticker
                  key={`sale-mobile-${slide.id}`}
                  info={slide}
                  size="sm"
                  className="shrink-0 lg:hidden"
                />
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 sm:px-2">
                <span className="text-sm text-white/70">From</span>
                <span className="text-2xl font-bold text-paec-orange">
                  ₱{formatPrice(slide.priceFrom)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Slide controls + up next */}
        <div className="mt-10 flex items-end justify-between gap-6 lg:mt-14">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-white tabular-nums">
              {String(slideIndex + 1).padStart(2, '0')}
              <span className="text-white/40">
                {' '}
                / {String(slides.length).padStart(2, '0')}
              </span>
            </span>
            <div className="flex gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === slideIndex
                      ? 'w-8 bg-paec-orange'
                      : 'w-1.5 bg-white/35 hover:bg-white/60',
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === slideIndex}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={prev}
                className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white/90 backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white/90 backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Next slide"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {upNext.length > 0 ? (
            <div className="hidden lg:block">
              <p className="mb-2 text-[11px] font-semibold tracking-widest text-white/60 uppercase">
                Up next
              </p>
              <div className="flex gap-3">
                {upNext.map((index) => {
                  const item = slides[index]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goTo(index)}
                      className="group relative h-24 w-40 overflow-hidden rounded-xl border border-white/20 text-left shadow-lg transition-all hover:-translate-y-0.5 hover:border-white/50"
                      aria-label={`Show ${item.featuredCard.name}`}
                    >
                      <ImageWithFallback
                        src={item.image}
                        alt=""
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                      {item.discountPercent ? (
                        <span className="absolute top-1.5 left-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          -{discountValueLabel(item)}
                        </span>
                      ) : null}
                      <span className="absolute inset-x-2.5 bottom-2 line-clamp-2 text-xs leading-tight font-semibold text-white">
                        {item.featuredCard.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
