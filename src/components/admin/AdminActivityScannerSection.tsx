import { Link } from '@tanstack/react-router'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Keyboard,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { adminEventService } from '@/services/adminEventService'
import {
  ticketScannerService,
  type ScheduleRestrictionErrorResponse,
  type TicketDetails,
} from '@/services/ticketScannerService'

const SCANNED_PER_PAGE = 10

function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const ENTRY_RESTRICTION_CODES = [
  'schedule_not_started',
  'schedule_ended',
  'visit_not_today',
  'visit_expired',
] as const

function formatAttendeeName(ticket: TicketDetails): string {
  const direct = ticket.attendee_name?.trim()
  if (direct) return direct
  const fromUser = ticket.user?.name?.trim()
  if (fromUser) return fromUser
  return 'Guest'
}

function formatVisitDate(value?: string | null): string | null {
  if (!value) return null
  const datePart = value.slice(0, 10)
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function restrictionFromApi(
  data: ScheduleRestrictionErrorResponse,
): {
  title: string
  message: string
  attendeeName?: string
  visitDate?: string | null
} {
  const attendeeName = data.meta?.attendee_name?.trim() || undefined
  const visitDate =
    formatVisitDate(data.meta?.visit_date) ??
    formatVisitDate(data.meta?.valid_until)

  switch (data.code) {
    case 'schedule_not_started':
      return {
        title: 'Schedule Not Started Yet',
        message:
          data.message ?? 'This ticket is not valid for entry at this time.',
        attendeeName,
      }
    case 'schedule_ended':
      return {
        title: 'Schedule Already Ended',
        message:
          data.message ?? 'This ticket is not valid for entry at this time.',
        attendeeName,
      }
    case 'visit_not_today':
      return {
        title: 'Visit Not Today',
        message: 'Your visit is not today.',
        attendeeName,
        visitDate,
      }
    case 'visit_expired':
      return {
        title: 'Ticket Expired',
        message: data.message ?? 'This ticket has expired.',
        attendeeName,
        visitDate,
      }
    default:
      return {
        title: 'Entry Not Permitted',
        message: data.message ?? 'This ticket is not valid for entry at this time.',
        attendeeName,
      }
  }
}

function isEntryRestrictionError(
  err: unknown,
): ScheduleRestrictionErrorResponse | null {
  const response = (err as { response?: { data?: ScheduleRestrictionErrorResponse; status?: number } })
    .response
  if (response?.status !== 403 || !response.data?.code) return null
  if (!ENTRY_RESTRICTION_CODES.includes(response.data.code as typeof ENTRY_RESTRICTION_CODES[number])) {
    return null
  }
  return response.data
}

const cardClassName =
  'rounded-xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6'

type AdminActivityScannerSectionProps = {
  activityId: string
}

type ScannedAttendee = {
  uuid: string
  ticket_number: string
  attendee_name: string | null
  qr_code: string
  used_at: string | null
}

export function AdminActivityScannerSection({
  activityId,
}: AdminActivityScannerSectionProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scanRegionRef = useRef<HTMLDivElement>(null)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )

  const [eventName, setEventName] = useState('')
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualQrCode, setManualQrCode] = useState('')
  const [confirmCountdown, setConfirmCountdown] = useState(5)
  const [successTicket, setSuccessTicket] = useState<TicketDetails | null>(null)
  const [usedTicket, setUsedTicket] = useState<TicketDetails | null>(null)
  const [invalidTicket, setInvalidTicket] = useState<TicketDetails | null>(null)
  const [scheduleWarning, setScheduleWarning] = useState<{
    title: string
    message: string
    attendeeName?: string
    visitDate?: string | null
  } | null>(null)
  const [scannedAttendees, setScannedAttendees] = useState<ScannedAttendee[]>([])
  const [scannedSearch, setScannedSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [scannedDate, setScannedDate] = useState(getTodayDateString)
  const [scannedPage, setScannedPage] = useState(1)
  const [scannedMeta, setScannedMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  })
  const [loadingScanned, setLoadingScanned] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(scannedSearch.trim()), 400)
    return () => clearTimeout(timer)
  }, [scannedSearch])

  useEffect(() => {
    setScannedPage(1)
  }, [debouncedSearch, activityId, scannedDate])

  useEffect(() => {
    setScannedDate(getTodayDateString())
    setScannedSearch('')
    setScannedPage(1)
  }, [activityId])

  useEffect(() => {
    adminEventService
      .getEventDetails(activityId)
      .then((res) => setEventName(res.data.event_name))
      .catch(() => setEventName(''))
  }, [activityId])

  const fetchScannedAttendees = useCallback(async () => {
    setLoadingScanned(true)
    try {
      const res = await adminEventService.getScannedAttendees(activityId, {
        page: scannedPage,
        per_page: SCANNED_PER_PAGE,
        search: debouncedSearch || undefined,
        scanned_date: scannedDate,
      })
      setScannedAttendees(res.data ?? [])
      setScannedMeta({
        current_page: res.meta?.current_page ?? 1,
        last_page: res.meta?.last_page ?? 1,
        total: res.meta?.total ?? 0,
      })
    } catch {
      setScannedAttendees([])
      setScannedMeta({ current_page: 1, last_page: 1, total: 0 })
    } finally {
      setLoadingScanned(false)
    }
  }, [activityId, scannedPage, debouncedSearch, scannedDate])

  useEffect(() => {
    void fetchScannedAttendees()
  }, [fetchScannedAttendees])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const scanner = scannerRef.current
        scanner.stop().catch(() => {}).finally(() => {
          try {
            scanner.clear()
          } catch {
            /* ignore */
          }
          scannerRef.current = null
        })
      }
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  const stopScanning = async () => {
    setScanning(false)
    if (!scannerRef.current) return

    const scanner = scannerRef.current
    scannerRef.current = null
    try {
      await scanner.stop()
    } catch {
      /* ignore */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
    try {
      scanner.clear()
    } catch {
      /* ignore */
    }
  }

  const startScanning = async () => {
    if (!scanRegionRef.current) {
      toast.error('Scanner container not ready.')
      return
    }

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        /* ignore */
      }
      try {
        scannerRef.current.clear()
      } catch {
        /* ignore */
      }
      scannerRef.current = null
    }

    await new Promise((resolve) => setTimeout(resolve, 200))

    if (!scanRegionRef.current) {
      toast.error('Scanner container not available.')
      return
    }

    try {
      const html5QrCode = new Html5Qrcode(scanRegionRef.current.id)
      scannerRef.current = html5QrCode
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.0 },
        (decodedText) => {
          void handleQrCodeScanned(decodedText)
        },
        () => {
          /* ignore scan errors */
        },
      )
      setScanning(true)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to start camera. Check permissions.',
      )
      if (scannerRef.current) {
        try {
          scannerRef.current.clear()
        } catch {
          /* ignore */
        }
        scannerRef.current = null
      }
      setScanning(false)
    }
  }

  const clearConfirmTimers = () => {
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current)
      confirmTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }

  const resumeScanning = () => {
    setTimeout(() => void startScanning(), 300)
  }

  const handleQrCodeScanned = async (qrCode: string) => {
    if (loading || successTicket) return

    setLoading(true)
    await stopScanning()

    try {
      const details = await ticketScannerService.getTicketsDetailByQrCode(
        qrCode,
        activityId,
      )

      if (details.event_uuid !== activityId) {
        toast.error('This ticket does not belong to this activity.')
        resumeScanning()
        return
      }

      if (details.used_at || details.status === 'used') {
        setUsedTicket(details)
        return
      }

      if (
        details.status === 'expired' ||
        details.status === 'cancelled' ||
        details.status === 'inactive'
      ) {
        setInvalidTicket(details)
        return
      }

      if (details.status !== 'active') {
        toast.error(`Ticket status is ${details.status}.`)
        resumeScanning()
        return
      }

      clearConfirmTimers()
      setConfirmCountdown(5)
      setSuccessTicket(details)

      countdownIntervalRef.current = setInterval(() => {
        setConfirmCountdown((prev) => {
          if (prev <= 1 && countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
          }
          return prev - 1
        })
      }, 1000)

      confirmTimeoutRef.current = setTimeout(async () => {
        confirmTimeoutRef.current = null
        try {
          await ticketScannerService.confirmEntry(details.uuid)
          setSuccessTicket(null)
          toast.success('Entry confirmed successfully!')
          void fetchScannedAttendees()
          resumeScanning()
        } catch (err) {
          const restriction = isEntryRestrictionError(err)
          if (restriction) {
            setSuccessTicket(null)
            const parsed = restrictionFromApi(restriction)
            setScheduleWarning({
              title: parsed.title,
              message: parsed.message,
              attendeeName: parsed.attendeeName,
              visitDate: parsed.visitDate,
            })
            return
          }
          toast.error(getApiErrorMessage(err, 'Failed to confirm entry.'))
          setSuccessTicket(null)
          resumeScanning()
        }
      }, 5000)
    } catch (err) {
      const restriction = isEntryRestrictionError(err)
      if (restriction) {
        const parsed = restrictionFromApi(restriction)
        setScheduleWarning({
          title: parsed.title,
          message: parsed.message,
          attendeeName: parsed.attendeeName,
          visitDate: parsed.visitDate,
        })
        return
      }
      toast.error(getApiErrorMessage(err, 'Ticket not found.'))
      resumeScanning()
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualQrCode.trim()) {
      toast.error('Please enter a QR code.')
      return
    }
    await handleQrCodeScanned(manualQrCode.trim())
  }

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 border-b border-violet-100 pb-4">
        <Link
          to="/admin/activities/$activityId"
          params={{ activityId }}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back to Activity
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
            Ticket Scanner
          </h1>
          {eventName ? (
            <p className="mt-1 text-sm text-muted-foreground">{eventName}</p>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="space-y-4 lg:col-span-2">
            <section className={cardClassName}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">
                  QR Code Scanner
                </h2>
                {!showManualInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualInput(true)
                      if (scanning) void stopScanning()
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-foreground hover:bg-violet-50 sm:text-sm"
                  >
                    <Keyboard className="size-4" />
                    Manual Entry
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualInput(false)
                      if (!successTicket) void startScanning()
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-foreground hover:bg-violet-50 sm:text-sm"
                  >
                    <Camera className="size-4" />
                    Use Camera
                  </button>
                )}
              </div>

              {showManualInput ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="manual-qr"
                      className="mb-2 block text-xs font-medium text-muted-foreground"
                    >
                      Enter QR Code
                    </label>
                    <input
                      id="manual-qr"
                      type="text"
                      value={manualQrCode}
                      onChange={(e) => setManualQrCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleManualSubmit()
                      }}
                      placeholder="Paste or type QR code here"
                      className="h-10 w-full rounded-lg border border-violet-100 px-3 text-sm focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleManualSubmit()}
                    disabled={loading || !manualQrCode.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-paec-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-paec-orange-light disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      'Lookup Ticket'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={cn(
                      'relative mx-auto w-full max-w-md overflow-hidden rounded-lg bg-violet-50/60',
                      'min-h-[220px] sm:min-h-[260px]',
                    )}
                  >
                    <div
                      id="paec-qr-reader"
                      ref={scanRegionRef}
                      key="paec-qr-scanner-container"
                      className="size-full min-h-[220px] sm:min-h-[260px]"
                    />
                    <div
                      data-placeholder
                      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-center text-muted-foreground"
                      style={{
                        display: scanning || loading ? 'none' : 'flex',
                      }}
                    >
                      <div>
                        <Camera className="mx-auto mb-2 size-12 opacity-40" />
                        <p className="text-sm">Click start to begin scanning</p>
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-4 text-center">
                      <Loader2 className="mx-auto mb-2 size-8 animate-spin text-paec-orange" />
                      <p className="text-sm text-muted-foreground">
                        Loading ticket details…
                      </p>
                    </div>
                  ) : null}

                  {!scanning && !loading && !successTicket ? (
                    <button
                      type="button"
                      onClick={() => void startScanning()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-paec-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-paec-orange-light"
                    >
                      <Camera className="size-4" />
                      Start Scanning
                    </button>
                  ) : null}

                  {scanning ? (
                    <button
                      type="button"
                      onClick={() => void stopScanning()}
                      className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Stop Scanning
                    </button>
                  ) : null}
                </div>
              )}
            </section>
          </div>

          <section className={cardClassName}>
            <h2 className="mb-4 text-base font-semibold text-foreground">
              Instructions
            </h2>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  1. Start Scanning
                </span>
                <p className="mt-0.5">
                  Click &quot;Start Scanning&quot; to activate the camera.
                </p>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  2. Scan QR Code
                </span>
                <p className="mt-0.5">
                  Point the camera at the ticket&apos;s QR code.
                </p>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  3. Auto-Confirm
                </span>
                <p className="mt-0.5">
                  Entry is confirmed automatically 5 seconds after a successful
                  scan.
                </p>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Manual Entry
                </span>
                <p className="mt-0.5">
                  You can manually enter the QR code if scanning fails.
                </p>
              </li>
            </ol>
          </section>

          <section className={cn(cardClassName, 'lg:col-span-3')}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                Scanned Tickets
              </h2>
              <p className="text-sm text-muted-foreground">
                Total:{' '}
                <span className="font-semibold text-foreground">
                  {scannedMeta.total}
                </span>{' '}
                scanned
              </p>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={scannedSearch}
                  onChange={(e) => setScannedSearch(e.target.value)}
                  placeholder="Search by name, ticket #, QR code..."
                  className="h-10 w-full rounded-lg border border-violet-100 pr-3 pl-9 text-sm focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
                />
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:w-44">
                <label
                  htmlFor="scanned-date-filter"
                  className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Scanned Date
                </label>
                <input
                  id="scanned-date-filter"
                  type="date"
                  value={scannedDate}
                  onChange={(e) => setScannedDate(e.target.value)}
                  aria-label="Scanned date"
                  className="h-10 w-full rounded-lg border border-violet-100 px-3 text-sm focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
                />
              </div>
            </div>

            {loadingScanned ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-paec-violet" />
              </div>
            ) : scannedMeta.total === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {debouncedSearch
                  ? 'No results match your search.'
                  : 'No scanned tickets for this date.'}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-violet-100">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-violet-50/80">
                      <tr>
                        {[
                          'Attendee Name',
                          'Ticket Number',
                          'QR Code',
                          'Scanned At',
                        ].map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scannedAttendees.map((row) => (
                        <tr
                          key={row.uuid}
                          className="border-t border-violet-50"
                        >
                          <td className="px-3 py-2.5">
                            {row.attendee_name ?? '—'}
                          </td>
                          <td className="px-3 py-2.5">{row.ticket_number}</td>
                          <td className="px-3 py-2.5">
                            <code className="rounded bg-violet-50 px-1.5 py-0.5 text-xs">
                              {row.qr_code.length > 20
                                ? `${row.qr_code.slice(0, 10)}…${row.qr_code.slice(-6)}`
                                : row.qr_code}
                            </code>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {row.used_at ? formatDateTime(row.used_at) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {scannedMeta.last_page > 1 ? (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Page {scannedMeta.current_page} of {scannedMeta.last_page}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={scannedMeta.current_page <= 1 || loadingScanned}
                        onClick={() => setScannedPage((p) => p - 1)}
                        className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={
                          scannedMeta.current_page >= scannedMeta.last_page ||
                          loadingScanned
                        }
                        onClick={() => setScannedPage((p) => p + 1)}
                        className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>

      {successTicket ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 text-center shadow-2xl">
            <CheckCircle2 className="mx-auto mb-4 size-16 text-emerald-500" />
            <h3 className="text-lg font-bold text-foreground">Scan Successful</h3>
            <p className="mt-2 text-base font-semibold text-foreground">
              {formatAttendeeName(successTicket)}
            </p>
            {successTicket.transaction?.order_number ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Order {successTicket.transaction.order_number}
              </p>
            ) : null}
            {formatVisitDate(successTicket.date_of_visit) ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Date of Visit: {formatVisitDate(successTicket.date_of_visit)}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-muted-foreground">
              Confirming entry in{' '}
              <span className="font-semibold text-foreground">
                {confirmCountdown}
              </span>{' '}
              second{confirmCountdown !== 1 ? 's' : ''}…
            </p>
          </div>
        </div>
      ) : null}

      {usedTicket ? (
        <ScannerResultModal
          title="Entry Not Permitted"
          message="This ticket has already been used."
          ticket={usedTicket}
          onClose={() => {
            setUsedTicket(null)
            resumeScanning()
          }}
          variant="error"
        />
      ) : null}

      {invalidTicket ? (
        <ScannerResultModal
          title="Entry Not Permitted"
          message={
            invalidTicket.status === 'expired'
              ? 'This ticket has expired.'
              : invalidTicket.status === 'cancelled'
                ? 'This ticket has been cancelled.'
                : 'This ticket is not active.'
          }
          ticket={invalidTicket}
          onClose={() => {
            setInvalidTicket(null)
            resumeScanning()
          }}
          variant="error"
        />
      ) : null}

      {scheduleWarning ? (
        <ScannerResultModal
          title={scheduleWarning.title}
          message={scheduleWarning.message}
          attendeeName={scheduleWarning.attendeeName}
          visitDate={scheduleWarning.visitDate}
          onClose={() => {
            setScheduleWarning(null)
            resumeScanning()
          }}
          variant="warning"
        />
      ) : null}
    </div>
  )
}

function ScannerResultModal({
  title,
  message,
  ticket,
  attendeeName,
  visitDate,
  onClose,
  variant,
}: {
  title: string
  message: string
  ticket?: TicketDetails
  attendeeName?: string
  visitDate?: string | null
  onClose: () => void
  variant: 'error' | 'warning'
}) {
  const holderName =
    attendeeName?.trim() ||
    (ticket ? formatAttendeeName(ticket) : null)
  const visitLabel =
    visitDate ?? formatVisitDate(ticket?.date_of_visit)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 text-center shadow-2xl">
        <XCircle
          className={cn(
            'mx-auto mb-4 size-16',
            variant === 'warning' ? 'text-amber-500' : 'text-red-500',
          )}
        />
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {holderName ? (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{holderName}</span>
            {ticket?.transaction?.order_number
              ? ` · Order ${ticket.transaction.order_number}`
              : ''}
          </p>
        ) : null}
        {visitLabel ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Date of Visit:{' '}
            <span className="font-semibold text-foreground">{visitLabel}</span>
          </p>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-paec-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-paec-violet-dark"
        >
          Scan Another
        </button>
      </div>
    </div>
  )
}
