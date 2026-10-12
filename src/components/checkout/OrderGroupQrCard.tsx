import { Download, Info, Loader2, QrCode, Users } from 'lucide-react'
import QRCode from 'react-qr-code'
import type { Ref } from 'react'

import { Button } from '@/components/ui/button'

type OrderGroupQrCardProps = {
  qrCode: string
  ticketCount: number
  breakdown: Array<{ name: string; quantity: number }>
  qrRef: Ref<HTMLDivElement>
  downloading: boolean
  onDownload: () => void
}

export function OrderGroupQrCard({
  qrCode,
  ticketCount,
  breakdown,
  qrRef,
  downloading,
  onDownload,
}: OrderGroupQrCardProps) {
  return (
    <article className="w-full rounded-2xl bg-white p-4 text-foreground shadow-xl shadow-black/15 sm:p-5">
      <div className="flex gap-4">
        <div className="flex w-[124px] shrink-0 flex-col items-center gap-2">
          <div
            ref={qrRef}
            className="rounded-xl border border-violet-100 bg-white p-2"
          >
            <QRCode value={qrCode} size={106} />
          </div>
          <p className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-violet-100/70 px-2 py-0.5 font-mono text-[9px] font-semibold text-paec-violet">
            <QrCode className="size-3 shrink-0" />
            <span className="truncate">{qrCode}</span>
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-paec-violet px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            <Users className="size-3" />
            Group Pass
          </span>
          <h2 className="mt-1.5 text-base leading-snug font-bold">
            One QR code for your whole group
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Show this at the entrance to admit all {ticketCount} tickets in one
            scan.
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {breakdown.map((line) => (
              <li
                key={line.name}
                className="rounded-md border border-violet-100 bg-violet-50/60 px-2 py-0.5 text-[11px] font-medium"
              >
                <span className="font-bold text-paec-violet">
                  {line.quantity}×
                </span>{' '}
                {line.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className="mt-4 h-10 w-full rounded-xl bg-paec-violet text-sm font-semibold hover:bg-paec-violet-dark"
      >
        {downloading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        Download Group Pass
      </Button>
      <p className="mt-1.5 text-center text-[11px] leading-snug text-muted-foreground">
        Saves the group pass only. One QR code admits all {ticketCount} tickets.
      </p>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
        <Info className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
        <p>
          Scanning the group QR checks in all {ticketCount} tickets at once, so
          everyone should enter together. Tickets already scanned on their own
          are skipped. Once a ticket is used, neither QR code can admit it
          again.
        </p>
      </div>
    </article>
  )
}
