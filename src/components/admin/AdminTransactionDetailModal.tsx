import {
  CalendarClock,
  CalendarDays,
  CreditCard,
  Loader2,
  Mail,
  QrCode,
  Ticket,
  User,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import type { AdminTransactionDetail } from '@/services/adminTransactionService'
import {
  AdminRescheduleTicketsPanel,
  canRescheduleTransaction,
} from '@/components/admin/AdminRescheduleTicketsPanel'
import {
  AdminSendTicketsPanel,
  getSendableTickets,
} from '@/components/admin/AdminSendTicketsPanel'
import {
  formatCurrency,
  formatDateTime,
  formatTime,
  formatVisitDate,
  getVisitDate,
  statusBadgeClass,
} from '@/components/admin/transactionFormat'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { adminTransactionService } from '@/services/adminTransactionService'

type AdminTransactionDetailModalProps = {
  transactionUuid: string | null
  onClose: () => void
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        statusBadgeClass(status),
      )}
    >
      {status}
    </span>
  )
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {icon}
        {title}
      </h3>
      <dl className="space-y-2">{children}</dl>
    </section>
  )
}

function InfoRow({
  label,
  children,
  mono = false,
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-right font-medium break-words text-foreground',
          mono && 'font-mono text-xs',
        )}
      >
        {children || '—'}
      </dd>
    </div>
  )
}

export function AdminTransactionDetailModal({
  transactionUuid,
  onClose,
}: AdminTransactionDetailModalProps) {
  const [transaction, setTransaction] = useState<AdminTransactionDetail | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendOpen, setSendOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)

  const load = useCallback(async (uuid: string) => {
    setLoading(true)
    setError(null)
    try {
      setTransaction(await adminTransactionService.show(uuid))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load the transaction.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setTransaction(null)
    setSendOpen(false)
    setRescheduleOpen(false)
    if (transactionUuid) void load(transactionUuid)
  }, [transactionUuid, load])

  useEffect(() => {
    if (!transactionUuid) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [transactionUuid, onClose])

  if (!transactionUuid) return null

  const tickets = transaction?.tickets ?? []
  const issuedTickets = tickets.filter(
    (ticket) => ticket.status !== 'transferred',
  )
  const transferredCount = tickets.length - issuedTickets.length
  const canSend =
    transaction?.payment_status === 'paid' &&
    getSendableTickets(tickets).length > 0
  const canReschedule = canRescheduleTransaction(transaction)
  const orders = transaction?.transaction_orders ?? []
  const scheduleStart = formatTime(transaction?.schedule_time?.time_start)
  const scheduleEnd = formatTime(transaction?.schedule_time?.time_end)
  const discount = Number(transaction?.display_discount ?? 0)
  const taxes = Number(transaction?.tax_amount ?? 0)
  const usedCount = tickets.filter((ticket) => ticket.status === 'used').length

  const ticketTypeLabel = (() => {
    const fromOrders = orders
      .map((order) => {
        const name = order.event_ticket?.name?.trim()
        if (!name) return null
        const qty = order.quantity ?? 0
        return qty > 1 ? `${name} × ${qty}` : name
      })
      .filter((value): value is string => Boolean(value))

    if (fromOrders.length > 0) return fromOrders.join(', ')

    const uniqueTypes = [
      ...new Set(
        issuedTickets
          .map((ticket) => ticket.ticket_type?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ]
    return uniqueTypes.length > 0 ? uniqueTypes.join(', ') : null
  })()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close transaction details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-violet-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Transaction details
            </p>
            <h2
              id="transaction-detail-title"
              className="mt-0.5 truncate font-mono text-lg font-bold text-foreground"
            >
              {transaction?.order_number ?? 'Loading…'}
            </h2>
            {transaction ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge status={transaction.order_status} />
                <span>Payment</span>
                <StatusBadge status={transaction.payment_status} />
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canReschedule ? (
              <button
                type="button"
                onClick={() => {
                  setRescheduleOpen((open) => !open)
                  setSendOpen(false)
                }}
                aria-expanded={rescheduleOpen}
                aria-label="Reschedule"
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors',
                  rescheduleOpen
                    ? 'bg-paec-violet text-white hover:bg-paec-violet/90'
                    : 'border border-violet-200 text-paec-violet hover:bg-violet-50',
                )}
              >
                <CalendarClock className="size-4" />
                <span className="hidden sm:inline">Reschedule</span>
              </button>
            ) : null}
            {canSend ? (
              <button
                type="button"
                onClick={() => {
                  setSendOpen((open) => !open)
                  setRescheduleOpen(false)
                }}
                aria-expanded={sendOpen}
                aria-label="Send to Email"
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors',
                  sendOpen
                    ? 'bg-paec-violet text-white hover:bg-paec-violet/90'
                    : 'border border-violet-200 text-paec-violet hover:bg-violet-50',
                )}
              >
                <Mail className="size-4" />
                <span className="hidden sm:inline">Send to Email</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading && !transaction ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading transaction…
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void load(transactionUuid)}
                className="mt-3 rounded-lg border border-violet-100 px-4 py-2 text-xs font-semibold text-paec-violet hover:bg-violet-50"
              >
                Try again
              </button>
            </div>
          ) : transaction ? (
            <div className="space-y-5">
              {rescheduleOpen && canReschedule ? (
                <AdminRescheduleTicketsPanel
                  key={`reschedule-${transaction.uuid}-${getVisitDate(transaction) ?? 'none'}`}
                  transaction={transaction}
                  onCancel={() => setRescheduleOpen(false)}
                  onSaved={() => {
                    setRescheduleOpen(false)
                    void load(transaction.uuid)
                  }}
                />
              ) : null}
              {sendOpen && canSend ? (
                <AdminSendTicketsPanel
                  key={transaction.uuid}
                  transaction={transaction}
                  onCancel={() => setSendOpen(false)}
                  onSent={() => {
                    setSendOpen(false)
                    void load(transaction.uuid)
                  }}
                />
              ) : null}
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard
                  icon={<User className="size-3.5 text-paec-violet" />}
                  title="Buyer"
                >
                  <InfoRow label="Name">{transaction.user?.name}</InfoRow>
                  <InfoRow label="Email">{transaction.user?.email}</InfoRow>
                  <InfoRow label="Phone">
                    {transaction.user?.phone_number}
                  </InfoRow>
                </InfoCard>

                <InfoCard
                  icon={<CalendarDays className="size-3.5 text-paec-violet" />}
                  title="Booking"
                >
                  <InfoRow label="Attraction">
                    {transaction.event?.event_name ?? transaction.event?.name}
                  </InfoRow>
                  <InfoRow label="Date of visit">
                    {formatVisitDate(getVisitDate(transaction))}
                  </InfoRow>
                  {scheduleStart ? (
                    <InfoRow label="Time">
                      {scheduleEnd
                        ? `${scheduleStart} – ${scheduleEnd}`
                        : scheduleStart}
                    </InfoRow>
                  ) : null}
                  <InfoRow label="Ticket type">{ticketTypeLabel}</InfoRow>
                  <InfoRow label="Tickets">
                    {issuedTickets.length}
                    {usedCount > 0 ? ` (${usedCount} used)` : ''}
                  </InfoRow>
                </InfoCard>

                <InfoCard
                  icon={<CreditCard className="size-3.5 text-paec-violet" />}
                  title="Payment"
                >
                  <InfoRow label="Method">
                    <span className="capitalize">
                      {transaction.payment_provider ?? 'Free / manual'}
                    </span>
                  </InfoRow>
                  <InfoRow label="Reference" mono>
                    {transaction.payment_id}
                  </InfoRow>
                  <InfoRow
                    label="Wallet ID"
                    mono={!!transaction.paybiz_wallet_id}
                  >
                    {transaction.paybiz_wallet_id ?? (
                      <span className="font-normal text-muted-foreground">
                        N/A
                      </span>
                    )}
                  </InfoRow>
                  <InfoRow label="Created">
                    {formatDateTime(transaction.created_at)}
                  </InfoRow>
                  <InfoRow label="Paid at">
                    {formatDateTime(transaction.paid_at)}
                  </InfoRow>
                </InfoCard>
              </div>

              <section className="overflow-hidden rounded-xl border border-violet-100">
                <h3 className="border-b border-violet-100 bg-violet-50/50 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Order summary
                </h3>
                <div className="divide-y divide-violet-50">
                  {orders.map((order, index) => (
                    <div
                      key={order.uuid ?? index}
                      className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {order.event_ticket?.name ?? 'Ticket'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.quantity ?? 0} ×{' '}
                          {formatCurrency(
                            order.display_unit_price ?? order.price,
                          )}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-foreground">
                        {formatCurrency(
                          (order.display_unit_price ??
                            Number(order.price ?? 0)) * (order.quantity ?? 0),
                        )}
                      </p>
                    </div>
                  ))}
                </div>
                <dl className="space-y-1.5 border-t border-violet-100 bg-violet-50/20 px-4 py-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Subtotal</dt>
                    <dd>
                      {formatCurrency(
                        transaction.display_subtotal ?? transaction.sub_total,
                      )}
                    </dd>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between text-emerald-700">
                      <dt>
                        Discount
                        {transaction.promo_code
                          ? ` (${transaction.promo_code.code})`
                          : ''}
                      </dt>
                      <dd>−{formatCurrency(discount)}</dd>
                    </div>
                  ) : null}
                  {taxes > 0 ? (
                    <div className="flex justify-between text-muted-foreground">
                      <dt>
                        {transaction.taxes_and_fees_label ?? 'Taxes and fees'}
                      </dt>
                      <dd>{formatCurrency(taxes)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between pt-1 text-base font-bold text-foreground">
                    <dt>Total</dt>
                    <dd>{formatCurrency(transaction.total_amount)}</dd>
                  </div>
                </dl>
              </section>

              {transaction.order_qr_code && issuedTickets.length > 1 ? (
                <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm">
                  <Users className="mt-0.5 size-4 shrink-0 text-paec-violet" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      Group QR:{' '}
                      <span className="font-mono text-xs break-all text-paec-violet">
                        {transaction.order_qr_code}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Scanning it admits all unused tickets in this order at
                      once.
                    </p>
                  </div>
                </div>
              ) : null}

              {transaction.affiliate_partner ? (
                <div className="rounded-xl border border-violet-100 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Affiliate: </span>
                  <span className="font-medium text-foreground">
                    {transaction.affiliate_partner.name}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    ({transaction.affiliate_partner.email})
                  </span>
                  {transaction.affiliate_commission_amount != null ? (
                    <span className="text-muted-foreground">
                      {' · '}Commission{' '}
                      {formatCurrency(transaction.affiliate_commission_amount)}
                      {transaction.affiliate_commission_percent != null
                        ? ` (${transaction.affiliate_commission_percent}%)`
                        : ''}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Ticket className="size-4 text-paec-violet" />
                  Tickets ({issuedTickets.length})
                  {transferredCount > 0 ? (
                    <span className="font-normal text-muted-foreground">
                      · {transferredCount} transferred
                    </span>
                  ) : null}
                </h3>
                {tickets.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-violet-200 px-4 py-6 text-center text-sm text-muted-foreground">
                    {transaction.order_status === 'cancelled'
                      ? 'This order was cancelled, so its tickets were released.'
                      : 'No tickets have been issued for this order yet.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-violet-100">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="border-b border-violet-100 bg-violet-50/50 text-left text-xs text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">#</th>
                          <th className="px-3 py-2 font-medium">
                            Ticket reference
                          </th>
                          <th className="px-3 py-2 font-medium">Type</th>
                          <th className="px-3 py-2 font-medium">Attendee</th>
                          <th className="px-3 py-2 font-medium">QR code</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-violet-50">
                        {tickets.map((ticket, index) => (
                          <tr
                            key={ticket.uuid}
                            className={cn(
                              'align-top',
                              ticket.status === 'transferred' &&
                                'bg-slate-50/60 text-muted-foreground opacity-70',
                            )}
                          >
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-xs text-foreground">
                              {ticket.ticket_number ?? '—'}
                              {ticket.seat ? (
                                <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                                  Seat {ticket.seat}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5 text-foreground">
                              {ticket.ticket_type ?? '—'}
                              {ticket.location ? (
                                <p className="text-[11px] text-muted-foreground">
                                  {ticket.location}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5">
                              <p className="text-foreground">
                                {ticket.attendee_name ?? '—'}
                              </p>
                              {ticket.attendee_email ? (
                                <p className="text-[11px] text-muted-foreground">
                                  {ticket.attendee_email}
                                </p>
                              ) : null}
                              {ticket.attendee_contact ? (
                                <p className="text-[11px] text-muted-foreground">
                                  {ticket.attendee_contact}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5">
                              {ticket.qr_code ? (
                                <span className="inline-flex items-center gap-1 font-mono text-xs text-paec-violet">
                                  <QrCode className="size-3 shrink-0" />
                                  {ticket.qr_code}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <StatusBadge status={ticket.status} />
                              {ticket.used_at ? (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {formatDateTime(ticket.used_at)}
                                </p>
                              ) : null}
                              {ticket.transferred_to ? (
                                <p className="mt-1 text-[11px] break-all text-muted-foreground">
                                  to {ticket.transferred_to}
                                </p>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
