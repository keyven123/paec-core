import { Link, useNavigate, useParams } from '@tanstack/react-router'
import axios from 'axios'
import {
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PendingPayment } from '@/lib/pendingPayment'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api'
import { isCustomerAuthenticated } from '@/lib/auth'
import {
  clearCheckoutSession,
  loadCheckoutSession,
} from '@/lib/checkoutSession'
import {
  buildGroupOrderConfirmations,
  buildOrderConfirmation,
  saveOrderConfirmation,
} from '@/lib/orderConfirmation'
import {
  clearPendingPayment,
  loadPendingPayment,
  pendingPaymentSummary,
} from '@/lib/pendingPayment'
import { cn } from '@/lib/utils'
import { getProviderMeta } from '@/services/paymentGatewayService'
import { transactionService } from '@/services/transactionService'

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 5

type VerifyState =
  | { status: 'verifying' }
  | { status: 'pending' }
  | { status: 'paid-elsewhere' }
  | { status: 'missing' }
  | { status: 'failed'; message: string }

export function PaymentSuccessReturnPage() {
  const { transactionUuid } = useParams({
    from: '/payment/success/$transactionUuid',
  })
  const navigate = useNavigate()
  const [pending] = useState(() => loadPendingPayment(transactionUuid))
  const [state, setState] = useState<VerifyState>({ status: 'verifying' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!pending && !isCustomerAuthenticated()) {
      setState({ status: 'missing' })
      return
    }

    const guestEmail = pending?.customer.isGuest
      ? pending.customer.email
      : undefined
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const verify = async (round: number) => {
      try {
        const result = await transactionService.completePayment(
          transactionUuid,
          guestEmail,
        )
        if (cancelled) return

        if (result.success && result.transaction?.payment_status === 'paid') {
          if (!pending) {
            setState({ status: 'paid-elsewhere' })
            return
          }
          saveOrderConfirmation(
            pending.orders && result.orders
              ? buildGroupOrderConfirmations(
                  pending.orders,
                  result.orders,
                  pending.customer,
                )
              : buildOrderConfirmation(pending.order, result, pending.customer),
          )
          clearCheckoutSession()
          clearPendingPayment()
          void navigate({ to: '/checkout/success', replace: true })
          return
        }

        if (result.transaction?.payment_status === 'pending') {
          if (round < MAX_POLLS) {
            timer = setTimeout(() => void verify(round + 1), POLL_INTERVAL_MS)
          } else {
            setState({ status: 'pending' })
          }
          return
        }

        clearPendingPayment()
        setState({
          status: 'failed',
          message:
            result.message ??
            'Your payment was not completed. No charge was made.',
        })
      } catch (error) {
        if (cancelled) return
        setState({
          status: 'failed',
          message: getApiErrorMessage(
            error,
            'We could not confirm your payment. Please try again.',
          ),
        })
      }
    }

    setState({ status: 'verifying' })
    void verify(1)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [attempt, navigate, pending, transactionUuid])

  const retry = () => setAttempt((value) => value + 1)
  const providerLabel = pending
    ? getProviderMeta(pending.provider).label
    : 'the payment provider'

  if (state.status === 'verifying') {
    return (
      <ReturnShell
        icon={Loader2}
        tone="violet"
        spin
        title="Confirming your payment…"
        description={`We're checking with ${providerLabel}. This only takes a moment — please don't close this page.`}
        pending={pending}
      />
    )
  }

  if (state.status === 'pending') {
    return (
      <ReturnShell
        icon={Clock}
        tone="amber"
        title="Still waiting for confirmation"
        description={`${providerLabel} hasn't confirmed your payment yet. Some e-wallet and bank payments take a few minutes.`}
        pending={pending}
      >
        <Button
          type="button"
          onClick={retry}
          className="h-11 w-full rounded-xl bg-paec-violet font-semibold hover:bg-paec-violet-dark"
        >
          <RotateCcw className="size-4" />
          Check again
        </Button>
      </ReturnShell>
    )
  }

  if (state.status === 'paid-elsewhere') {
    return (
      <ReturnShell
        icon={CheckCircle2}
        tone="emerald"
        title="Payment received"
        description="Your booking is confirmed and your tickets have been sent to your email."
        pending={pending}
      >
        <HomeButton />
      </ReturnShell>
    )
  }

  if (state.status === 'missing') {
    return (
      <ReturnShell
        icon={ShieldCheck}
        tone="violet"
        title="Open this link on the device you paid from"
        description="We couldn't find this order in this browser. If your payment went through, your tickets will be emailed to you."
        pending={pending}
      >
        <HomeButton />
      </ReturnShell>
    )
  }

  return (
    <ReturnShell
      icon={XCircle}
      tone="red"
      title="Payment not completed"
      description={state.message}
      pending={pending}
    >
      <BackToCheckoutButton />
    </ReturnShell>
  )
}

export function PaymentCancelReturnPage() {
  const { transactionUuid } = useParams({
    from: '/payment/cancel/$transactionUuid',
  })
  const navigate = useNavigate()
  const [pending] = useState(() => loadPendingPayment(transactionUuid))
  const [releasing, setReleasing] = useState(true)

  useEffect(() => {
    if (!pending && !isCustomerAuthenticated()) {
      setReleasing(false)
      return
    }

    let cancelled = false
    const guestEmail = pending?.customer.isGuest
      ? pending.customer.email
      : undefined

    transactionService
      .cancelPayment(transactionUuid, guestEmail)
      .then((result) => {
        if (cancelled) return
        if (result.transaction?.payment_status === 'paid') {
          void navigate({
            to: '/payment/success/$transactionUuid',
            params: { transactionUuid },
            replace: true,
          })
          return
        }
        clearPendingPayment()
        setReleasing(false)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          void navigate({
            to: '/payment/success/$transactionUuid',
            params: { transactionUuid },
            replace: true,
          })
          return
        }
        clearPendingPayment()
        setReleasing(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate, pending, transactionUuid])

  if (releasing) {
    return (
      <ReturnShell
        icon={Loader2}
        tone="violet"
        spin
        title="Cancelling your payment…"
        description="Releasing the tickets you were holding."
        pending={pending}
      />
    )
  }

  return (
    <ReturnShell
      icon={XCircle}
      tone="slate"
      title="Payment cancelled"
      description="No payment was taken and the tickets you were holding have been released. You can go back and try again whenever you're ready."
      pending={pending}
    >
      <BackToCheckoutButton />
    </ReturnShell>
  )
}

const TONES = {
  violet: 'bg-violet-100 text-paec-violet',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  red: 'bg-red-100 text-red-600',
  slate: 'bg-slate-100 text-slate-500',
} as const

function ReturnShell({
  icon: Icon,
  tone,
  spin = false,
  title,
  description,
  pending,
  children,
}: {
  icon: LucideIcon
  tone: keyof typeof TONES
  spin?: boolean
  title: string
  description: string
  pending: PendingPayment | null
  children?: ReactNode
}) {
  return (
    <div className="min-h-screen bg-violet-50/30">
      <Header />
      <main className="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <section className="w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 text-center shadow-sm sm:p-8">
          <span
            className={cn(
              'mx-auto flex size-14 items-center justify-center rounded-full',
              TONES[tone],
            )}
          >
            <Icon className={cn('size-7', spin && 'animate-spin')} />
          </span>
          <h1 className="mt-5 text-xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          {pending ? (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 text-left">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {pendingPaymentSummary(pending).label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Paying with {getProviderMeta(pending.provider).label}
                </p>
              </div>
              <p className="shrink-0 text-base font-bold text-paec-violet">
                ₱{pendingPaymentSummary(pending).total.toLocaleString()}
              </p>
            </div>
          ) : null}

          {children ? <div className="mt-6 space-y-2">{children}</div> : null}
        </section>
      </main>
      <Footer />
    </div>
  )
}

function BackToCheckoutButton() {
  // Signed-in customers keep their cart, so checkout always has something to show.
  const hasCheckout =
    isCustomerAuthenticated() || Boolean(loadCheckoutSession())

  return (
    <Button
      asChild
      className="h-11 w-full rounded-xl bg-paec-violet font-semibold hover:bg-paec-violet-dark"
    >
      <Link to={hasCheckout ? '/checkout' : '/'}>
        {hasCheckout ? 'Back to checkout' : 'Back to home'}
      </Link>
    </Button>
  )
}

function HomeButton() {
  return (
    <Button
      asChild
      className="h-11 w-full rounded-xl bg-paec-violet font-semibold hover:bg-paec-violet-dark"
    >
      <Link to="/">Continue exploring</Link>
    </Button>
  )
}
