import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const affiliateAdminInputClassName = cn(
  'h-9 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

export const affiliateAdminTableCardClassName =
  'flex flex-col overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm'

export const affiliateAdminThClassName =
  'px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'

export type AffiliatePayoutStatusFilter =
  | 'all'
  | 'pending'
  | 'approved'
  | 'declined'

export type AffiliatePartnerFilter = 'approved' | 'suspended' | 'none' | 'all'

export function affiliatePayoutStatusClass(status: string): string {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700'
  if (status === 'declined') return 'bg-red-100 text-red-600'
  return 'bg-amber-100 text-amber-700'
}

export function affiliatePartnerStatusClass(status: string): string {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700'
  if (status === 'suspended') return 'bg-red-100 text-red-600'
  return 'bg-violet-100 text-muted-foreground'
}

export function affiliatePartnerStatusLabel(status: string): string {
  if (status === 'approved') return 'Approved'
  if (status === 'suspended') return 'Suspended'
  if (status === 'none') return 'Not enrolled'
  return status
}

export function AffiliateTablePagination({
  page,
  lastPage,
  total,
  disabled,
  onChange,
}: {
  page: number
  lastPage: number
  total: number
  disabled?: boolean
  onChange: (page: number) => void
}) {
  if (lastPage <= 1) {
    return total > 0 ? (
      <div className="border-t border-violet-100 px-4 py-3 text-xs text-muted-foreground">
        {total} {total === 1 ? 'record' : 'records'}
      </div>
    ) : null
  }

  return (
    <div className="flex items-center justify-between border-t border-violet-100 px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Page {page} of {lastPage} · {total} records
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
          Prev
        </button>
        <button
          type="button"
          disabled={disabled || page >= lastPage}
          onClick={() => onChange(Math.min(lastPage, page + 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          Next
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export function AffiliateModal({
  title,
  description,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string
  description?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex max-h-[90vh] w-full flex-col rounded-2xl border border-violet-100 bg-white shadow-2xl',
          wide ? 'max-w-4xl' : 'max-w-md',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <div className="shrink-0 px-6 pt-6 pr-14">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          {description ? (
            <div className="mt-1 text-sm text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-violet-100 bg-violet-50/40 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function DetailItem({
  label,
  children,
  mono,
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 text-sm text-foreground',
          mono && 'font-mono tabular-nums',
        )}
      >
        {children}
      </dd>
    </div>
  )
}
