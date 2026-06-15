import { MapPin, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import QRCode from 'react-qr-code'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { resolveImageUrl } from '@/lib/imageUtils'
import { cn } from '@/lib/utils'
import { formatTicketVenue, type Ticket } from '@/services/ticketService'

type TicketPassCardProps = {
  ticket: Ticket
}

function DetailCell({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-3 py-2.5', className)}>
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return 'TBA'
  return new Date(value).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDay(value?: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-PH', { weekday: 'long' })
}

function formatTime(start?: string, end?: string) {
  const trim = (t: string) => t.replace(/^(\d{1,2}:\d{2})(:\d{2})?$/, '$1')
  if (start && end) return `${trim(start)} – ${trim(end)}`
  if (start) return trim(start)
  return 'Open hours'
}

function formatPurchased(value?: string | null) {
  if (!value) return 'TBA'
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TicketPassCard({ ticket }: TicketPassCardProps) {
  const [qrModalOpen, setQrModalOpen] = useState(false)

  const eventName = ticket.event?.name ?? 'Activity'
  const organizer = ticket.event?.organizer_name?.trim()
  const imageUrl = resolveImageUrl(
    ticket.event?.featured?.url ?? ticket.event?.portrait?.url,
  )

  const visitDate =
    ticket.date_of_visit ?? ticket.valid_until ?? ticket.schedule?.date_from
  const eventDate = formatDate(visitDate)
  const eventDay = formatDay(visitDate)
  const eventTime = formatTime(
    ticket.schedule_time?.time_start,
    ticket.schedule_time?.time_end,
  )
  const venue = formatTicketVenue(ticket)
  const orderNumber = ticket.transaction?.order_number ?? '—'
  const ticketId =
    ticket.ticket_number ??
    `TKT-${ticket.uuid.replace(/-/g, '').slice(0, 12).toUpperCase()}`
  const price =
    Number(ticket.gross_revenue ?? ticket.event_ticket?.price ?? ticket.price ?? 0) || 0
  const tierName = ticket.event_ticket?.name ?? 'General Admission'
  const showQr =
    ticket.qr_code &&
    ticket.status === 'active' &&
    !ticket.is_past_due

  const isPast =
    ticket.status === 'used' ||
    ticket.status === 'expired' ||
    ticket.status === 'transferred' ||
    ticket.is_past_due

  const pastStatusMessage =
    ticket.status === 'transferred'
      ? 'This ticket has been transferred.'
      : ticket.status === 'used'
        ? 'This ticket has been used.'
        : ticket.status === 'expired' || ticket.is_past_due
          ? 'This ticket has expired.'
          : 'This ticket is no longer active.'

  useEffect(() => {
    if (!qrModalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQrModalOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [qrModalOpen])

  return (
    <article className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr_0.75fr]">
        {/* Branding */}
        <section className="border-b border-violet-100 bg-gradient-to-br from-paec-violet/10 to-paec-orange/5 p-4 lg:border-r lg:border-b-0">
          <img
            src="/Paec-Logo.png"
            alt="PAEC"
            className="h-8 w-auto object-contain"
          />
          <h3 className="mt-4 text-sm font-bold leading-snug text-foreground">
            {eventName}
          </h3>
          {organizer ? (
            <p className="mt-1 text-xs text-muted-foreground">{organizer}</p>
          ) : null}
          <div className="mt-4 overflow-hidden rounded-xl border border-violet-100">
            <ImageWithFallback
              src={imageUrl}
              alt={eventName}
              className="aspect-[4/3] w-full object-cover"
              fallbackClassName="aspect-[4/3] w-full"
            />
          </div>
        </section>

        {/* Details */}
        <section className="border-b border-violet-100 p-4 lg:border-r lg:border-b-0">
          <div className="overflow-hidden rounded-xl border border-violet-100 bg-violet-50/30">
            <div className="grid grid-cols-2 border-b border-violet-100">
              <DetailCell label="Date of Visit" className="border-r border-violet-100">
                <p className="font-semibold">{eventDate}</p>
                {eventDay ? (
                  <p className="mt-0.5 text-[10px] font-bold tracking-wide text-paec-violet uppercase">
                    {eventDay}
                  </p>
                ) : null}
              </DetailCell>
              <DetailCell label="Time">
                <p className="font-semibold">{eventTime}</p>
              </DetailCell>
            </div>
            <div className="grid grid-cols-2 border-b border-violet-100">
              <DetailCell label="Venue" className="border-r border-violet-100">
                <p className="flex items-start gap-1 text-xs leading-relaxed">
                  <MapPin className="mt-0.5 size-3 shrink-0 text-paec-violet" />
                  <span>{venue}</span>
                </p>
              </DetailCell>
              <DetailCell label="Ticket Type">
                <span className="inline-flex rounded-md border border-paec-orange/30 bg-paec-orange/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-paec-orange uppercase">
                  {tierName}
                </span>
              </DetailCell>
            </div>
            <div className="grid grid-cols-2 border-b border-violet-100">
              <DetailCell label="Order Number" className="border-r border-violet-100">
                <p className="font-mono text-xs font-semibold break-all">{orderNumber}</p>
              </DetailCell>
              <DetailCell label="Purchased">
                <p className="text-xs font-semibold">
                  {formatPurchased(ticket.transaction?.paid_at ?? ticket.created_at)}
                </p>
              </DetailCell>
            </div>
            <div className="grid grid-cols-2">
              <DetailCell label="Price" className="border-r border-violet-100">
                <p className="text-base font-bold">₱{price.toLocaleString()}</p>
              </DetailCell>
              <DetailCell label="Ticket ID">
                <p className="font-mono text-xs font-semibold break-all">{ticketId}</p>
              </DetailCell>
            </div>
          </div>

          {isPast && (
            <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs font-medium text-paec-violet">
              {pastStatusMessage}
            </p>
          )}
        </section>

        {/* QR */}
        <section className="flex flex-col items-center bg-violet-50/40 p-4">
          <div className="w-full rounded-t-xl bg-paec-violet px-3 py-2 text-center">
            <p className="text-[10px] font-bold tracking-widest text-white uppercase">
              Secure Access Pass
            </p>
          </div>
          <div className="flex w-full flex-1 flex-col items-center rounded-b-xl border border-t-0 border-violet-100 bg-white p-4">
            {showQr ? (
              <>
                <button
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  className="rounded-lg border border-violet-100 bg-white p-2 transition-colors hover:border-paec-violet/40 hover:bg-violet-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paec-violet/50"
                  aria-label="View QR code"
                >
                  <QRCode value={ticket.qr_code!} size={140} />
                </button>
                <p className="mt-3 rounded-full bg-violet-50 px-3 py-1 font-mono text-[10px] font-semibold text-paec-violet">
                  {ticket.qr_code}
                </p>
              </>
            ) : (
              <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  QR not available
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ticket.status === 'pending'
                    ? 'Activating your ticket…'
                    : ticket.status === 'expired' || ticket.is_past_due
                      ? 'This ticket has expired'
                      : 'Scan unavailable for this ticket'}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {qrModalOpen && showQr ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setQrModalOpen(false)}
            aria-label="Close QR code modal"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl"
          >
            <div className="bg-paec-violet px-4 py-3 text-center">
              <p
                id="qr-modal-title"
                className="text-xs font-bold tracking-widest text-white uppercase"
              >
                Secure Access Pass
              </p>
            </div>

            <div className="p-6">
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>

              <p className="text-center text-sm font-bold text-foreground">
                {eventName}
              </p>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                {tierName}
              </p>
              {visitDate ? (
                <p className="mt-2 text-center text-xs font-semibold text-foreground">
                  Date of Visit: {eventDate}
                  {eventDay ? (
                    <span className="block text-[10px] font-bold tracking-wide text-paec-violet uppercase">
                      {eventDay}
                    </span>
                  ) : null}
                </p>
              ) : null}

              <div className="mt-5 flex justify-center">
                <div className="rounded-xl border border-violet-100 bg-white p-4">
                  <QRCode value={ticket.qr_code!} size={220} />
                </div>
              </div>

              <p className="mt-5 text-center font-mono text-xs font-semibold text-paec-violet">
                {ticket.qr_code}
              </p>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Present this QR code at the venue entrance
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}
