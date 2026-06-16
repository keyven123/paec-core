import { Link } from '@tanstack/react-router'
import { Ticket } from 'lucide-react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { cn } from '@/lib/utils'

export type FeaturedAttractionItem = {
  id: string
  name: string
  price: number
  image: string
  location?: string
}

type FeaturedAttractionCardProps = {
  item: FeaturedAttractionItem
  className?: string
  compact?: boolean
}

export function FeaturedAttractionCard({
  item,
  className,
  compact = true,
}: FeaturedAttractionCardProps) {
  return (
    <Link
      to="/attractions/$attractionId"
      params={{ attractionId: item.id }}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 p-2 text-left transition-colors hover:border-white/20 hover:bg-white/10',
        !compact && 'gap-3 p-3 sm:p-4',
        className,
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md',
          compact ? 'size-12 sm:size-14' : 'size-16 sm:size-20',
        )}
      >
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          className="size-full object-cover"
          fallbackClassName="size-full"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'line-clamp-2 leading-snug font-medium text-white',
            compact ? 'text-[11px] sm:text-xs' : 'text-sm sm:text-base',
          )}
        >
          {item.name}
        </p>
        {item.location && !compact && (
          <p className="mt-0.5 line-clamp-1 text-xs text-white/50">
            {item.location}
          </p>
        )}
        <p
          className={cn(
            'font-bold text-paec-orange',
            compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm',
          )}
        >
          ₱{item.price.toLocaleString()}
        </p>
      </div>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-paec-violet/80 text-white transition-colors group-hover:bg-paec-violet',
          compact ? 'size-6' : 'size-8',
        )}
      >
        <Ticket className={compact ? 'size-2.5' : 'size-3.5'} />
      </span>
    </Link>
  )
}
