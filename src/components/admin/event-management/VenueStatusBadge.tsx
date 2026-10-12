import type { VenueListingStatus } from '@/services/venueListingService'
import { cn } from '@/lib/utils'

const statusStyles: Record<VenueListingStatus, string> = {
  published: 'bg-paec-violet text-white',
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
  inactive: 'bg-red-100 text-red-700',
}

export function VenueStatusBadge({
  status,
  className,
}: {
  status: VenueListingStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
