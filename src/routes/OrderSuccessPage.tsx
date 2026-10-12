import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Download,
  Loader2,
  Mail,
  Receipt,
  Ticket,
  UserPlus,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import type { User } from '@/data/mockUser'
import type { ConfirmedTicket } from '@/lib/orderConfirmation'
import type { GroupPassSource, TicketImageSource } from '@/lib/ticketDownload'
import { SignInModal } from '@/components/auth/SignInModal'
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary'
import { ConfirmedTicketCard } from '@/components/checkout/ConfirmedTicketCard'
import { OrderGroupQrCard } from '@/components/checkout/OrderGroupQrCard'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { getStoredUser } from '@/lib/auth'
import { loadOrderConfirmation } from '@/lib/orderConfirmation'
import { downloadGroupPassPdf, downloadTicketsPdf } from '@/lib/ticketDownload'

function formatVisitDate(value: string) {
  if (!value) return 'Open date'
  return new Date(value).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function OrderSuccessPage() {
  const [confirmation] = useState(() => loadOrderConfirmation())
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const [signUpOpen, setSignUpOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const qrRefs = useRef(new Map<string, HTMLDivElement>())
  const groupQrRef = useRef<HTMLDivElement>(null)

  if (!confirmation) {
    return (
      <div className="min-h-screen bg-violet-50/30">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-violet-100 text-paec-violet">
            <Receipt className="size-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-foreground">
            No recent booking found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your tickets were sent to the email address you used at checkout.
            Signed-in customers can also find them under My Tickets.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="rounded-xl bg-paec-violet px-5 hover:bg-paec-violet-dark"
            >
              <Link to="/account" search={{ section: 'tickets' }}>
                My Tickets
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl px-5">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { order, tickets, orderNumber } = confirmation
  const visitDateLabel = formatVisitDate(order.visitDate)
  const ticketCount = tickets.length
  const firstName = confirmation.holderName.split(' ')[0]
  const showAccountPrompt = confirmation.isGuest && !user
  const holder = confirmation.holderName || confirmation.email

  const downloadableTickets = tickets.filter((ticket) => ticket.qrCode)
  const groupQrCode =
    downloadableTickets.length > 1 ? confirmation.orderQrCode : null
  const ticketBreakdown = Array.from(
    tickets.reduce(
      (counts, ticket) =>
        counts.set(
          ticket.ticketTypeName,
          (counts.get(ticket.ticketTypeName) ?? 0) + 1,
        ),
      new Map<string, number>(),
    ),
    ([name, quantity]) => ({ name, quantity }),
  )

  const toImageSource = (ticket: ConfirmedTicket): TicketImageSource => ({
    ticket: {
      activityName: order.attractionName,
      ticketTypeName: ticket.ticketTypeName,
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.qrCode,
      visitDateLabel,
      location: order.location,
      orderNumber,
      holder,
    },
    qrSvg: qrRefs.current.get(ticket.uuid)?.querySelector('svg') ?? null,
  })

  const toGroupPassSource = (qrCode: string): GroupPassSource => ({
    pass: {
      activityName: order.attractionName,
      qrCode,
      ticketCount: downloadableTickets.length,
      breakdown: ticketBreakdown
        .map((line) => `${line.quantity} × ${line.name}`)
        .join('  ·  '),
      visitDateLabel,
      location: order.location,
      orderNumber,
      holder,
    },
    qrSvg: groupQrRef.current?.querySelector('svg') ?? null,
  })

  const runDownload = async (key: string, download: () => Promise<void>) => {
    setDownloading(key)
    try {
      await download()
    } catch {
      toast.error('Could not download your tickets. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="min-h-screen bg-violet-50/30">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-paec-violet to-paec-violet-dark px-6 py-8 text-white shadow-xl shadow-paec-violet/20 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-24 size-48 rounded-full bg-paec-orange/20" />

          <div className="relative">
            <div className="flex size-14 items-center justify-center rounded-full bg-white shadow-lg">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>

            <p className="mt-5 text-xs font-semibold tracking-widest text-white/70 uppercase">
              Payment successful
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {firstName ? `You're all set, ${firstName}!` : "You're all set!"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              Your booking for{' '}
              <span className="font-semibold text-white">
                {order.attractionName}
              </span>{' '}
              is confirmed.
              {confirmation.email && (
                <>
                  {' '}
                  We've emailed your tickets to{' '}
                  <span className="font-semibold text-white">
                    {confirmation.email}
                  </span>
                  .
                </>
              )}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
              {orderNumber && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                  <Receipt className="size-3.5" />
                  Order {orderNumber}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                <Ticket className="size-3.5" />
                {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                <Calendar className="size-3.5" />
                {visitDateLabel}
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() =>
                  void runDownload('all', () =>
                    downloadTicketsPdf(
                      downloadableTickets.map(toImageSource),
                      groupQrCode ? toGroupPassSource(groupQrCode) : null,
                      `Order-${orderNumber || 'tickets'}`,
                    ),
                  )
                }
                disabled={
                  downloadableTickets.length === 0 || downloading !== null
                }
                className="h-12 rounded-xl bg-paec-orange px-6 text-base font-semibold shadow-lg shadow-black/10 hover:bg-paec-orange-light"
              >
                {downloading === 'all' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {downloadableTickets.length > 1
                  ? 'Download All Tickets'
                  : 'Download Ticket'}
              </Button>
              {user ? (
                <Button
                  asChild
                  className="h-12 rounded-xl border border-white/25 bg-white/10 px-6 text-base font-semibold hover:bg-white/20"
                >
                  <Link to="/account" search={{ section: 'tickets' }}>
                    View My Tickets
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="h-12 rounded-xl border border-white/25 bg-white/10 px-6 text-base font-semibold hover:bg-white/20"
                >
                  <Link to="/">
                    Continue exploring
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Your tickets
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {groupQrCode
                  ? 'Show the group QR code to admit everyone at once, or each ticket’s own QR code (one person per code) on your date of visit.'
                  : 'Show the QR code at the entrance on your date of visit. Each QR code admits one person.'}
              </p>
            </div>

            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-200 bg-white px-5 py-10 text-center">
                <Mail className="mx-auto size-8 text-paec-violet/50" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  Your tickets are being prepared
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  They'll arrive in your email inbox in a few minutes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupQrCode && (
                  <OrderGroupQrCard
                    qrCode={groupQrCode}
                    ticketCount={downloadableTickets.length}
                    breakdown={ticketBreakdown}
                    qrRef={groupQrRef}
                    downloading={downloading === 'group'}
                    onDownload={() =>
                      void runDownload('group', () =>
                        downloadGroupPassPdf(
                          toGroupPassSource(groupQrCode),
                          `Group-Pass-${orderNumber || 'order'}`,
                        ),
                      )
                    }
                  />
                )}
                {tickets.map((ticket, index) => (
                  <ConfirmedTicketCard
                    key={ticket.uuid}
                    ticket={ticket}
                    activityName={order.attractionName}
                    visitDateLabel={visitDateLabel}
                    location={order.location}
                    orderNumber={orderNumber}
                    position={`Ticket ${index + 1} of ${ticketCount}`}
                    qrRef={(element) => {
                      if (element) qrRefs.current.set(ticket.uuid, element)
                      else qrRefs.current.delete(ticket.uuid)
                    }}
                    downloading={downloading === ticket.uuid}
                    onDownload={() =>
                      void runDownload(ticket.uuid, () =>
                        downloadTicketsPdf(
                          [toImageSource(ticket)],
                          null,
                          ticket.ticketNumber,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <CheckoutOrderSummary session={order} />

            {showAccountPrompt && (
              <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-paec-violet">
                    <UserPlus className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Keep your tickets in one place
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Create a free account with{' '}
                      <span className="font-medium text-foreground">
                        {confirmation.email}
                      </span>{' '}
                      and this booking will appear under My Tickets.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => setSignUpOpen(true)}
                  className="mt-4 h-10 w-full rounded-xl bg-paec-violet text-sm font-semibold hover:bg-paec-violet-dark"
                >
                  Create an account
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-emerald-600">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                Booking confirmed
              </span>
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" />
                Tickets emailed
              </span>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <SignInModal
        open={signUpOpen}
        initialMode="signup"
        onClose={() => setSignUpOpen(false)}
        onSuccess={() => {
          setUser(getStoredUser())
          setSignUpOpen(false)
        }}
      />
    </div>
  )
}
