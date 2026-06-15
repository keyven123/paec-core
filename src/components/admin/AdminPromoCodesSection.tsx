import {
  Calendar,
  ChevronDown,
  Infinity,
  Loader2,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CreatePromoCodeModal } from '@/components/admin/CreatePromoCodeModal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  formatPromoDateTime,
  getPromoDisplayStatus,
  promoCodeService,
  type PromoCode,
  type PromoCodeStatus,
} from '@/services/promoCodeService'

type StatusFilter = 'all' | PromoCodeStatus

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
]

const inputClassName = cn(
  'h-9 w-full rounded-lg border border-violet-100 bg-white pr-3 pl-9 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

function actionButtonClassName(variant: 'view' | 'delete') {
  return cn(
    'rounded-md border bg-white px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'view' &&
      'border-violet-200 text-paec-violet hover:border-paec-violet hover:bg-violet-50',
    variant === 'delete' &&
      'border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50',
  )
}

function StatusBadge({ status }: { status: PromoCodeStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
        status === 'active' && 'bg-emerald-100 text-emerald-700',
        status === 'inactive' && 'bg-red-100 text-red-600',
        status === 'expired' && 'bg-violet-100 text-muted-foreground',
      )}
    >
      {status}
    </span>
  )
}

function getActivityName(promo: PromoCode) {
  return promo.activityable?.data?.event_name ?? '—'
}

export function AdminPromoCodesSection() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState<PromoCode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [statusInput, setStatusInput] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await promoCodeService.getPromoCodes({
        q: search.trim() || undefined,
        status: status === 'all' || status === 'expired' ? undefined : status,
        per_page: 100,
      })
      setPromoCodes(response.data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load promo codes.'))
      setPromoCodes([])
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    void fetchPromoCodes()
  }, [fetchPromoCodes])

  const filteredPromoCodes = useMemo(() => {
    if (status !== 'expired') return promoCodes
    return promoCodes.filter((promo) => getPromoDisplayStatus(promo) === 'expired')
  }, [promoCodes, status])

  const applyFilters = () => {
    setSearch(searchInput)
    setStatus(statusInput)
  }

  const clearFilters = () => {
    setSearchInput('')
    setStatusInput('all')
    setSearch('')
    setStatus('all')
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      await promoCodeService.deletePromoCode(deleteTarget.uuid)
      toast.success('Promo code deleted.')
      setDeleteTarget(null)
      await fetchPromoCodes()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete promo code.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            Promo Code Management
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage all promo codes
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark sm:gap-2 sm:px-4 sm:text-sm"
        >
          <Plus className="size-3.5 sm:size-4" />
          Create Promo Code
        </button>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Promo code..."
            className={inputClassName}
          />
        </div>

        <div className="relative w-full sm:w-40">
          <select
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value as StatusFilter)}
            className={cn(inputClassName, 'appearance-none pl-3')}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-paec-violet px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark sm:text-sm"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-violet-50 sm:text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-violet-50/95 backdrop-blur-sm">
              <tr className="border-b border-violet-100">
                {[
                  'Code',
                  'Activity',
                  'Discount',
                  'Usage',
                  'Valid Period',
                  'Status',
                  'Actions',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center">
                    <Loader2 className="mx-auto mb-2 size-6 animate-spin text-paec-violet" />
                    <p className="text-sm text-muted-foreground">
                      Loading promo codes…
                    </p>
                  </td>
                </tr>
              ) : filteredPromoCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center">
                    <Tag className="mx-auto mb-2 size-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No promo codes found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPromoCodes.map((promo) => (
                  <PromoCodeRow
                    key={promo.uuid}
                    promo={promo}
                    onView={() => setViewTarget(promo)}
                    onDelete={() => setDeleteTarget(promo)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePromoCodeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void fetchPromoCodes()}
      />

      {viewTarget ? (
        <ViewPromoCodeModal
          promo={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      ) : null}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete promo code"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.code}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  )
}

function ViewPromoCodeModal({
  promo,
  onClose,
}: {
  promo: PromoCode
  onClose: () => void
}) {
  const displayStatus = getPromoDisplayStatus(promo)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close promo code details"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h3 className="text-lg font-bold text-foreground">Promo Code Details</h3>
        <p className="mt-1 text-sm text-muted-foreground">{promo.code}</p>
        <dl className="mt-4 space-y-3 text-sm">
          <DetailItem label="Description" value={promo.description?.trim() || '—'} />
          <DetailItem label="Activity" value={getActivityName(promo)} />
          <DetailItem
            label="Discount"
            value={
              promo.discount_type === 'amount'
                ? `₱${Number.parseFloat(promo.discount_value).toFixed(2)}`
                : `${Number.parseFloat(promo.discount_value).toFixed(2)}%`
            }
          />
          <DetailItem
            label="Usage"
            value={
              promo.is_unlimited
                ? 'Unlimited'
                : `${promo.max_use?.toLocaleString() ?? 0} max`
            }
          />
          <DetailItem label="Valid From" value={formatPromoDateTime(promo.usable_from)} />
          <DetailItem label="Valid To" value={formatPromoDateTime(promo.usable_to)} />
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <StatusBadge status={displayStatus} />
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-violet-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  )
}

function PromoCodeRow({
  promo,
  onView,
  onDelete,
}: {
  promo: PromoCode
  onView: () => void
  onDelete: () => void
}) {
  const displayStatus = getPromoDisplayStatus(promo)

  return (
    <tr className="border-b border-violet-50 transition-colors last:border-0 hover:bg-violet-50/30">
      <td className="px-3 py-2.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-orange-100 text-paec-orange">
            <Tag className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">{promo.code}</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {promo.description?.trim() || '—'}
            </p>
          </div>
        </div>
      </td>
      <td className="max-w-[180px] px-3 py-2.5 text-xs text-foreground">
        {getActivityName(promo)}
      </td>
      <td className="px-3 py-2.5 text-xs font-semibold text-paec-orange">
        {promo.discount_type === 'amount'
          ? `₱${Number.parseFloat(promo.discount_value).toFixed(2)}`
          : `${Number.parseFloat(promo.discount_value).toFixed(2)}%`}
      </td>
      <td className="px-3 py-2.5">
        {promo.is_unlimited ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Infinity className="size-3.5" />
            Unlimited
          </span>
        ) : (
          <span className="text-xs text-foreground">
            {promo.max_use?.toLocaleString() ?? 0} max
          </span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
          <Calendar className="mt-0.5 size-3 shrink-0 text-paec-violet" />
          <div>
            <p>{formatPromoDateTime(promo.usable_from)}</p>
            <p className="mt-0.5">{formatPromoDateTime(promo.usable_to)}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={displayStatus} />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onView}
            className={actionButtonClassName('view')}
          >
            View
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={actionButtonClassName('delete')}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
