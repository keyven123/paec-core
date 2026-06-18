import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { cn } from '@/lib/utils'

type ActivityShowcaseGalleryProps = {
  images: string[]
  activityName: string
  className?: string
}

export function ActivityShowcaseGallery({
  images,
  activityName,
  className,
}: ActivityShowcaseGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    if (activeIndex === null) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [activeIndex])

  if (images.length === 0) return null

  const activeImage = activeIndex !== null ? images[activeIndex] : null

  return (
    <>
      <section className={cn('mt-6', className)}>
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          Activity gallery
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          More photos from this experience
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group overflow-hidden rounded-xl border border-violet-100 bg-violet-50/30 text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-paec-violet/40 focus-visible:outline-none"
            >
              <ImageWithFallback
                src={src}
                alt={`${activityName} showcase ${index + 1}`}
                className="aspect-[940/788] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                fallbackClassName="aspect-[940/788] w-full"
              />
            </button>
          ))}
        </div>
      </section>

      {activeImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${activityName} gallery preview`}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close gallery preview"
          >
            <X className="size-5" />
          </button>
          <img
            src={activeImage}
            alt={`${activityName} showcase`}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}
