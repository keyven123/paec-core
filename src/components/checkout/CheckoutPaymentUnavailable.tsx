import { Link } from '@tanstack/react-router'
import { ArrowLeft, CreditCard, Info } from 'lucide-react'

export function CheckoutPaymentUnavailable({
  attractionId,
}: {
  attractionId: string
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="border-b border-violet-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CreditCard className="size-4 text-paec-violet" />
          Payment
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Online payment for this activity
        </p>
      </div>

      <div className="p-5">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-7 text-center">
          <div className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100">
            <CreditCard className="size-6 text-amber-600" />
            <span className="absolute h-0.5 w-9 rotate-45 rounded-full bg-amber-600" />
          </div>

          <p className="mt-4 text-base font-semibold text-foreground">
            Payment isn&apos;t available yet
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            This activity doesn&apos;t have a payment method set up, so it
            can&apos;t be booked online right now.
          </p>

          <div className="mx-auto mt-5 flex max-w-sm items-start gap-2 rounded-lg bg-white px-3 py-2.5 text-left text-xs text-muted-foreground ring-1 ring-amber-100">
            <Info className="mt-px size-3.5 shrink-0 text-amber-600" />
            Please check back later, or contact the organizer to arrange your
            booking.
          </div>

          <Link
            to="/attractions/$attractionId"
            params={{ attractionId }}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-paec-violet transition-colors hover:text-paec-violet-dark"
          >
            <ArrowLeft className="size-4" />
            Back to activity
          </Link>
        </div>
      </div>
    </section>
  )
}
