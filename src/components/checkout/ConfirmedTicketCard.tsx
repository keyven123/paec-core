import { Calendar, Download, Hash, Loader2, MapPin, Receipt } from 'lucide-react'
import QRCode from 'react-qr-code'
import type { ReactNode, Ref } from 'react'

import type { ConfirmedTicket } from '@/lib/orderConfirmation'
import { Button } from '@/components/ui/button'

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

export function ConfirmedTicketCard({
  ticket,
  activityName,
  visitDateLabel,
  location,
  orderNumber,
  position,
  qrRef,
  downloading,
  onDownload,
}: ConfirmedTicketCardProps) {
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
      </div>
    </article>
  )
}
