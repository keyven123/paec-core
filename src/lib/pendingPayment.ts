import type { CheckoutSession } from '@/lib/checkoutSession'
import type { PaymentGatewayProvider } from '@/services/paymentGatewayService'

// localStorage: e-wallet apps can send the customer back in a new tab.
const PENDING_PAYMENT_KEY = 'paec_pending_payment'

export type PendingPayment = {
  transactionUuid: string
  provider: PaymentGatewayProvider
  order: CheckoutSession
  customer: { name: string; email: string; isGuest: boolean }
}

export function savePendingPayment(payment: PendingPayment): void {
  localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payment))
}

export function loadPendingPayment(
  transactionUuid?: string,
): PendingPayment | null {
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_KEY)
    if (!raw) return null
    const payment = JSON.parse(raw) as PendingPayment
    if (!payment.transactionUuid) return null
    return !transactionUuid || payment.transactionUuid === transactionUuid
      ? payment
      : null
  } catch {
    return null
  }
}

export function clearPendingPayment(): void {
  localStorage.removeItem(PENDING_PAYMENT_KEY)
}
