import { X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { activityService } from '@/services/activityService'
import {
  formatDateTimeForBackend,
  promoCodeService,
  type PromoCodeStatus,
} from '@/services/promoCodeService'

export type CreatePromoCodeForm = {
  code: string
  activityId: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: string
  unlimitedUsage: boolean
  usageLimit: string
  usableFrom: string
  usableTo: string
  status: Exclude<PromoCodeStatus, 'expired'>
}

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function buildDefaultPromoDates() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)

  const to = new Date(from)
  to.setMonth(to.getMonth() + 1)
  to.setHours(23, 59, 0, 0)

  return {
    usableFrom: toDateTimeLocalValue(from),
    usableTo: toDateTimeLocalValue(to),
  }
}

const initialForm: CreatePromoCodeForm = {
  code: '',
  activityId: '',
  description: '',
  discountType: 'percentage',
  discountValue: '0',
  unlimitedUsage: true,
  usageLimit: '',
  ...buildDefaultPromoDates(),
  status: 'active',
}

type ActivityOption = {
  id: string
  title: string
}

type CreatePromoCodeModalProps = {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const fieldClassName = cn(
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const labelClassName = 'text-xs font-medium text-foreground'

export function CreatePromoCodeModal({
  open,
  onClose,
  onCreated,
}: CreatePromoCodeModalProps) {
  const [form, setForm] = useState<CreatePromoCodeForm>(initialForm)
  const [activities, setActivities] = useState<ActivityOption[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true)
    try {
      const list = await activityService.listAmusements(100)
      setActivities(list.map((activity) => ({ id: activity.id, title: activity.title })))
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load activities.'))
      setActivities([])
    } finally {
      setActivitiesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    void loadActivities()

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, submitting, loadActivities])

  useEffect(() => {
    if (!open) setForm({ ...initialForm, ...buildDefaultPromoDates() })
  }, [open])

  const update = (updates: Partial<CreatePromoCodeForm>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (
      !form.code.trim() ||
      !form.activityId ||
      !form.usableFrom ||
      !form.usableTo
    ) {
      toast.error('Please fill in all required fields.')
      return
    }

    const discountValue = Number(form.discountValue)
    if (Number.isNaN(discountValue) || discountValue <= 0) {
      toast.error('Discount value must be greater than 0.')
      return
    }

    if (
      !form.unlimitedUsage &&
      (!form.usageLimit.trim() || Number(form.usageLimit) < 1)
    ) {
      toast.error('Usage limit must be at least 1.')
      return
    }

    setSubmitting(true)
    try {
      await promoCodeService.createPromoCode({
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        activityable_type: 'App\\Models\\Event',
        activityable_id: form.activityId,
        discount_type: form.discountType === 'fixed' ? 'amount' : 'percentage',
        discount_value: discountValue,
        is_unlimited: form.unlimitedUsage,
        max_use: form.unlimitedUsage ? undefined : Number(form.usageLimit),
        usable_from: formatDateTimeForBackend(form.usableFrom),
        usable_to: formatDateTimeForBackend(form.usableTo),
        status: form.status,
      })
      toast.success('Promo code created successfully.')
      onCreated()
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create promo code.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
        aria-label="Close modal"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-promo-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl"
      >
        <div className="shrink-0 border-b border-violet-100 px-6 py-4 text-center">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <h2
            id="create-promo-title"
            className="text-lg font-bold text-foreground"
          >
            Create Promo Code
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new promo code for an activity
          </p>
        </div>

        <form
          id="create-promo-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div>
            <label className={labelClassName}>
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => update({ code: e.target.value.toUpperCase() })}
              placeholder="PROMO2026"
              className={`${fieldClassName} mt-1.5 uppercase`}
              disabled={submitting}
            />
          </div>

          <div>
            <label className={labelClassName}>
              Activity <span className="text-red-500">*</span>
            </label>
            <select
              value={form.activityId}
              onChange={(e) => update({ activityId: e.target.value })}
              className={`${fieldClassName} mt-1.5`}
              disabled={submitting || activitiesLoading}
            >
              <option value="">
                {activitiesLoading
                  ? 'Loading activities…'
                  : 'Search and select activity'}
              </option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Promo code description..."
              rows={3}
              className={`${fieldClassName} mt-1.5 resize-none py-2`}
              disabled={submitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  update({
                    discountType: e.target.value as 'percentage' | 'fixed',
                  })
                }
                className={`${fieldClassName} mt-1.5`}
                disabled={submitting}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className={labelClassName}>
                Discount Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discountValue}
                onChange={(e) => update({ discountValue: e.target.value })}
                className={`${fieldClassName} mt-1.5`}
                disabled={submitting}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.unlimitedUsage}
              onChange={(e) => update({ unlimitedUsage: e.target.checked })}
              className="size-4 rounded border-violet-200 text-paec-violet focus:ring-paec-violet/30"
              disabled={submitting}
            />
            <span className={labelClassName}>Unlimited Usage</span>
          </label>

          {!form.unlimitedUsage ? (
            <div>
              <label className={labelClassName}>Usage Limit</label>
              <input
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={(e) => update({ usageLimit: e.target.value })}
                placeholder="Max number of uses"
                className={`${fieldClassName} mt-1.5`}
                disabled={submitting}
              />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Usable From <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.usableFrom}
                onChange={(e) => update({ usableFrom: e.target.value })}
                className={`${fieldClassName} mt-1.5`}
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClassName}>
                Usable To <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.usableTo}
                onChange={(e) => update({ usableTo: e.target.value })}
                className={`${fieldClassName} mt-1.5`}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label className={labelClassName}>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                update({
                  status: e.target.value as Exclude<PromoCodeStatus, 'expired'>,
                })
              }
              className={`${fieldClassName} mt-1.5`}
              disabled={submitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>

        <div className="flex shrink-0 justify-end gap-2 border-t border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-violet-200 bg-white px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-promo-form"
            disabled={submitting}
            className="rounded-lg bg-paec-violet px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
