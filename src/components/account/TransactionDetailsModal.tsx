import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import type {
  CustomerTransaction,
  TransactionOrder,
} from '@/services/transactionService'

type TransactionDetailsModalProps = {
  open: boolean
  transaction: CustomerTransaction | null
  onClose: () => void
}

function parseAmount(value: number | string | null | undefined): number {
  const n = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(value: number | string | null | undefined): string {
  return `₱${parseAmount(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatVisitDate(value?: string | null): string | null {
  if (!value) return null
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function displaySubtotal(transaction: CustomerTransaction): number {
  if (transaction.display_subtotal != null) {
    return parseAmount(transaction.display_subtotal)
  }
  return (
    parseAmount(transaction.sub_total) +
    parseAmount(transaction.markup_amount) +
    parseAmount(transaction.markup_discount)
  )
}

function displayDiscount(transaction: CustomerTransaction): number {
  if (transaction.display_discount != null) {
    return parseAmount(transaction.display_discount)
  }
  return parseAmount(transaction.discount) + parseAmount(transaction.markup_discount)
}

function orderUnitPrice(order: TransactionOrder): number {
  if (order.display_unit_price != null) {
    return parseAmount(order.display_unit_price)
  }
  const qty = Math.max(1, Number(order.quantity) || 1)
  const markupGross =
    order.line_markup_gross != null
      ? parseAmount(order.line_markup_gross)
      : parseAmount(order.markup) + parseAmount(order.markup_discount)
  return parseAmount(order.price) + markupGross / qty
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'confirmed' || s === 'paid') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (s === 'pending') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (s === 'cancelled' || s === 'failed') {
    return 'border-red-200 bg-red-50 text-red-700'
  }
  return 'border-violet-200 bg-violet-50 text-paec-violet'
}

function DetailField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  )
}

export function TransactionDetailsModal({
  open,
  transaction,
  onClose,
}: TransactionDetailsModalProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open || !transaction) return null

  const visitDate = formatVisitDate(
    transaction.transaction_orders?.find((o) => o.valid_until)?.valid_until,
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close transaction details"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-details-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-violet-100 px-5 py-4">
          <div>
            <h2
              id="transaction-details-title"
              className="text-lg font-bold text-foreground"
            >
              Transaction details
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {transaction.order_number}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <section className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
            <h3 className="text-xs font-bold tracking-wide text-paec-violet uppercase">
              Order information
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <DetailField label="Activity">
                {transaction.event?.name ?? transaction.event?.event_name ?? '—'}
              </DetailField>
              <DetailField label="Order status">
                <span
                  className={cn(
                    'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
                    statusBadgeClass(transaction.order_status),
                  )}
                >
                  {transaction.order_status}
                </span>
              </DetailField>
              <DetailField label="Payment provider">
                {transaction.payment_provider ?? '—'}
              </DetailField>
              <DetailField label="Tickets">
                {transaction.tickets_count ?? '—'}
              </DetailField>
              {visitDate ? (
                <DetailField label="Date of visit">{visitDate}</DetailField>
              ) : null}
              <DetailField label="Paid at">
                {formatDateTime(transaction.paid_at)}
              </DetailField>
              <DetailField label="Created at">
                {formatDateTime(transaction.created_at)}
              </DetailField>
            </div>
          </section>

          {transaction.transaction_orders?.length ? (
            <section className="rounded-xl border border-violet-100 p-4">
              <h3 className="text-xs font-bold tracking-wide text-paec-violet uppercase">
                Items
              </h3>
              <div className="mt-3 space-y-3">
                {transaction.transaction_orders.map((order) => (
                  <div
                    key={order.uuid}
                    className="rounded-lg border border-violet-100 bg-white px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {order.event_ticket?.name ?? 'Ticket'}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {order.quantity} × {formatCurrency(orderUnitPrice(order))}
                        </p>
                        {order.valid_until ? (
                          <p className="mt-1 text-xs text-paec-violet">
                            Visit: {formatVisitDate(order.valid_until)}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-violet-100 p-4">
            <h3 className="text-xs font-bold tracking-wide text-paec-violet uppercase">
              Payment summary
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(displaySubtotal(transaction))}</span>
              </div>
              {displayDiscount(transaction) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-red-600">
                    −{formatCurrency(displayDiscount(transaction))}
                  </span>
                </div>
              ) : null}
              {parseAmount(transaction.promo_code_discount) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Promo
                    {transaction.promo_code?.code
                      ? ` (${transaction.promo_code.code})`
                      : ''}
                  </span>
                  <span className="text-red-600">
                    −{formatCurrency(transaction.promo_code_discount)}
                  </span>
                </div>
              ) : null}
              {parseAmount(transaction.tax_amount) > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes & fees</span>
                  <span>{formatCurrency(transaction.tax_amount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-violet-100 pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(transaction.total_amount)}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-violet-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-paec-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-paec-violet-dark"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
