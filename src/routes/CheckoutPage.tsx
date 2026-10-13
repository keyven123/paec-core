import { Link, useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { User } from '@/data/mockUser'
import type { CheckoutResponse } from '@/services/transactionService'
import type {
  CheckoutSession,
  GuestCheckoutDetails,
} from '@/lib/checkoutSession'
import type { PublicPaymentGateway } from '@/services/marketplaceService'
import type { PaynamicsChannel } from '@/services/paymentGatewayService'
import { SignInModal } from '@/components/auth/SignInModal'
import { CheckoutGuestForm } from '@/components/checkout/CheckoutGuestForm'
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary'
import {
  CheckoutPaymentMethods,
  availablePaynamicsChannels,
} from '@/components/checkout/CheckoutPaymentMethods'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { getStoredUser, isCustomerAuthenticated } from '@/lib/auth'
import {
  clearCheckoutSession,
  loadCheckoutSession,
  validateCheckoutDetails,
} from '@/lib/checkoutSession'
import { getApiErrorMessage } from '@/lib/api'
import {
  buildOrderConfirmation,
  saveOrderConfirmation,
} from '@/lib/orderConfirmation'
import {
  clearPendingPayment,
  loadPendingPayment,
  savePendingPayment,
} from '@/lib/pendingPayment'
import { cn } from '@/lib/utils'
import { marketplaceService } from '@/services/marketplaceService'
import { transactionService } from '@/services/transactionService'

const emptyGuest: GuestCheckoutDetails = {
  firstName: '',
  lastName: '',
  address: '',
  email: '',
  confirmEmail: '',
  mobileNumber: '',
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const [guest, setGuest] = useState<GuestCheckoutDetails>(emptyGuest)
  const [guestErrors, setGuestErrors] = useState<
    Partial<Record<keyof GuestCheckoutDetails, string>>
  >({})
  const [signInOpen, setSignInOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paymentGateways, setPaymentGateways] =
    useState<Array<PublicPaymentGateway> | null>(null)
  const [selectedGatewayUuid, setSelectedGatewayUuid] = useState<string | null>(
    null,
  )
  const [paynamicsChannel, setPaynamicsChannel] =
    useState<PaynamicsChannel | null>(null)

  const isLoggedIn = isCustomerAuthenticated() && Boolean(user)
  const detailsComplete =
    Object.keys(validateCheckoutDetails(isLoggedIn, guest)).length === 0

  useEffect(() => {
    const loaded = loadCheckoutSession()
    if (!loaded) {
      void navigate({ to: '/' })
      return
    }
    setSession(loaded)
  }, [navigate])

  // Browser Back from the payment gateway (full reload or bfcache restore)
  // lands here with the gateway checkout still pending, so release it.
  useEffect(() => {
    let active = true

    const goToPaymentResult = (transactionUuid: string) =>
      void navigate({
        to: '/payment/success/$transactionUuid',
        params: { transactionUuid },
        replace: true,
      })

    const releasePendingPayment = async () => {
      const pending = loadPendingPayment()
      if (!pending) {
        setPaying(false)
        return
      }

      setPaying(true)
      try {
        const result = await transactionService.cancelPayment(
          pending.transactionUuid,
          pending.customer.isGuest ? pending.customer.email : undefined,
        )
        if (!active) return
        if (result.transaction?.payment_status === 'paid') {
          goToPaymentResult(pending.transactionUuid)
          return
        }
        toast.info(
          'Your previous payment was cancelled and the tickets were released. You can pay again.',
        )
      } catch (error) {
        if (!active) return
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          goToPaymentResult(pending.transactionUuid)
          return
        }
      }
      clearPendingPayment()
      setPaying(false)
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void releasePendingPayment()
    }

    void releasePendingPayment()
    window.addEventListener('pageshow', onPageShow)
    return () => {
      active = false
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [navigate])

  const eventUuid = session?.eventUuid
  useEffect(() => {
    if (!eventUuid) return
    let cancelled = false

    marketplaceService
      .getActivityPaymentGateways(eventUuid)
      .catch(() => [])
      .then((gateways) => {
        if (cancelled) return
        setPaymentGateways(gateways)
        setSelectedGatewayUuid(gateways[0]?.uuid ?? null)
      })

    return () => {
      cancelled = true
    }
  }, [eventUuid])

  const updateGuest = (field: keyof GuestCheckoutDetails, value: string) => {
    setGuest((prev) => ({ ...prev, [field]: value }))
    setGuestErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validateBeforeCheckout = () => {
    const errors = validateCheckoutDetails(isLoggedIn, guest)
    if (Object.keys(errors).length > 0) {
      setGuestErrors(errors)
      toast.error('Please complete all required fields')
      return false
    }
    return true
  }

  const completeOrder = (
    result: CheckoutResponse,
    customer: { name: string; email: string; isGuest: boolean },
  ) => {
    if (!session) return

    saveOrderConfirmation(buildOrderConfirmation(session, result, customer))
    clearCheckoutSession()
    void navigate({ to: '/checkout/success' })
  }

  const handlePay = async () => {
    if (!session) return
    if (!validateBeforeCheckout()) return

    const gateway =
      session.total > 0
        ? paymentGateways?.find((item) => item.uuid === selectedGatewayUuid)
        : undefined
    if (paymentGateways?.length && session.total > 0 && !gateway) {
      toast.error('Please select a payment method')
      return
    }
    if (
      gateway?.provider === 'paynamics' &&
      (!paynamicsChannel ||
        !availablePaynamicsChannels(gateway).includes(paynamicsChannel))
    ) {
      toast.error('Please choose how you want to pay')
      return
    }

    setPaying(true)
    let redirecting = false
    try {
      const cart = {
        event_uuid: session.eventUuid,
        event_location_uuid: session.eventLocationUuid || undefined,
        tickets: session.tickets.map((line) => ({
          event_ticket_uuid: line.ticketTypeId,
          quantity: line.quantity,
          valid_until: session.visitDate,
          seats: [],
        })),
        promo_code_uuid: session.appliedPromoCode?.uuid,
      }

      const loggedInUser = isLoggedIn ? user : null
      const email = loggedInUser ? loggedInUser.email : guest.email.trim()
      const customer = {
        name: loggedInUser
          ? loggedInUser.name
          : `${guest.firstName.trim()} ${guest.lastName.trim()}`.trim(),
        email,
        isGuest: !loggedInUser,
      }

      const temp = loggedInUser
        ? await transactionService.createTempTransaction(cart)
        : await transactionService.createGuestTempTransaction({
            ...cart,
            guest: {
              first_name: guest.firstName.trim(),
              last_name: guest.lastName.trim(),
              address: guest.address.trim(),
              email,
              phone_number: guest.mobileNumber.trim(),
            },
          })

      if (!gateway) {
        const result = loggedInUser
          ? await transactionService.placeOrder({
              temp_transaction_uuid: temp.uuid,
            })
          : await transactionService.guestPlaceOrder({
              temp_transaction_uuid: temp.uuid,
              email,
            })
        completeOrder(result, customer)
        return
      }

      const payload = {
        temp_transaction_uuid: temp.uuid,
        payment_gateway_uuid: gateway.uuid,
        ...(gateway.provider === 'paynamics' && paynamicsChannel
          ? { payment_channel: paynamicsChannel }
          : {}),
      }
      const result = loggedInUser
        ? await transactionService.checkout(payload)
        : await transactionService.guestCheckout({ ...payload, email })

      const redirectUrl =
        result.redirect_url ??
        result.payment?.checkout_url ??
        result.payment?.approval_url
      if (!result.transaction || !redirectUrl) {
        throw new Error('The payment page could not be opened.')
      }

      savePendingPayment({
        transactionUuid: result.transaction.uuid,
        provider: gateway.provider,
        order: session,
        customer,
      })
      redirecting = true
      window.location.assign(redirectUrl)
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Checkout failed. Please try again.'),
      )
    } finally {
      if (!redirecting) setPaying(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading checkout…</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-violet-50/30">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link
          to="/attractions/$attractionId"
          params={{ attractionId: session.attractionId }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
        >
          <ArrowLeft className="size-4" />
          Back to activity
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your order and complete your booking
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="order-2 space-y-6 lg:order-1">
            <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
              <div className="border-b border-violet-100 bg-white px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">
                  {isLoggedIn ? 'Your account' : 'Contact details'}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isLoggedIn
                    ? 'Using your saved account information'
                    : 'Required for ticket confirmation and delivery'}
                </p>
              </div>

              <div className="p-5">
                {isLoggedIn && user ? (
                  <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-paec-violet text-sm font-bold text-white">
                      {user.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <UserCircle2 className="size-4 text-emerald-600" />
                        Logged in as {user.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="mt-2 text-xs text-emerald-700">
                        Guest contact fields are not required while you are
                        signed in.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <CheckoutGuestForm
                      values={guest}
                      errors={guestErrors}
                      onChange={updateGuest}
                      disabled={paying}
                    />
                    <p className="mt-5 text-center text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setSignInOpen(true)}
                        className="font-semibold text-paec-violet hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </>
                )}
              </div>
            </section>

            {paymentGateways === null ? (
              <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
                <div className="h-4 w-48 animate-pulse rounded bg-violet-100" />
                <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />
                <div className="mt-5 h-24 animate-pulse rounded-xl bg-slate-100" />
                <div className="mt-4 h-12 animate-pulse rounded-xl bg-slate-100" />
              </section>
            ) : paymentGateways.length > 0 ? (
              <CheckoutPaymentMethods
                gateways={paymentGateways}
                selectedUuid={selectedGatewayUuid}
                onSelect={setSelectedGatewayUuid}
                paynamicsChannel={paynamicsChannel}
                onPaynamicsChannelChange={setPaynamicsChannel}
                total={session.total}
                detailsComplete={detailsComplete}
                paying={paying}
                onPay={() => void handlePay()}
              />
            ) : (
              <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
                <div className="border-b border-violet-100 px-5 py-4">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <CreditCard className="size-4 text-paec-violet" />
                    Payment
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Confirm your booking to receive your tickets
                  </p>
                </div>
                <div className="p-5">
                  <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-6 text-center">
                    <ShieldCheck className="mx-auto size-8 text-paec-violet/50" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No online payment needed for now
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your booking is confirmed and your tickets are issued
                      right away.
                    </p>

                    <Button
                      type="button"
                      onClick={() => void handlePay()}
                      disabled={paying}
                      className={cn(
                        'mt-4 h-11 min-w-[140px] rounded-xl bg-paec-violet px-8 text-sm font-semibold hover:bg-paec-violet-dark',
                      )}
                    >
                      <CreditCard className="size-4" />
                      {paying ? 'Processing…' : 'Pay'}
                    </Button>
                  </div>
                </div>
              </section>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-emerald-600 lg:hidden">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                Instant confirmation
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                Secure checkout
              </span>
            </div>
          </div>

          <div className="order-1 lg:sticky lg:top-20 lg:order-2">
            <CheckoutOrderSummary session={session} />

            <div className="mt-4 hidden flex-wrap gap-x-4 gap-y-2 text-xs text-emerald-600 lg:flex">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                Instant confirmation
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                Secure checkout
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSuccess={() => {
          setUser(getStoredUser())
          setGuestErrors({})
          setSignInOpen(false)
        }}
      />
    </div>
  )
}
