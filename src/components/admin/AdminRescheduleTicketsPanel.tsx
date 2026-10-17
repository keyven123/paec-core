import { CalendarClock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'

import type { AdminTransactionDetail } from '@/services/adminTransactionService'
import { formatVisitDate, getVisitDate } from '@/components/admin/transactionFormat'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { adminTransactionService } from '@/services/adminTransactionService'

type AdminRescheduleTicketsPanelProps = {
  transaction: AdminTransactionDetail
  onSaved: () => void
  onCancel: () => void
}

export function canRescheduleTransaction(
  transaction: AdminTransactionDetail | null | undefined,
): boolean {
  if (!transaction || transaction.payment_status !== 'paid') return false

  const tickets = transaction.tickets ?? []
  return tickets.some(
    (ticket) =>
      !ticket.used_at &&
      ticket.status !== 'transferred' &&
      ticket.status !== 'used' &&
      ticket.status !== 'cancelled',
  )
}

export function AdminRescheduleTicketsPanel({
  transaction,
  onSaved,
  onCancel,
}: AdminRescheduleTicketsPanelProps) {
  const currentVisit = getVisitDate(transaction)
  const [visitDate, setVisitDate] = useState(currentVisit ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!visitDate) {
      setError('Select a new date of visit.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const result = await adminTransactionService.reschedule(
        transaction.uuid,
        visitDate,
      )
      toast.success(result.message)
      onSaved()
    } catch (err) {
      const fieldErrors = getApiValidationErrors(err)
      setError(
        fieldErrors.visit_date ??
          getApiErrorMessage(err, 'Failed to reschedule tickets.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="rounded-xl border border-violet-200 bg-violet-50/40 p-4"
    >
      <div className="flex items-start gap-2">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-paec-violet" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Reschedule visit date
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Change the date of visit for this booking. Works even if tickets are
            expired or past due.
            {currentVisit ? (
              <>
                {' '}
                Current visit:{' '}
                <span className="font-medium text-foreground">
                  {formatVisitDate(currentVisit)}
                </span>
              </>
            ) : null}
          </p>

          <label className="mt-3 block text-xs font-medium text-muted-foreground">
            New date of visit
            <input
              type="date"
              value={visitDate}
              onChange={(event) => {
                setVisitDate(event.target.value)
                setError(null)
              }}
              className="mt-1.5 flex h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
            />
          </label>

          {error ? (
            <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold text-foreground hover:bg-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !visitDate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white hover:bg-paec-violet/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save new date
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
