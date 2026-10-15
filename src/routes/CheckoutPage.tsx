import { Link, useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Plus,
  ShieldCheck,
  ShoppingCart,
  UserCircle2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { CheckoutResponse } from '@/services/transactionService'
import type {
  CheckoutSession,
  GuestCheckoutDetails,
} from '@/lib/checkoutSession'
import type { CartItem } from '@/services/cartService'
import type { PublicPaymentGateway } from '@/services/marketplaceService'
import type { PaynamicsChannel } from '@/services/paymentGatewayService'
import { SignInModal } from '@/components/auth/SignInModal'
import { CartItemCard } from '@/components/checkout/CartItemCard'
import { CartOrderSummary } from '@/components/checkout/CartOrderSummary'
import { CheckoutGuestForm } from '@/components/checkout/CheckoutGuestForm'
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary'
import { CheckoutPaymentUnavailable } from '@/components/checkout/CheckoutPaymentUnavailable'
import {
  CheckoutPaymentMethods,
  availablePaynamicsChannels,
} from '@/components/checkout/CheckoutPaymentMethods'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { useStoredUser } from '@/lib/useStoredUser'
import { addSessionToCart, cartItemPayload, cartItemSession } from '@/lib/cart'
import {
  clearCheckoutSession,
  loadCheckoutSession,
  saveCheckoutSession,
  validateCheckoutDetails,
} from '@/lib/checkoutSession'
import { getApiErrorMessage } from '@/lib/api'
import {
  buildGroupOrderConfirmations,
  buildOrderConfirmation,
  saveOrderConfirmation,
} from '@/lib/orderConfirmation'
import {
  clearPendingPayment,
  loadPendingPayment,
  savePendingPayment,
} from '@/lib/pendingPayment'
import { cn } from '@/lib/utils'
import { cartService } from '@/services/cartService'
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

/** Payment methods every activity in the cart accepts, so one payment can cover them all. */
function sharedGateways(
  lists: Array<Array<PublicPaymentGateway>>,
): Array<PublicPaymentGateway> {
  const [first = [], ...rest] = lists
  return first.filter((gateway) =>
    rest.every((list) => list.some((other) => other.uuid === gateway.uuid)),
  )
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const user = useStoredUser()
  const isLoggedIn = Boolean(user)
  // Guests check out a single activity; signed-in customers check out their cart.
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [cartItems, setCartItems] = useState<Array<CartItem> | null>(null)
  const [busyItem, setBusyItem] = useState<string | null>(null)
  // e.g. opened from the cart reminder email while signed out.
  const [signedOutWithoutBooking, setSignedOutWithoutBooking] = useState(false)
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

  const detailsComplete =
    Object.keys(validateCheckoutDetails(isLoggedIn, guest)).length === 0

  const cartEntries = useMemo(
    () =>
      (cartItems ?? []).map((item) => ({
        item,
        session: cartItemSession(item),
      })),
    [cartItems],
  )
  const orderTotal = isLoggedIn
    ? cartEntries.reduce((sum, entry) => sum + entry.session.total, 0)
    : (session?.total ?? 0)

  useEffect(() => {
    if (!isLoggedIn) {
      setCartItems(null)
      const loaded = loadCheckoutSession()
      setSession(loaded)
      setSignedOutWithoutBooking(!loaded)
      return
    }

    let active = true
    const loadCart = async () => {
      // Tickets picked before signing in move into the customer's cart.
      const guestSession = loadCheckoutSession()
      if (guestSession) {
        clearCheckoutSession()
        try {
          await addSessionToCart(guestSession)
        } catch (error) {
          saveCheckoutSession(guestSession)
          toast.error(
            getApiErrorMessage(
              error,
              'We could not move your tickets to your cart.',
            ),
          )
        }
      }

      try {
        const { items } = await cartService.get()
        if (active) setCartItems(items)
      } catch (error) {
        if (!active) return
        toast.error(getApiErrorMessage(error, 'We could not load your cart.'))
        setCartItems([])
      }
    }

    void loadCart()
    return () => {
      active = false
    }
  }, [isLoggedIn])

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

  const gatewayEvents = (
    isLoggedIn
      ? Array.from(new Set(cartEntries.map((entry) => entry.item.event_uuid)))
      : session
        ? [session.eventUuid]
        : []
  ).join(',')

  useEffect(() => {
    if (!gatewayEvents) return
    let cancelled = false
    setPaymentGateways(null)

    void Promise.all(
      gatewayEvents
        .split(',')
        .map((eventUuid) =>
          marketplaceService
            .getActivityPaymentGateways(eventUuid)
            .catch(() => []),
        ),
    ).then((lists) => {
      if (cancelled) return
      const gateways = sharedGateways(lists)
      setPaymentGateways(gateways)
      setSelectedGatewayUuid((current) =>
        gateways.some((gateway) => gateway.uuid === current)
          ? current
          : (gateways[0]?.uuid ?? null),
      )
    })

    return () => {
      cancelled = true
    }
  }, [gatewayEvents])

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

  const refreshCart = async () => {
    try {
      const { items } = await cartService.get()
      setCartItems(items)
    } catch {
      // Keep showing the last known cart.
    }
  }

  const changeQuantity = async (
    item: CartItem,
    current: CheckoutSession,
    ticketTypeId: string,
    delta: number,
  ) => {
    const tickets = current.tickets.map((line) =>
      line.ticketTypeId === ticketTypeId
        ? { ...line, quantity: Math.max(0, line.quantity + delta) }
        : line,
    )
    if (tickets.every((line) => line.quantity === 0)) return

    setBusyItem(item.uuid)
    try {
      const { items } = await cartService.updateItem(
        item.uuid,
        cartItemPayload({ ...current, tickets }),
      )
      setCartItems(items)
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'We could not update the quantity.'),
      )
    } finally {
      setBusyItem(null)
    }
  }

  const removeItem = async (item: CartItem, name: string) => {
    setBusyItem(item.uuid)
    try {
      const { items } = await cartService.removeItem(item.uuid)
      setCartItems(items)
      toast.success(`${name} was removed from your cart`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'We could not remove it.'))
    } finally {
      setBusyItem(null)
    }
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
    if (isLoggedIn ? cartEntries.length === 0 : !session) return
    if (busyItem) return
    if (!validateBeforeCheckout()) return

    const gateway =
      orderTotal > 0
        ? paymentGateways?.find((item) => item.uuid === selectedGatewayUuid)
        : undefined
    if (orderTotal > 0 && !gateway) {
      toast.error(
        paymentGateways?.length
          ? 'Please select a payment method'
          : 'Payment is not available for this order yet',
      )
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
      const loggedInUser = isLoggedIn ? user : null
      const email = loggedInUser ? loggedInUser.email : guest.email.trim()
      const customer = {
        name: loggedInUser
          ? loggedInUser.name
          : `${guest.firstName.trim()} ${guest.lastName.trim()}`.trim(),
        email,
        isGuest: !loggedInUser,
      }
      const paynamicsPayload =
        gateway?.provider === 'paynamics' && paynamicsChannel
          ? { payment_channel: paynamicsChannel }
          : {}

      if (loggedInUser) {
        const result = await cartService.checkout({
          payment_gateway_uuid: gateway?.uuid,
          ...paynamicsPayload,
        })
        const placed = result.orders ?? []
        const orders = placed.flatMap((placedOrder) => {
          const entry = cartEntries.find(
            (cartEntry) => cartEntry.item.uuid === placedOrder.cart_item_uuid,
          )
          return entry
            ? [
                {
                  transactionUuid: placedOrder.transaction.uuid,
                  order: entry.session,
                },
              ]
            : []
        })

        if (!gateway) {
          saveOrderConfirmation(
            buildGroupOrderConfirmations(orders, placed, customer),
          )
          void navigate({ to: '/checkout/success' })
          return
        }

        const redirectUrl =
          result.redirect_url ?? result.payment?.checkout_url ?? undefined
        if (!result.transaction || !redirectUrl || orders.length === 0) {
          throw new Error('The payment page could not be opened.')
        }

        savePendingPayment({
          transactionUuid: result.transaction.uuid,
          provider: gateway.provider,
          order: orders[0].order,
          orders,
          customer,
        })
        redirecting = true
        window.location.assign(redirectUrl)
        return
      }

      if (!session) return
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

      const temp = await transactionService.createGuestTempTransaction({
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
        const result = await transactionService.guestPlaceOrder({
          temp_transaction_uuid: temp.uuid,
          email,
        })
        completeOrder(result, customer)
        return
      }

      const result = await transactionService.guestCheckout({
        temp_transaction_uuid: temp.uuid,
        payment_gateway_uuid: gateway.uuid,
        ...paynamicsPayload,
        email,
      })

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
      if (isLoggedIn) void refreshCart()
    } finally {
      if (!redirecting) setPaying(false)
    }
  }

  const loading = isLoggedIn ? cartItems === null : !session

  if (!isLoggedIn && signedOutWithoutBooking) {
    return (
      <div className="min-h-screen bg-violet-50/30">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-violet-100 text-paec-violet">
            <ShoppingCart className="size-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-foreground">
            Sign in to see your cart
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tickets you added while signed in are saved in your cart, ready for
            payment.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="rounded-xl bg-paec-violet px-6 hover:bg-paec-violet-dark"
            >
              Sign in
            </Button>
            <Button asChild variant="outline" className="rounded-xl px-6">
              <Link to="/">Browse activities</Link>
            </Button>
          </div>
        </main>
        <Footer />
        <SignInModal
          open={signInOpen}
          onClose={() => setSignInOpen(false)}
          onSuccess={() => setSignInOpen(false)}
        />
      </div>
    )
  }

  if (loading) {
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

  if (isLoggedIn && cartEntries.length === 0) {
    return (
      <div className="min-h-screen bg-violet-50/30">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-violet-100 text-paec-violet">
            <ShoppingCart className="size-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-foreground">
            Your cart is empty
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose an activity and pick your tickets. You can add several
            activities and pay for them together.
          </p>
          <Button
            asChild
            className="mt-6 rounded-xl bg-paec-violet px-6 hover:bg-paec-violet-dark"
          >
            <Link to="/">Browse activities</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  const paymentSection =
    paymentGateways === null ? (
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
        total={orderTotal}
        detailsComplete={detailsComplete}
        paying={paying}
        onPay={() => void handlePay()}
      />
    ) : orderTotal > 0 ? (
      <CheckoutPaymentUnavailable
        attractionId={
          isLoggedIn
            ? cartEntries[0]?.session.attractionId
            : session?.attractionId
        }
        cartCount={isLoggedIn ? cartEntries.length : 1}
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
              This booking is free
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your tickets are issued as soon as you confirm.
            </p>

            <Button
              type="button"
              onClick={() => void handlePay()}
              disabled={paying}
              className={cn(
                'mt-4 h-11 min-w-[140px] rounded-xl bg-paec-violet px-8 text-sm font-semibold hover:bg-paec-violet-dark',
              )}
            >
              <CheckCircle2 className="size-4" />
              {paying ? 'Processing…' : 'Confirm booking'}
            </Button>
          </div>
        </div>
      </section>
    )

  return (
    <div className="min-h-screen bg-violet-50/30">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {isLoggedIn ? (
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
          >
            <ArrowLeft className="size-4" />
            Continue browsing
          </Link>
        ) : session ? (
          <Link
            to="/attractions/$attractionId"
            params={{ attractionId: session.attractionId }}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
          >
            <ArrowLeft className="size-4" />
            Back to activity
          </Link>
        ) : null}

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoggedIn
              ? 'Review your cart and pay for every activity in one payment'
              : 'Review your order and complete your booking'}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="order-2 space-y-6 lg:order-1">
            {isLoggedIn && (
              <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100 px-5 py-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <ShoppingCart className="size-4 text-paec-violet" />
                      Your cart
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cartEntries.length} activit
                      {cartEntries.length === 1 ? 'y' : 'ies'} · each gets its
                      own order and tickets
                    </p>
                  </div>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 px-3 py-2 text-sm font-semibold text-paec-violet transition-colors hover:bg-violet-50"
                  >
                    <Plus className="size-4" />
                    Add another activity
                  </Link>
                </div>
                <div className="space-y-3 p-5">
                  {cartEntries.map(({ item, session: itemSession }) => (
                    <CartItemCard
                      key={item.uuid}
                      session={itemSession}
                      busy={busyItem === item.uuid}
                      disabled={paying || busyItem !== null}
                      onChangeQuantity={(ticketTypeId, delta) =>
                        void changeQuantity(
                          item,
                          itemSession,
                          ticketTypeId,
                          delta,
                        )
                      }
                      onRemove={() =>
                        void removeItem(item, itemSession.attractionName)
                      }
                    />
                  ))}
                </div>
              </section>
            )}

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

            {paymentSection}

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
            {isLoggedIn ? (
              <CartOrderSummary
                sessions={cartEntries.map((entry) => entry.session)}
              />
            ) : session ? (
              <CheckoutOrderSummary session={session} />
            ) : null}

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
          setGuestErrors({})
          setSignInOpen(false)
        }}
      />
    </div>
  )
}
