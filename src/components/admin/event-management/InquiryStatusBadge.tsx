import { cn } from '@/lib/utils'

export const INQUIRY_STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in_discussion', label: 'In discussion' },
  { value: 'site_visit_scheduled', label: 'Site visit' },
  { value: 'proposal_sent', label: 'Proposal sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'deposit_requested', label: 'Deposit requested' },
  { value: 'deposit_paid', label: 'Deposit paid' },
  { value: 'balance_due', label: 'Balance due' },
  { value: 'fully_paid', label: 'Fully paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function inquiryStatusClass(status: string) {
  if (status === 'new') return 'bg-violet-100 text-paec-violet'
  if (status === 'cancelled') return 'bg-red-100 text-red-700'
  if (status === 'completed' || status === 'fully_paid') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (status === 'deposit_paid' || status === 'balance_due') {
    return 'bg-sky-100 text-sky-700'
  }
  return 'bg-amber-100 text-amber-700'
}

export function InquiryStatusBadge({
  status,
  label,
  className,
}: {
  status: string
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        inquiryStatusClass(status),
        className,
      )}
    >
      {label}
    </span>
  )
}
