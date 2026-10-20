import {
  Calendar,
  Download,
  Hash,
  Loader2,
  MapPin,
  Receipt,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import type { ReactNode, Ref } from 'react'

import type { ConfirmedTicket } from '@/lib/orderConfirmation'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { termsParagraphs } from '@/lib/termsText'

type ConfirmedTicketCardProps = {
  ticket: ConfirmedTicket
  activityName: string
  visitDateLabel: string
  location: string
  orderNumber: string
  position: string
  qrRef: Ref<HTMLDivElement>
  downloading: boolean
  onDownload: () => void
  /** Shown on the gift certificate stub (“Issued to”). */
  holderName?: string
  /** Formatted price shown on the gift certificate stub. */
  priceLabel?: string | null
  /** Activity poster shown at the top of the gift certificate’s right column. */
  posterUrl?: string | null
  /** Activity logo shown at the top of the gift certificate stub. */
  logoUrl?: string | null
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-foreground">
        {children}
      </dd>
    </div>
  )
}

function TermsParagraphs({ raw }: { raw: string }) {
  return (
    <>
      {termsParagraphs(raw).map((paragraph, index) => (
        <p
          key={index}
          className="text-[11px] leading-[1.6] whitespace-pre-line text-indigo-950/90"
        >
          {paragraph}
        </p>
      ))}
    </>
  )
}

function StubField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold tracking-wide text-paec-violet uppercase">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-bold text-indigo-950">
        {value}
      </p>
    </div>
  )
}

/**
 * Gift certificates are shown on the success page exactly as they download:
 * A4-style stub + poster, with the Terms & Conditions box stretched to the
 * very bottom of the right column.
 */
function GiftCertificateTicketCard(props: ConfirmedTicketCardProps) {
  const {
    ticket,
    activityName,
    visitDateLabel,
    location,
    orderNumber,
    position,
    qrRef,
    downloading,
    onDownload,
    holderName,
    priceLabel,
    posterUrl,
    logoUrl,
  } = props
  const countLabel = position.replace(/^Ticket\s+/i, '')

  return (
    <article className="overflow-hidden rounded-[20px] border-2 border-paec-violet bg-white p-2.5 shadow-sm">
      <div className="grid items-stretch gap-2.5 md:grid-cols-[1.08fr_1fr]">
        {/* Left: ticket stub */}
        <div className="flex flex-col overflow-hidden rounded-xl border-2 border-paec-violet">
          <div className="border-b-2 border-dashed border-violet-200 px-4 pt-4 pb-3 text-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={activityName}
                className="mx-auto h-11 max-w-[180px] object-contain"
              />
            ) : (
              <p className="text-base font-extrabold tracking-wide text-paec-violet">
                PAEC
              </p>
            )}
            <p className="mt-1.5 text-[10px] font-extrabold tracking-[0.18em] text-paec-orange uppercase">
              Gift Certificate E-Ticket
            </p>
          </div>

          <div className="px-4 pt-4 text-center">
            {ticket.qrCode ? (
              <>
                <div
                  ref={qrRef}
                  className="inline-block rounded-xl border border-violet-100 bg-white p-2"
                >
                  <QRCode value={ticket.qrCode} size={168} />
                </div>
                <p className="mt-2 font-mono text-xs font-bold text-indigo-950">
                  {ticket.ticketNumber}
                </p>
              </>
            ) : (
              <div className="mx-auto flex size-[184px] items-center justify-center rounded-xl border border-dashed border-violet-200 bg-white px-4 text-center text-xs text-muted-foreground">
                Your QR code will arrive by email shortly.
              </div>
            )}
          </div>

          <div className="px-5 pt-3 text-center">
            <p className="text-[10px] font-extrabold tracking-[0.22em] text-paec-orange uppercase">
              PAEC
            </p>
            <h3 className="mt-1 text-xl leading-snug font-extrabold text-indigo-950">
              {activityName}
            </h3>
            <p className="mt-1 text-sm font-bold text-paec-violet">
              {visitDateLabel}
            </p>
            <p className="mt-1 text-xs leading-relaxed font-semibold text-indigo-950">
              {location}
            </p>
          </div>

          <div className="mx-4 mt-4 rounded-lg bg-violet-50 px-4 py-3">
            <div className="text-center">
              <p className="text-[9px] font-bold tracking-wide text-paec-violet uppercase">
                Ticket Type
              </p>
              <p className="mt-0.5 text-base font-extrabold text-paec-violet">
                {ticket.ticketTypeName}
              </p>
              <p className="text-[10px] font-bold text-paec-orange">
                Section: {ticket.ticketTypeName}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
              <StubField label="Issued To" value={holderName || '—'} />
              <StubField label="Price" value={priceLabel || '—'} />
              <StubField label="Order" value={orderNumber || '—'} />
              <StubField label="Ticket Count" value={countLabel} />
            </div>
          </div>

          {ticket.qrCode ? (
            <div className="px-4 py-3 text-center">
              <div className="inline-block rounded-lg border border-violet-100 bg-white p-1.5">
                <QRCode value={ticket.qrCode} size={64} />
              </div>
              <p className="mt-1 font-mono text-[9px] font-semibold text-paec-violet">
                {ticket.qrCode}
              </p>
            </div>
          ) : null}

          <p className="mt-auto bg-paec-violet px-3 py-2 text-center text-[10px] font-bold tracking-wide text-white">
            This is your gift certificate ticket. Do not duplicate.
          </p>
        </div>

        {/* Right: poster + terms stretched to the bottom */}
        <div className="flex min-h-0 flex-col gap-2.5">
          <div className="shrink-0 overflow-hidden rounded-xl border-2 border-paec-violet">
            <ImageWithFallback
              src={posterUrl ?? ''}
              alt={activityName}
              className="h-52 w-full object-cover md:h-60"
              fallbackClassName="h-52 w-full md:h-60"
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-xl border-2 border-orange-400 bg-orange-50/70 p-4">
            <p className="text-xs font-extrabold tracking-wide text-orange-800 uppercase">
              Terms and Conditions
            </p>
            <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1.5">
              {ticket.termsAndConditions ? (
                <TermsParagraphs raw={ticket.termsAndConditions} />
              ) : (
                <TermsParagraphs
                  raw={
                    'Gift certificate tickets are valid for the activity and visit date shown on this ticket.\n\nPresent the QR code at the entrance for admission.\n\nLost or duplicated tickets may be voided.\n\nThe organizer reserves the right to refuse entry for safety or policy reasons.'
                  }
                />
              )}
            </div>
            <p className="mt-3 text-[11px] font-bold text-paec-violet">
              Gift certificate admission
            </p>
          </div>
        </div>
      </div>

      {/* Bottom PAEC band */}
      <div className="mt-2.5 flex justify-center rounded-xl bg-paec-violet py-3">
        <span className="rounded-lg bg-white px-3 py-1.5">
          <img
            src="/Paec-Logo.png"
            alt="PAEC"
            className="h-9 w-auto object-contain"
          />
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 pb-1">
        <p className="text-[11px] leading-snug text-muted-foreground">
          Saves this ticket only. Its QR code admits 1 person.
        </p>
        <Button
          type="button"
          onClick={onDownload}
          disabled={!ticket.qrCode || downloading}
          className="h-9 rounded-xl bg-paec-violet px-4 text-xs font-semibold hover:bg-paec-violet-dark"
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Download Ticket
        </Button>
      </div>
    </article>
  )
}

export function ConfirmedTicketCard(props: ConfirmedTicketCardProps) {
  const {
    ticket,
    activityName,
    visitDateLabel,
    location,
    orderNumber,
    position,
    qrRef,
    downloading,
    onDownload,
  } = props

  if (ticket.ticketKind === 'gift_certificate') {
    return <GiftCertificateTicketCard {...props} />
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm sm:flex-row">
      <div className="min-w-0 flex-1 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-paec-orange/30 bg-paec-orange/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-paec-orange uppercase">
            {ticket.ticketTypeName}
          </span>
          <span className="text-xs text-muted-foreground">{position}</span>
        </div>

        <h3 className="mt-2 text-lg leading-snug font-bold text-foreground">
          {activityName}
        </h3>

        {ticket.termsAndConditions ? (
          <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-2.5">
            <p className="text-[10px] font-bold tracking-wide text-orange-700 uppercase">
              Terms and Conditions
            </p>
            <div className="mt-1 max-h-44 space-y-1.5 overflow-y-auto pr-1">
              <TermsParagraphs raw={ticket.termsAndConditions} />
            </div>
          </div>
        ) : null}

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <Detail
            icon={<Calendar className="size-3 text-paec-violet" />}
            label="Date of Visit"
          >
            {visitDateLabel}
          </Detail>
          <Detail
            icon={<MapPin className="size-3 text-paec-violet" />}
            label="Location"
          >
            {location}
          </Detail>
          <Detail
            icon={<Hash className="size-3 text-paec-violet" />}
            label="Ticket Number"
          >
            <span className="font-mono text-xs">{ticket.ticketNumber}</span>
          </Detail>
          <Detail
            icon={<Receipt className="size-3 text-paec-violet" />}
            label="Order Number"
          >
            <span className="font-mono text-xs">{orderNumber}</span>
          </Detail>
        </dl>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 border-t-2 border-dashed border-violet-100 bg-violet-50/50 p-5 sm:w-60 sm:border-t-0 sm:border-l-2">
        {ticket.qrCode ? (
          <>
            <div
              ref={qrRef}
              className="rounded-xl border border-violet-100 bg-white p-2.5"
            >
              <QRCode value={ticket.qrCode} size={132} />
            </div>
            <p className="max-w-full truncate rounded-full bg-violet-100/70 px-3 py-1 font-mono text-[10px] font-semibold text-paec-violet">
              {ticket.qrCode}
            </p>
          </>
        ) : (
          <div className="flex size-[154px] items-center justify-center rounded-xl border border-dashed border-violet-200 bg-white px-4 text-center text-xs text-muted-foreground">
            Your QR code will arrive by email shortly.
          </div>
        )}

        <Button
          type="button"
          onClick={onDownload}
          disabled={!ticket.qrCode || downloading}
          className="h-9 w-full rounded-xl bg-paec-violet text-xs font-semibold hover:bg-paec-violet-dark"
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Download Ticket
        </Button>
        <p className="text-center text-[11px] leading-snug text-muted-foreground">
          Saves this ticket only. Its QR code admits 1 person.
        </p>
      </div>
    </article>
  )
}
