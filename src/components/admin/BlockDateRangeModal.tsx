import { CalendarRange, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { BlockableResource } from '@/services/blockedDateService'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { blockedDateService } from '@/services/blockedDateService'

type BlockDateRangeModalProps = {
  open: boolean
  activityId: string
  resource?: BlockableResource
  onClose: () => void
  onBlocked: () => void | Promise<void>
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatShortDate(value: string) {
  return parseDateKey(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function countDays(start: string, end: string) {
  const ms = parseDateKey(end).getTime() - parseDateKey(start).getTime()
  return Math.round(ms / 86_400_000) + 1
}

const inputClassName =
  'mt-1 h-10 w-full rounded-lg border border-violet-100 px-3 text-sm focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none'

export function BlockDateRangeModal({
  open,
  activityId,
  resource = 'events',
  onClose,
  onBlocked,
}: BlockDateRangeModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setStartDate('')
    setEndDate('')
    setReason('')
  }, [open])

  if (!open) return null

  const today = toDateKey(new Date())
  const rangeInvalid = Boolean(startDate && endDate) && endDate < startDate
  const canSubmit = !submitting && Boolean(startDate) && Boolean(endDate) && !rangeInvalid
  const dayCount = startDate && endDate && !rangeInvalid ? countDays(startDate, endDate) : 0

  const close = () => {
    if (!submitting) onClose()
  }

  const handleStartChange = (value: string) => {
    setStartDate(value)
    if (value && (!endDate || endDate < value)) setEndDate(value)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const response = await blockedDateService.create(resource, activityId, {
        blocked_date: startDate,
        blocked_date_end: endDate,
        reason: reason.trim() || null,
      })

      const blockedCount = Array.isArray(response.data) ? response.data.length : 1
      const skipped = response.skipped ?? []

      if (dayCount > 1) {
        toast.success(
          `Blocked ${blockedCount} day${blockedCount === 1 ? '' : 's'}.`,
          skipped.length > 0
            ? {
                description: `${skipped.length} day${skipped.length === 1 ? ' was' : 's were'} skipped (already blocked or has existing tickets).`,
              }
            : undefined,
        )
      } else {
        toast.success('Blocked date added.')
      }

      onClose()
      await onBlocked()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to block date.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-label="Close block date modal"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <h3 className="text-lg font-bold text-foreground">Add Blocked Date</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {resource === 'venue-listings'
            ? 'Customers cannot send inquiries for blocked dates.'
            : 'Tickets cannot be purchased on blocked dates.'}
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="blocked-date-start" className="text-xs font-medium text-foreground">
                Start date
              </label>
              <input
                id="blocked-date-start"
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => handleStartChange(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="blocked-date-end" className="text-xs font-medium text-foreground">
                End date
              </label>
              <input
                id="blocked-date-end"
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                className={cn(inputClassName, rangeInvalid && 'border-red-300')}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            To block a single day, use the same start and end date.
          </p>

          {rangeInvalid ? (
            <p className="text-xs text-red-600">
              The end date must be on or after the start date.
            </p>
          ) : dayCount > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-orange-100 bg-orange-50/70 px-3 py-2 text-xs text-orange-800">
              <CalendarRange className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {dayCount === 1 ? (
                  <>
                    <strong>1 day</strong> will be blocked: {formatShortDate(startDate)}.
                  </>
                ) : (
                  <>
                    <strong>{dayCount} days</strong> will be blocked:{' '}
                    {formatShortDate(startDate)} – {formatShortDate(endDate)}. Days with
                    existing tickets are skipped.
                  </>
                )}
              </span>
            </div>
          ) : null}

          <div>
            <label htmlFor="blocked-reason" className="text-xs font-medium text-foreground">
              Reason (optional)
            </label>
            <input
              id="blocked-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Maintenance, Holiday closure"
              maxLength={255}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="rounded-lg bg-paec-orange px-4 py-2 text-sm font-semibold text-white hover:bg-paec-orange-light disabled:opacity-50"
          >
            {submitting
              ? 'Blocking…'
              : dayCount > 1
                ? `Block ${dayCount} Days`
                : 'Add Blocked Date'}
          </button>
        </div>
      </div>
    </div>
  )
}
