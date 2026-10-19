import { Check, ChevronDown, Eye, Loader2, Wallet, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  AffiliateModal,
  AffiliateTablePagination,
  DetailItem,
  affiliateAdminInputClassName,
  affiliateAdminTableCardClassName,
  affiliateAdminThClassName,
  affiliatePayoutStatusClass,
  type AffiliatePayoutStatusFilter,
} from '@/components/admin/affiliate/shared'
import { formatAffiliateDateTime, formatPeso } from '@/lib/affiliateFormat'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  adminAffiliatePayoutService,
  type AdminAffiliatePayoutRequest,
} from '@/services/adminAffiliatePayoutService'

const PER_PAGE = 20

const statusOptions: Array<{
  value: AffiliatePayoutStatusFilter
  label: string
}> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
]

function PayoutStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
        affiliatePayoutStatusClass(status),
      )}
    >
      {status}
    </span>
  )
}

export function AffiliatePayoutsTab() {
  const [rows, setRows] = useState<Array<AdminAffiliatePayoutRequest>>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<AffiliatePayoutStatusFilter>('all')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [viewRow, setViewRow] = useState<AdminAffiliatePayoutRequest | null>(
    null,
  )
  const [declineTarget, setDeclineTarget] =
    useState<AdminAffiliatePayoutRequest | null>(null)
  const [declineNotes, setDeclineNotes] = useState('')
  const [actionUuid, setActionUuid] = useState<string | null>(null)

  useEffect(() => {
    setPage(1)
  }, [status])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminAffiliatePayoutService.list({
        page,
        per_page: PER_PAGE,
        status: status === 'all' ? undefined : status,
      })
      setRows(response.data)
      setLastPage(Math.max(1, response.meta.last_page))
      setTotal(response.meta.total)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load payout requests.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    void load()
  }, [load])

  const mergeRow = (next: AdminAffiliatePayoutRequest) =>
    setRows((current) =>
      current.map((row) =>
        row.uuid === next.uuid ? { ...row, ...next } : row,
      ),
    )

  const approve = async (row: AdminAffiliatePayoutRequest) => {
    setActionUuid(row.uuid)
    try {
      const { data } = await adminAffiliatePayoutService.approve(row.uuid)
      mergeRow(data)
      setViewRow(null)
      toast.success('Payout approved.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not approve payout.'))
    } finally {
      setActionUuid(null)
    }
  }

  const submitDecline = async () => {
    if (!declineTarget) return
    setActionUuid(declineTarget.uuid)
    try {
      const { data } = await adminAffiliatePayoutService.decline(
        declineTarget.uuid,
        declineNotes.trim() || null,
      )
      mergeRow(data)
      setDeclineTarget(null)
      setDeclineNotes('')
      toast.success('Payout declined.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not decline payout.'))
    } finally {
      setActionUuid(null)
    }
  }

  const openDecline = (row: AdminAffiliatePayoutRequest) => {
    setViewRow(null)
    setDeclineNotes('')
    setDeclineTarget(row)
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="relative w-full sm:w-56">
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as AffiliatePayoutStatusFilter)
          }
          className={cn(affiliateAdminInputClassName, 'appearance-none')}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>

      <div className={affiliateAdminTableCardClassName}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-violet-50/95">
              <tr className="border-b border-violet-100">
                {[
                  'Customer',
                  'Amount',
                  'Status',
                  'Requested',
                  'Processed',
                  'Note',
                  '',
                ].map((col, index) => (
                  <th
                    key={col || index}
                    className={cn(
                      affiliateAdminThClassName,
                      index === 6 && 'text-right',
                    )}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center">
                    <Loader2 className="mx-auto mb-2 size-6 animate-spin text-paec-violet" />
                    <p className="text-sm text-muted-foreground">
                      Loading payout requests…
                    </p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center">
                    <Wallet className="mx-auto mb-2 size-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No payout requests yet
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.uuid}
                    className="border-b border-violet-50 transition-colors last:border-0 hover:bg-violet-50/30"
                  >
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-bold text-foreground">
                        {row.customer?.full_name ?? '—'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {row.customer?.email ?? row.user_uuid}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold whitespace-nowrap tabular-nums">
                      {formatPeso(row.amount_requested)}
                    </td>
                    <td className="px-3 py-2.5">
                      <PayoutStatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                      {formatAffiliateDateTime(row.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                      {formatAffiliateDateTime(row.processed_at)}
                    </td>
                    <td className="max-w-[200px] px-3 py-2.5">
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {row.admin_notes?.trim() || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setViewRow(row)}
                        className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-paec-violet transition-colors hover:border-paec-violet hover:bg-violet-50"
                      >
                        <Eye className="size-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AffiliateTablePagination
          page={page}
          lastPage={lastPage}
          total={total}
          disabled={loading}
          onChange={setPage}
        />
      </div>

      {viewRow ? (
        <AffiliateModal
          title="Payout information"
          description={`${viewRow.customer?.full_name ?? '—'} · ${viewRow.customer?.email ?? '—'}`}
          onClose={() => setViewRow(null)}
          footer={
            <>
              {viewRow.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    disabled={actionUuid === viewRow.uuid}
                    onClick={() => void approve(viewRow)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check className="size-4" />
                    {actionUuid === viewRow.uuid ? 'Working…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={actionUuid === viewRow.uuid}
                    onClick={() => openDecline(viewRow)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="size-4" />
                    Decline
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setViewRow(null)}
                className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-violet-50"
              >
                Close
              </button>
            </>
          }
        >
          <dl className="space-y-3">
            <DetailItem label="Bank">
              {viewRow.bank_details?.bank?.trim() || '—'}
            </DetailItem>
            <DetailItem label="Branch">
              {viewRow.bank_details?.branch?.trim() || '—'}
            </DetailItem>
            <DetailItem label="Account name">
              {viewRow.bank_details?.account_name?.trim() || '—'}
            </DetailItem>
            <DetailItem label="Account number" mono>
              {viewRow.bank_details?.account_number?.trim() || '—'}
            </DetailItem>
            <DetailItem label="Tax Identification Number (TIN)" mono>
              {viewRow.bank_details?.tin?.trim() || '—'}
            </DetailItem>
            <DetailItem label="Amount">
              <span className="font-semibold tabular-nums">
                {formatPeso(viewRow.amount_requested)}
              </span>
            </DetailItem>
            <DetailItem label="Status">
              <PayoutStatusBadge status={viewRow.status} />
            </DetailItem>
            <DetailItem label="Date requested">
              {formatAffiliateDateTime(viewRow.created_at)}
            </DetailItem>
            {viewRow.admin_notes?.trim() ? (
              <DetailItem label="Admin note">
                {viewRow.admin_notes.trim()}
              </DetailItem>
            ) : null}
          </dl>
        </AffiliateModal>
      ) : null}

      {declineTarget ? (
        <AffiliateModal
          title="Decline payout"
          description="Optional note for the partner (shown in their payout history)."
          onClose={() => actionUuid === null && setDeclineTarget(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setDeclineTarget(null)}
                disabled={actionUuid !== null}
                className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitDecline()}
                disabled={actionUuid !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {actionUuid !== null ? 'Working…' : 'Decline request'}
              </button>
            </>
          }
        >
          <label
            htmlFor="decline-notes"
            className="text-xs font-medium text-foreground"
          >
            Admin note
          </label>
          <textarea
            id="decline-notes"
            value={declineNotes}
            onChange={(e) => setDeclineNotes(e.target.value)}
            rows={4}
            placeholder="Reason for decline…"
            className="mt-1.5 w-full resize-y rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
          />
        </AffiliateModal>
      ) : null}
    </div>
  )
}
