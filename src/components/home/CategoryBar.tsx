import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Landmark,
  Palette,
  PartyPopper,
  Tag,
  Ticket,
  Trees,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { useRef } from 'react'

import {
  ALL_CATEGORIES,
  type ActivityCategoryOption,
} from '@/lib/activityCategories'
import { cn } from '@/lib/utils'

type CategoryBarProps = {
  categories: Array<ActivityCategoryOption>
  active: string
  onChange: (id: string) => void
  loading?: boolean
  variant?: 'hero' | 'section'
}

const ICON_MAP: Record<string, LucideIcon> = {
  tag: Tag,
  calendar: Calendar,
  landmark: Landmark,
  users: Users,
  'flask-conical': FlaskConical,
  trees: Trees,
  palette: Palette,
  utensils: Utensils,
  'party-popper': PartyPopper,
  ticket: Ticket,
}

function CategoryIcon({
  name,
  active,
  size = 'md',
}: {
  name: string
  active: boolean
  size?: 'sm' | 'md'
}) {
  const Icon = ICON_MAP[name] ?? Ticket

  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full shadow-sm',
        size === 'sm' ? 'size-10' : 'size-9',
        active
          ? 'bg-paec-violet ring-2 ring-paec-violet/30'
          : 'bg-[radial-gradient(circle_at_40%_35%,#fdba74_0%,#f97316_55%,#ea580c_100%)]',
      )}
    >
      <Icon
        className={cn(
          'text-white drop-shadow-sm',
          size === 'sm' ? 'size-[1.15rem]' : 'size-4',
        )}
        strokeWidth={2.25}
      />
    </span>
  )
}

function CategoryButton({
  cat,
  isActive,
  onSelect,
  layout,
}: {
  cat: ActivityCategoryOption
  isActive: boolean
  onSelect: (id: string) => void
  layout: 'mobile' | 'desktop'
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onSelect(cat.id)}
      title={`${cat.label} · ${cat.count} ${cat.count === 1 ? 'activity' : 'activities'}`}
      className={cn(
        'flex flex-col items-center transition-all',
        layout === 'mobile'
          ? 'gap-1.5 px-0.5'
          : cn(
              'min-w-[5.75rem] max-w-[7.5rem] shrink-0 gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-semibold',
              isActive
                ? 'bg-paec-violet text-white shadow-md'
                : 'border border-violet-100 bg-white text-foreground hover:border-paec-violet/30 hover:bg-violet-50',
            ),
      )}
    >
      <CategoryIcon
        name={cat.icon}
        active={layout === 'mobile' ? isActive : isActive}
        size={layout === 'mobile' ? 'sm' : 'md'}
      />
      <span
        className={cn(
          'text-center leading-tight',
          layout === 'mobile'
            ? cn(
                'line-clamp-2 min-h-[2rem] text-[10px] font-medium',
                isActive ? 'font-semibold text-paec-violet' : 'text-foreground',
              )
            : cn(
                'line-clamp-2 text-[11px] font-semibold',
                isActive ? 'text-white' : 'text-foreground',
              ),
        )}
      >
        {cat.label}
      </span>
    </button>
  )
}

export function CategoryBar({
  categories,
  active,
  onChange,
  loading = false,
  variant = 'section',
}: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowSplit = Math.ceil(categories.length / 2)
  const mobileRows = [
    categories.slice(0, rowSplit),
    categories.slice(rowSplit),
  ]

  const selectCategory = (id: string) => {
    // Tap selected category again → clear filter (show all)
    onChange(active === id ? ALL_CATEGORIES : id)
  }

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth',
    })
  }

  return (
    <>
      {/* Mobile: exactly 2 rows */}
      <div
        className={cn('md:hidden', variant === 'hero' ? 'px-4' : '')}
        role="tablist"
        aria-label="Activity categories"
      >
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((row) => (
              <div key={row} className="grid grid-cols-5 gap-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="size-10 animate-pulse rounded-full bg-orange-100" />
                    <div className="h-3 w-10 animate-pulse rounded bg-violet-50" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mobileRows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-5 gap-x-1"
              >
                {row.map((cat) => (
                  <CategoryButton
                    key={cat.id}
                    cat={cat}
                    isActive={active === cat.id}
                    onSelect={selectCategory}
                    layout="mobile"
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop / tablet: horizontal scroll */}
      <div
        className={cn(
          'hidden items-center gap-2 md:flex',
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
          className="scrollbar-hide flex-1 overflow-x-auto py-1"
        >
          <div
            className="mx-auto flex w-max gap-2.5"
            role="tablist"
            aria-label="Activity categories"
          >
            {loading
              ? Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="h-[4.5rem] w-28 shrink-0 animate-pulse rounded-xl bg-violet-50"
                  />
                ))
              : categories.map((cat) => (
                  <CategoryButton
                    key={cat.id}
                    cat={cat}
                    isActive={active === cat.id}
                    onSelect={selectCategory}
                    layout="desktop"
                  />
                ))}
          </div>
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
    </>
  )
}
