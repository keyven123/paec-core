import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Info,
  Loader2,
  Mail,
  Send,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { FormEvent } from 'react'

import type {
  AdminTransactionDetail,
  AdminTransactionTicket,
} from '@/services/adminTransactionService'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { adminTransactionService } from '@/services/adminTransactionService'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function countLabel(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export function getSendableTickets(
  tickets: Array<AdminTransactionTicket>,
): Array<AdminTransactionTicket> {
  return tickets.filter(
    (ticket) => ticket.status === 'active' && !ticket.used_at,
  )
}

function getHolderEmail(tickets: Array<AdminTransactionTicket>): string | null {
  const owners = new Set(
    tickets.map((ticket) => ticket.owner_email?.toLowerCase() ?? ''),
  )
  const [only] = [...owners]
  return owners.size === 1 && only ? only : null
}

type AdminSendTicketsPanelProps = {
  transaction: AdminTransactionDetail
  onSent: () => void
  onCancel: () => void
}

export function AdminSendTicketsPanel({
  transaction,
  onSent,
  onCancel,
}: AdminSendTicketsPanelProps) {
  const sendable = getSendableTickets(transaction.tickets ?? [])
  const holderEmail = getHolderEmail(sendable)
  const [email, setEmail] = useState(
    holderEmail ?? transaction.user?.email ?? '',
  )
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recipient = email.trim().toLowerCase()
  const isValid = EMAIL_PATTERN.test(recipient)
  const moveCount = sendable.filter(
    (ticket) => ticket.owner_email?.toLowerCase() !== recipient,
  ).length
  const isTransfer = isValid && moveCount > 0
  const skippedCount = (transaction.tickets ?? []).filter(
    (ticket) => ticket.status !== 'transferred' && !sendable.includes(ticket),
  ).length

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValid) {
      setError('Enter a valid email address.')
      return
    }
    if (isTransfer && !confirming) {
      setConfirming(true)
      return
    }
    setSending(true)
    setError(null)
    try {
      const result = await adminTransactionService.sendTickets(
        transaction.uuid,
        recipient,
      )
      toast.success(result.message, {
        description: result.recipient.is_new_account
          ? `A guest account was created for ${result.recipient.email}.`
          : undefined,
      })
      onSent()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send the tickets.'))
      setConfirming(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="rounded-xl border border-violet-200 bg-violet-50/40 p-4"
      aria-labelledby="send-tickets-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paec-violet/10 text-paec-violet">
            <Mail className="size-4" />
          </span>
          <div className="min-w-0">
            <h3
              id="send-tickets-title"
              className="text-sm font-semibold text-foreground"
            >
              Send to Email
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Send the {countLabel(sendable.length, 'active ticket')} and the
              transaction details of this order to a customer account.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-violet-100 hover:text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <label
        htmlFor="send-tickets-email"
        className="mt-4 block text-xs font-medium text-foreground"
      >
        Recipient email
      </label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <input
          id="send-tickets-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setConfirming(false)
            setError(null)
          }}
          placeholder="customer@example.com"
          autoComplete="off"
          disabled={sending}
          className="h-10 w-full min-w-0 rounded-lg border border-violet-200 bg-white px-3 text-sm outline-none focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 disabled:opacity-60 sm:flex-1"
        />
        {confirming ? null : (
          <button
            type="submit"
            disabled={sending || !isValid}
            className={cn(
              'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:opacity-50',
              isTransfer
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-paec-violet hover:bg-paec-violet/90',
            )}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isTransfer ? (
              <ArrowRightLeft className="size-4" />
            ) : (
              <Send className="size-4" />
            )}
            {isTransfer
              ? `Transfer ${countLabel(moveCount, 'ticket')}`
              : 'Send tickets'}
          </button>
        )}
      </div>

      {isValid ? (
        isTransfer ? (
          <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <ArrowRightLeft className="mt-0.5 size-3.5 shrink-0" />
            <p>
              <span className="font-semibold">Different account.</span>{' '}
              {countLabel(moveCount, 'ticket')} will be transferred to{' '}
              <span className="font-semibold break-all">{recipient}</span>
              {holderEmail ? (
                <>
                  {' '}
                  from <span className="break-all">{holderEmail}</span>
                </>
              ) : null}
              . New ticket references and QR codes are issued and the old ones
              stop working
              {transaction.order_qr_code ? ', and the group QR is retired' : ''}
              . If this email has no account yet, a guest account is created for
              it.
            </p>
          </div>
        ) : (
          <div className="mt-3 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            <p>
              <span className="font-semibold">Same account.</span> Nothing
              changes. The tickets are sent to this account again.
            </p>
          </div>
        )
      ) : null}

      {skippedCount > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {countLabel(skippedCount, 'ticket')} already used or no longer active{' '}
          {skippedCount === 1 ? 'stays' : 'stay'} with the current holder.
        </p>
      ) : null}

      {confirming ? (
        <div className="mt-3 rounded-lg border border-amber-300 bg-white p-3">
          <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Transfer {countLabel(moveCount, 'ticket')} to{' '}
              <span className="break-all">{recipient}</span>?
            </span>
          </p>
          <p className="mt-1 pl-6 text-xs text-muted-foreground">
            The current holder loses access to{' '}
            {moveCount === 1 ? 'this ticket' : 'these tickets'} and their old QR
            codes can no longer be scanned.
          </p>
          <div className="mt-3 flex flex-col-reverse gap-2 pl-6 sm:flex-row">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={sending}
              className="h-9 rounded-lg border border-violet-100 px-4 text-xs font-semibold text-foreground hover:bg-violet-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {sending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Yes, transfer
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <p className="mt-3 flex items-start gap-1.5 border-t border-violet-100 pt-3 text-[11px] text-muted-foreground">
        <Info className="mt-px size-3 shrink-0" />
        Email delivery isn’t set up yet, so for now the tickets are delivered to
        the customer’s account (My Tickets and a notification).
      </p>
    </form>
  )
}
