import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { SignInModal } from '@/components/auth/SignInModal'
import { CheckoutGuestForm } from '@/components/checkout/CheckoutGuestForm'
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import type { User } from '@/data/mockUser'
import {
  getStoredUser,
  isCustomerAuthenticated,
} from '@/lib/auth'
import {
  clearCheckoutSession,
  loadCheckoutSession,
  validateCheckoutDetails,
  type CheckoutSession,
  type GuestCheckoutDetails,
} from '@/lib/checkoutSession'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
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

  const isLoggedIn = isCustomerAuthenticated() && Boolean(user)

  useEffect(() => {
    const loaded = loadCheckoutSession()
    if (!loaded) {
      void navigate({ to: '/' })
      return
    }
    setSession(loaded)
  }, [navigate])

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

  const handleBypassPay = async () => {
    if (!session) return
    if (!validateBeforeCheckout()) return

    if (!isLoggedIn) {
      toast.error('Please sign in to complete your purchase')
      setSignInOpen(true)
      return
    }

    setPaying(true)
    try {
      const temp = await transactionService.createTempTransaction({
        event_uuid: session.eventUuid,
        event_location_uuid: session.eventLocationUuid,
        tickets: [
          {
            event_ticket_uuid: session.ticketTypeId,
            quantity: session.quantity,
            valid_until: session.visitDate,
            seats: [],
          },
        ],
        promo_code_uuid: session.appliedPromoCode?.uuid,
      })

      const total = Number.parseFloat(temp.total_amount)
      if (total <= 0) {
        await transactionService.checkoutFree({
          temp_transaction_uuid: temp.uuid,
        })
      } else {
        await transactionService.checkoutBypass({
          temp_transaction_uuid: temp.uuid,
        })
      }

      clearCheckoutSession()
      toast.success('Payment complete! Your tickets are ready.')
      void navigate({
        to: '/account',
        search: { section: 'tickets' },
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Checkout failed. Please try again.'))
    } finally {
      setPaying(false)
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
                      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                      <p className="mt-2 text-xs text-emerald-700">
                        Guest contact fields are not required while you are signed in.
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

            <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
              <div className="border-b border-violet-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <CreditCard className="size-4 text-paec-violet" />
                  Payment
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Secure payment options will appear here
                </p>
              </div>
              <div className="p-5">
                <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-6 text-center">
                  <ShieldCheck className="mx-auto size-8 text-paec-violet/50" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Payment methods coming soon
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    GCash, card, and other options will be available in the next step
                  </p>

                  <div className="mx-auto mt-5 max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left">
                    <p className="text-xs leading-relaxed text-amber-800">
                      <span className="font-semibold">Temporary:</span> The Pay button
                      below skips payment for testing only. It will be removed when
                      real payment methods are integrated.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => void handleBypassPay()}
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
