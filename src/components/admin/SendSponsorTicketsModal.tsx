import { Loader2, Send, X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  adminEventTicketService,
  type AdminEventTicket,
} from '@/services/adminEventTicketService'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SendSponsorTicketsModalProps = {
  open: boolean
  ticket: AdminEventTicket | null
  eventUuid: string
  onClose: () => void
  onSent: () => void
}

export function SendSponsorTicketsModal({
  open,
  ticket,
  eventUuid,
  onClose,
  onSent,
}: SendSponsorTicketsModalProps) {
  const [email, setEmail] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [validUntil, setValidUntil] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  if (!open || !ticket) return null

  const needsVisitDate = ticket.visit_policy !== 'flexible'
  const qty = Number.parseInt(quantity, 10)
  const recipient = email.trim().toLowerCase()
  const canSubmit =
    EMAIL_PATTERN.test(recipient) &&
    Number.isFinite(qty) &&
    qty >= 1 &&
    qty <= 50 &&
    (!needsVisitDate || validUntil !== '') &&
    !sending

  const resetAndClose = () => {
    if (sending) return
    setEmail('')
    setQuantity('1')
    setValidUntil('')
    setError(null)
    setFieldErrors({})
    onClose()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) {
      setError('Enter a valid email and quantity.')
      return
    }

    setSending(true)
    setError(null)
    setFieldErrors({})
    try {
      const result = await adminEventTicketService.sendSponsorTickets({
        event_uuid: eventUuid,
        event_ticket_uuid: ticket.uuid,
        email: recipient,
        quantity: qty,
        ...(needsVisitDate && validUntil ? { valid_until: validUntil } : {}),
      })
      toast.success(result.message, {
        description: result.data.recipient.is_new_account
          ? `A guest account was created for ${result.data.recipient.email}.`
          : `Sent to ${result.data.recipient.email} · Order ${result.data.order_number}`,
      })
      setEmail('')
      setQuantity('1')
      setValidUntil('')
      onSent()
      onClose()
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      const next: Record<string, string> = {}
      for (const [key, value] of Object.entries(apiErrors)) {
        if (value) next[key] = Array.isArray(value) ? value[0] : value
      }
      setFieldErrors(next)
      setError(getApiErrorMessage(err, 'Failed to send sponsor tickets.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={resetAndClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-violet-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-violet-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Send Sponsor</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ticket.name} · Complimentary tickets
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            disabled={sending}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-violet-50 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="space-y-4 px-5 py-5">
          <div>
            <label
              htmlFor="sponsor-email"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Email
            </label>
            <input
              id="sponsor-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sponsor@example.com"
              disabled={sending}
              className={cn(
                'h-10 w-full rounded-lg border bg-white px-3 text-sm focus:ring-2 focus:outline-none',
                fieldErrors.email
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-violet-100 focus:border-paec-violet focus:ring-paec-violet/20',
              )}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="sponsor-quantity"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Quantity
            </label>
            <input
              id="sponsor-quantity"
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={sending}
              className={cn(
                'h-10 w-full rounded-lg border bg-white px-3 text-sm focus:ring-2 focus:outline-none',
                fieldErrors.quantity
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-violet-100 focus:border-paec-violet focus:ring-paec-violet/20',
              )}
            />
            {fieldErrors.quantity ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>
            ) : null}
          </div>

          {needsVisitDate ? (
            <div>
              <label
                htmlFor="sponsor-valid-until"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Date of visit
              </label>
              <input
                id="sponsor-valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={sending}
                min={new Date().toISOString().slice(0, 10)}
                className={cn(
                  'h-10 w-full rounded-lg border bg-white px-3 text-sm focus:ring-2 focus:outline-none',
                  fieldErrors.valid_until
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-violet-100 focus:border-paec-violet focus:ring-paec-violet/20',
                )}
              />
              {fieldErrors.valid_until ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.valid_until}
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={sending}
              className="rounded-lg border border-violet-200 px-4 py-2.5 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-paec-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-paec-orange-light disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {sending ? 'Sending…' : 'Proceed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
