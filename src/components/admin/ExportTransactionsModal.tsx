import { ChevronDown, FileSpreadsheet, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type {
  TransactionReportAttraction,
  TransactionReportDateType,
} from '@/services/adminTransactionService'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { adminTransactionService } from '@/services/adminTransactionService'

export type ExportTransactionsDefaults = {
  orderStatus: string
  dateType: TransactionReportDateType
  startDate: string
  endDate: string
}

type ExportTransactionsModalProps = {
  open: boolean
  defaults: ExportTransactionsDefaults
  onClose: () => void
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
]

const dateTypeOptions: Array<{
  value: TransactionReportDateType
  label: string
}> = [
  { value: 'purchase', label: 'Purchase date' },
  { value: 'visit', label: 'Date of visit' },
]

const inputClassName =
  'mt-1 h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none'

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function rangePresets(): Array<{ label: string; start: string; end: string }> {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const thirtyDaysAgo = new Date(year, month, today.getDate() - 29)

  return [
    {
      label: 'This month',
      start: toDateKey(new Date(year, month, 1)),
      end: toDateKey(new Date(year, month + 1, 0)),
    },
    {
      label: 'Last month',
      start: toDateKey(new Date(year, month - 1, 1)),
      end: toDateKey(new Date(year, month, 0)),
    },
    {
      label: 'Last 30 days',
      start: toDateKey(thirtyDaysAgo),
      end: toDateKey(today),
    },
    { label: 'Any date', start: '', end: '' },
  ]
}

export function ExportTransactionsModal({
  open,
  defaults,
  onClose,
}: ExportTransactionsModalProps) {
  const [attractions, setAttractions] = useState<
    Array<TransactionReportAttraction>
  >([])
  const [attractionsLoading, setAttractionsLoading] = useState(false)
  const [eventUuid, setEventUuid] = useState('')
  const [orderStatus, setOrderStatus] = useState(defaults.orderStatus)
  const [dateType, setDateType] = useState(defaults.dateType)
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [endDate, setEndDate] = useState(defaults.endDate)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!open) return
    setOrderStatus(defaults.orderStatus)
    setDateType(defaults.dateType)
    setStartDate(defaults.startDate)
    setEndDate(defaults.endDate)
  }, [open, defaults])

  useEffect(() => {
    if (!open) return
    let active = true
    setAttractionsLoading(true)
    adminTransactionService
      .exportAttractions()
      .then((items) => {
        if (active) setAttractions(items)
      })
      .catch((err: unknown) => {
        if (active) {
          toast.error(getApiErrorMessage(err, 'Failed to load attractions.'))
        }
      })
      .finally(() => {
        if (active) setAttractionsLoading(false)
      })
    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !exporting) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, exporting, onClose])

  if (!open) return null

  const rangeInvalid = Boolean(startDate && endDate) && endDate < startDate
  const presets = rangePresets()

  const close = () => {
    if (!exporting) onClose()
  }

  const handleStartChange = (value: string) => {
    setStartDate(value)
    if (value && endDate && endDate < value) setEndDate(value)
  }

  const handleExport = async () => {
    if (rangeInvalid || exporting) return
    setExporting(true)
    try {
      await adminTransactionService.exportReport({
        event_uuid: eventUuid || undefined,
        order_status: orderStatus || undefined,
        date_type: dateType,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      toast.success('Transactions report downloaded.')
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to export transactions.'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-label="Close export report"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-transactions-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-violet-100 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FileSpreadsheet className="size-5" />
          </span>
          <div>
            <h3
              id="export-transactions-title"
              className="text-lg font-bold text-foreground"
            >
              Export Report
            </h3>
            <p className="text-sm text-muted-foreground">
              Download the matching transactions as an Excel file.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="export-attraction"
              className="text-xs font-medium text-foreground"
            >
              Attraction
            </label>
            <div className="relative">
              <select
                id="export-attraction"
                value={eventUuid}
                onChange={(e) => setEventUuid(e.target.value)}
                disabled={attractionsLoading}
                className={cn(inputClassName, 'appearance-none pr-9')}
              >
                <option value="">
                  {attractionsLoading
                    ? 'Loading attractions…'
                    : 'All attractions'}
                </option>
                {attractions.map((attraction) => (
                  <option key={attraction.uuid} value={attraction.uuid}>
                    {attraction.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 mt-0.5 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <fieldset>
            <legend className="text-xs font-medium text-foreground">
              Date range
            </legend>
            <div
              role="radiogroup"
              aria-label="Filter dates by"
              className="mt-1 inline-flex rounded-lg border border-violet-100 bg-violet-50/50 p-0.5"
            >
              {dateTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={dateType === option.value}
                  onClick={() => setDateType(option.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    dateType === option.value
                      ? 'bg-white text-paec-violet shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="export-start-date"
                  className="text-xs text-muted-foreground"
                >
                  From
                </label>
                <input
                  id="export-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label
                  htmlFor="export-end-date"
                  className="text-xs text-muted-foreground"
                >
                  To
                </label>
                <input
                  id="export-end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={cn(
                    inputClassName,
                    rangeInvalid && 'border-red-300',
                  )}
                />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const active =
                  startDate === preset.start && endDate === preset.end
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setStartDate(preset.start)
                      setEndDate(preset.end)
                    }}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                      active
                        ? 'border-paec-violet bg-paec-violet text-white'
                        : 'border-violet-100 text-muted-foreground hover:border-paec-violet/40 hover:text-foreground',
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {rangeInvalid ? (
              <p className="mt-2 text-xs text-red-600">
                The end date must be on or after the start date.
              </p>
            ) : null}
          </fieldset>

          <div>
            <label
              htmlFor="export-status"
              className="text-xs font-medium text-foreground"
            >
              Status
            </label>
            <div className="relative">
              <select
                id="export-status"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className={cn(inputClassName, 'appearance-none pr-9')}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 mt-0.5 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            disabled={exporting}
            className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || rangeInvalid}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            {exporting ? 'Exporting…' : 'Export to Excel'}
          </button>
        </div>
      </div>
    </div>
  )
}
