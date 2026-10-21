import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  EMPLOYMENT_TYPE_LABELS,
  WORK_SETUP_LABELS,
  type CareerEmploymentType,
  type CareerPosition,
  type CareerPositionPayload,
  type CareerWorkSetup,
} from '@/services/careerService'

type CareerPositionModalProps = {
  open: boolean
  position?: CareerPosition | null
  onClose: () => void
  onSuccess: () => void
  onSave: (payload: CareerPositionPayload, uuid?: string) => Promise<void>
}

const fieldClassName = cn(
  'w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const labelClassName = 'text-xs font-medium text-foreground'

const emptyForm: CareerPositionPayload = {
  title: '',
  department: '',
  location: '',
  work_setup: 'on-site',
  employment_type: 'full-time',
  description: '',
  requirements: '',
  status: 'draft',
  sort_order: 0,
}

export function CareerPositionModal({
  open,
  position,
  onClose,
  onSuccess,
  onSave,
}: CareerPositionModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<CareerPositionPayload>(emptyForm)

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (position) {
      setForm({
        title: position.title,
        department: position.department ?? '',
        location: position.location ?? '',
        work_setup: position.work_setup ?? 'on-site',
        employment_type: position.employment_type,
        description: position.description ?? '',
        requirements: position.requirements ?? '',
        status: position.status,
        sort_order: position.sort_order ?? 0,
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, position])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      await onSave(form, position?.uuid)
      toast.success(
        position ? 'Position updated successfully.' : 'Position created successfully.',
      )
      onSuccess()
      onClose()
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      if (Object.keys(apiErrors).length > 0) {
        const flat: Record<string, string> = {}
        for (const [key, value] of Object.entries(apiErrors)) {
          flat[key] = Array.isArray(value) ? value[0] : value
        }
        setErrors(flat)
      } else {
        toast.error(getApiErrorMessage(err, 'Failed to save position.'))
      }
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

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl">
        <div className="shrink-0 border-b border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">
            {position ? 'Edit Position' : 'Create Position'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Published positions appear on the public /careers page.
          </p>
        </div>

        <form
          id="career-position-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Marketing Associate"
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              />
              {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title}</p> : null}
            </div>
            <div>
              <label className={labelClassName}>Department</label>
              <input
                type="text"
                value={form.department ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="e.g. Operations"
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              />
              {errors.department ? (
                <p className="mt-1 text-xs text-red-600">{errors.department}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClassName}>Location</label>
              <input
                type="text"
                value={form.location ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Manila"
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              />
              {errors.location ? (
                <p className="mt-1 text-xs text-red-600">{errors.location}</p>
              ) : null}
            </div>
            <div>
              <label className={labelClassName}>
                Work Setup <span className="text-red-500">*</span>
              </label>
              <select
                value={form.work_setup}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    work_setup: e.target.value as CareerWorkSetup,
                  }))
                }
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              >
                {Object.entries(WORK_SETUP_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.work_setup ? (
                <p className="mt-1 text-xs text-red-600">{errors.work_setup}</p>
              ) : null}
            </div>
            <div>
              <label className={labelClassName}>
                Employment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.employment_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    employment_type: e.target.value as CareerEmploymentType,
                  }))
                }
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              >
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.employment_type ? (
                <p className="mt-1 text-xs text-red-600">{errors.employment_type}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className={labelClassName}>Job Description</label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              What the role is about and its key responsibilities. Use the
              toolbar for headings, bold, and bullet lists.
            </p>
            <div className="mt-1.5">
              <RichTextEditor
                value={form.description ?? ''}
                onChange={(description) =>
                  setForm((prev) => ({ ...prev, description }))
                }
                placeholder="We are seeking a… Key Responsibilities: • …"
                disabled={submitting}
                minHeightClassName="min-h-44"
              />
            </div>
            {errors.description ? (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClassName}>Requirements / Qualifications</label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Skills, experience, and qualifications needed for this role.
            </p>
            <div className="mt-1.5">
              <RichTextEditor
                value={form.requirements ?? ''}
                onChange={(requirements) =>
                  setForm((prev) => ({ ...prev, requirements }))
                }
                placeholder="• Bachelor's degree in… • Experience in…"
                disabled={submitting}
                minHeightClassName="min-h-44"
              />
            </div>
            {errors.requirements ? (
              <p className="mt-1 text-xs text-red-600">{errors.requirements}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as CareerPositionPayload['status'],
                  }))
                }
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className={labelClassName}>Sort Order</label>
              <input
                type="number"
                min={0}
                value={form.sort_order ?? 0}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))
                }
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              />
            </div>
          </div>
        </form>

        <div className="flex shrink-0 justify-end gap-2 border-t border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold text-foreground hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="career-position-form"
            disabled={submitting}
            className="rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white hover:bg-paec-violet/90 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : position ? 'Update Position' : 'Create Position'}
          </button>
        </div>
      </div>
    </div>
  )
}
