import { Download, Loader2, QrCode, Users } from 'lucide-react'
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
    <article className="flex flex-col overflow-hidden rounded-2xl border-2 border-paec-violet/30 bg-white shadow-md shadow-paec-violet/10 sm:flex-row">
      <div className="min-w-0 flex-1 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-paec-violet px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            <Users className="size-3" />
            Group Pass
          </span>
          <span className="text-xs text-muted-foreground">
            Admits all {ticketCount} tickets
          </span>
        </div>

        <h3 className="mt-2 text-lg leading-snug font-bold text-foreground">
          One QR code for your whole group
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Show this at the entrance and staff can admit everyone in one scan.
          Arriving separately? Each ticket below still has its own QR code.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {breakdown.map((line) => (
            <li
              key={line.name}
              className="rounded-lg border border-violet-100 bg-violet-50/60 px-2.5 py-1 text-xs font-medium text-foreground"
            >
              <span className="font-bold text-paec-violet">
                {line.quantity}×
              </span>{' '}
              {line.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 border-t-2 border-dashed border-violet-100 bg-violet-50/50 p-5 sm:w-60 sm:border-t-0 sm:border-l-2">
        <div
          ref={qrRef}
          className="rounded-xl border border-violet-100 bg-white p-2.5"
        >
          <QRCode value={qrCode} size={132} />
        </div>
        <p className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-violet-100/70 px-3 py-1 font-mono text-[10px] font-semibold text-paec-violet">
          <QrCode className="size-3 shrink-0" />
          {qrCode}
        </p>

        <Button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="h-9 w-full rounded-xl bg-paec-violet text-xs font-semibold hover:bg-paec-violet-dark"
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Download Group Pass
        </Button>
      </div>
    </article>
  )
}
