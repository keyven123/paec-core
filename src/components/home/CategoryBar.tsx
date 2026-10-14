import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

import type { ActivityCategoryOption } from '@/lib/activityCategories'
import { cn } from '@/lib/utils'

type CategoryBarProps = {
  categories: Array<ActivityCategoryOption>
  active: string
  onChange: (id: string) => void
  loading?: boolean
  variant?: 'hero' | 'section'
}

export function CategoryBar({
  categories,
  active,
  onChange,
  loading = false,
  variant = 'section',
}: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -200 : 200,
      behavior: 'smooth',
    })
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        variant === 'hero' ? 'px-4 sm:px-6 lg:px-8' : '',
      )}
    >
      <button
        type="button"
        onClick={() => scroll('left')}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors',
          variant === 'hero'
            ? 'border-white/20 bg-black/30 text-white hover:bg-black/50'
            : 'border-violet-100 bg-white text-foreground hover:bg-violet-50',
        )}
        aria-label="Scroll categories left"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex flex-1 gap-2 overflow-x-auto py-1"
        role="tablist"
        aria-label="Activity categories"
      >
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="h-[3.75rem] w-28 shrink-0 animate-pulse rounded-xl bg-violet-50"
              />
            ))
          : categories.map((cat) => {
              const isActive = active === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(cat.id)}
                  title={`${cat.label} · ${cat.count} ${cat.count === 1 ? 'activity' : 'activities'}`}
                  className={cn(
                    'flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium transition-all',
                    variant === 'hero'
                      ? isActive
                        ? 'bg-paec-violet text-white shadow-lg'
                        : 'bg-white/90 text-foreground hover:bg-white'
                      : isActive
                        ? 'bg-paec-violet text-white shadow-md'
                        : 'border border-violet-100 bg-white text-foreground hover:border-paec-violet/30 hover:bg-violet-50',
                  )}
                >
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span className="whitespace-nowrap">{cat.label}</span>
                </button>
              )
            })}
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors',
          variant === 'hero'
            ? 'border-white/20 bg-black/30 text-white hover:bg-black/50'
            : 'border-violet-100 bg-white text-foreground hover:bg-violet-50',
        )}
        aria-label="Scroll categories right"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}
