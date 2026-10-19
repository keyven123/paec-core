import { ChevronDown, Eye, Handshake, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  AffiliateModal,
  AffiliateTablePagination,
  DetailItem,
  affiliateAdminInputClassName,
  affiliateAdminTableCardClassName,
  affiliateAdminThClassName,
  affiliatePartnerStatusClass,
  affiliatePartnerStatusLabel,
  type AffiliatePartnerFilter,
} from '@/components/admin/affiliate/shared'
import { formatAffiliateDateTime, formatPeso } from '@/lib/affiliateFormat'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  userManagementService,
  type AffiliatePartnerAdminStatsPayload,
  type CustomerUser,
} from '@/services/userManagementService'

const PER_PAGE = 20

const filterOptions: Array<{ value: AffiliatePartnerFilter; label: string }> = [
  { value: 'approved', label: 'Approved partners' },
  { value: 'suspended', label: 'Suspended partners' },
  { value: 'none', label: 'Not enrolled' },
  { value: 'all', label: 'All customers' },
]

function PartnerStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        affiliatePartnerStatusClass(status),
      )}
    >
      {affiliatePartnerStatusLabel(status)}
    </span>
  )
}

function StatCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string
  value: string
  hint?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-violet-100 bg-white p-4',
        highlight && 'ring-1 ring-paec-violet/20',
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-xl font-semibold tabular-nums',
          highlight ? 'text-paec-violet' : 'text-foreground',
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function PartnerProfileModal({
  userUuid,
  onClose,
  onChanged,
}: {
  userUuid: string
  onClose: () => void
  onChanged: () => void
}) {
  const [data, setData] = useState<AffiliatePartnerAdminStatsPayload | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [conversionsPage, setConversionsPage] = useState(1)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)

  const load = useCallback(
    async (page: number) => {
      setLoading(true)
      try {
        setData(
          await userManagementService.getAffiliatePartnerStats(userUuid, {
            conversions_page: page,
          }),
        )
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Could not load partner details.'))
        onClose()
      } finally {
        setLoading(false)
      }
    },
    [userUuid, onClose],
  )

  useEffect(() => {
    void load(conversionsPage)
  }, [load, conversionsPage])

  const applyUserUpdate = (updated: CustomerUser) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            user: {
              ...prev.user,
              affiliate_status:
                updated.affiliate_status ?? prev.user.affiliate_status,
              affiliate_suspend_reason: updated.affiliate_suspend_reason ?? null,
              affiliate_suspended_at: updated.affiliate_suspended_at ?? null,
            },
          }
        : prev,
    )
    onChanged()
  }

  const suspend = async () => {
    const trimmed = reason.trim()
    if (trimmed.length < 3) {
      toast.error('Enter a suspension reason (at least 3 characters).')
      return
    }
    setActing(true)
    try {
      applyUserUpdate(
        await userManagementService.suspendAffiliatePartner(userUuid, trimmed),
      )
      toast.success('Partner suspended.')
      setSuspendOpen(false)
      setReason('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not suspend partner.'))
    } finally {
      setActing(false)
    }
  }

  const reinstate = async () => {
    setActing(true)
    try {
      applyUserUpdate(
        await userManagementService.reinstateAffiliatePartner(userUuid),
      )
      toast.success('Partner reinstated.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not reinstate partner.'))
    } finally {
      setActing(false)
    }
  }

  const status = data?.user.affiliate_status ?? 'none'
  const meta = data?.conversions.meta

  return (
    <AffiliateModal
      wide
      title="Affiliate partner profile"
      onClose={onClose}
      description={
        data ? (
          <span className="space-y-0.5">
            <span className="block text-foreground">
              {data.user.full_name} · {data.user.email}
            </span>
            <span className="flex items-center gap-2 text-xs">
              {data.user.affiliate_code ? (
                <span className="font-mono">Code {data.user.affiliate_code}</span>
              ) : null}
              <PartnerStatusBadge status={status} />
            </span>
          </span>
        ) : undefined
      }
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-violet-50"
        >
          Close
        </button>
      }
    >
      {loading && !data ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-paec-violet" />
        </div>
      ) : data ? (
        <div className="space-y-5">
          <div className="space-y-1.5 rounded-xl border border-violet-100 bg-violet-50/30 p-4 text-xs text-muted-foreground">
            <p className="text-sm font-semibold text-foreground">
              Enrollment &amp; terms
            </p>
            <p>
              Applied: {formatAffiliateDateTime(data.user.affiliate_applied_at)}
            </p>
            <p>
              Approved:{' '}
              {formatAffiliateDateTime(data.user.affiliate_approved_at)}
            </p>
            <p>
              Account terms accepted:{' '}
              {formatAffiliateDateTime(data.user.terms_accepted_at)}
            </p>
          </div>

          {status === 'approved' || status === 'suspended' ? (
            <div
              className={cn(
                'space-y-3 rounded-xl border p-4 text-sm',
                status === 'suspended'
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-violet-100 bg-white',
              )}
            >
              <p className="font-semibold text-foreground">Affiliate access</p>
              {status === 'suspended' ? (
                <>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Suspended:{' '}
                      {formatAffiliateDateTime(data.user.affiliate_suspended_at)}
                    </p>
                    <p className="leading-relaxed text-foreground">
                      Reason:{' '}
                      {data.user.affiliate_suspend_reason?.trim() ||
                        'No reason on file.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => void reinstate()}
                    className="rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {acting ? 'Working…' : 'Reinstate partner'}
                  </button>
                </>
              ) : !suspendOpen ? (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => setSuspendOpen(true)}
                  className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
                >
                  Suspend partner
                </button>
              ) : (
                <div className="max-w-lg space-y-3">
                  <label
                    htmlFor="partner-suspend-reason"
                    className="text-xs font-medium text-foreground"
                  >
                    Reason for suspension
                  </label>
                  <textarea
                    id="partner-suspend-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    disabled={acting}
                    placeholder="Required — visible to the partner on their affiliate page."
                    className="w-full resize-y rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Minimum 3 characters. The customer will see this message
                    while suspended.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={acting || reason.trim().length < 3}
                      onClick={() => void suspend()}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {acting ? 'Working…' : 'Confirm suspension'}
                    </button>
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => {
                        setSuspendOpen(false)
                        setReason('')
                      }}
                      className="rounded-md border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-violet-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Link clicks"
              value={String(data.stats.total_clicks)}
            />
            <StatCard
              label="Total net commission"
              value={formatPeso(data.stats.total_conversions)}
            />
            <StatCard
              label="Matured to date"
              value={formatPeso(data.stats.matured_commission_net ?? 0)}
              hint="Net commission past the payout schedule."
            />
            <StatCard
              highlight
              label="Available commission"
              value={formatPeso(data.stats.available_earnings)}
              hint="Amount the partner can request for payout."
            />
            <StatCard
              label="Requested cash out"
              value={formatPeso(data.stats.pending_earnings)}
            />
            <StatCard
              label="Cashed out / paid"
              value={formatPeso(data.stats.paid_earnings)}
            />
          </div>

          <div className="rounded-xl border border-violet-100 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Bank details on file
            </p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem label="Bank">
                {data.bank_details.bank?.trim() || '—'}
              </DetailItem>
              <DetailItem label="Branch">
                {data.bank_details.branch?.trim() || '—'}
              </DetailItem>
              <DetailItem label="Account name">
                {data.bank_details.account_name?.trim() || '—'}
              </DetailItem>
              <DetailItem label="Account number" mono>
                {data.bank_details.account_number?.trim() || '—'}
              </DetailItem>
              <DetailItem label="TIN" mono>
                {data.bank_details.tin?.trim() || '—'}
              </DetailItem>
            </dl>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              Commission history
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              Credits from referred sales; reversals when a ticket from that
              order is cancelled.
            </p>
            <div className="overflow-hidden rounded-xl border border-violet-100">
              <div className="max-h-[280px] overflow-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-violet-50">
                    <tr className="border-b border-violet-100">
                      {[
                        'Date',
                        'Activity',
                        'Order #',
                        'Status',
                        'Order total',
                        '%',
                        'Commission',
                      ].map((col, index) => (
                        <th
                          key={col}
                          className={cn(
                            affiliateAdminThClassName,
                            index >= 4 && 'text-right',
                          )}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.conversions.data.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          No commission rows yet.
                        </td>
                      </tr>
                    ) : (
                      data.conversions.data.map((row) => {
                        const isReversal =
                          (row.entry_type ?? 'credit') === 'reversal'
                        return (
                          <tr
                            key={row.uuid}
                            className="border-b border-violet-50 last:border-0"
                          >
                            <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                              {formatAffiliateDateTime(row.created_at)}
                            </td>
                            <td
                              className="max-w-[160px] truncate px-3 py-2 text-xs"
                              title={row.event?.event_name}
                            >
                              {row.event?.event_name ?? '—'}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                              {row.transaction?.order_number ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {isReversal ? (
                                <span className="text-red-600">
                                  Reversal
                                  {row.ticket?.ticket_number
                                    ? ` · #${row.ticket.ticket_number}`
                                    : ''}
                                </span>
                              ) : (
                                <span className="text-emerald-600">Earned</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-xs tabular-nums">
                              {formatPeso(row.order_total)}
                            </td>
                            <td className="px-3 py-2 text-right text-xs tabular-nums">
                              {row.commission_percent}%
                            </td>
                            <td
                              className={cn(
                                'px-3 py-2 text-right text-xs font-medium tabular-nums',
                                isReversal ? 'text-red-600' : 'text-emerald-600',
                              )}
                            >
                              {formatPeso(row.commission_amount)}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {meta && meta.last_page > 1 ? (
                <AffiliateTablePagination
                  page={meta.current_page}
                  lastPage={meta.last_page}
                  total={meta.total}
                  disabled={loading}
                  onChange={setConversionsPage}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </AffiliateModal>
  )
}

export function AffiliatePartnersTab() {
  const [rows, setRows] = useState<Array<CustomerUser>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<AffiliatePartnerFilter>('approved')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewUuid, setViewUuid] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filter])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await userManagementService.getCustomers({
        page,
        per_page: PER_PAGE,
        q: debouncedSearch.trim() || undefined,
        affiliate_status: filter === 'all' ? undefined : filter,
      })
      setRows(response.data)
      setLastPage(Math.max(1, response.meta.last_page))
      setTotal(response.meta.total)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load affiliate partners.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filter])

  useEffect(() => {
    void load()
  }, [load])

  const closeProfile = useCallback(() => setViewUuid(null), [])

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className={cn(affiliateAdminInputClassName, 'pl-9')}
          />
        </div>
        <div className="relative w-full sm:w-56">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AffiliatePartnerFilter)}
            className={cn(affiliateAdminInputClassName, 'appearance-none')}
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className={affiliateAdminTableCardClassName}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-violet-50/95">
              <tr className="border-b border-violet-100">
                {['Customer', 'Email', 'Affiliate', 'Code', 'Approved', ''].map(
                  (col, index) => (
                    <th
                      key={col || index}
                      className={cn(
                        affiliateAdminThClassName,
                        index === 5 && 'text-right',
                      )}
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center">
                    <Loader2 className="mx-auto mb-2 size-6 animate-spin text-paec-violet" />
                    <p className="text-sm text-muted-foreground">
                      Loading partners…
                    </p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center">
                    <Handshake className="mx-auto mb-2 size-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No records for this filter
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((user) => (
                  <tr
                    key={user.uuid}
                    className="border-b border-violet-50 transition-colors last:border-0 hover:bg-violet-50/30"
                  >
                    <td className="px-3 py-2.5 text-xs font-bold text-foreground">
                      {user.full_name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-3 py-2.5">
                      <PartnerStatusBadge
                        status={user.affiliate_status ?? 'none'}
                      />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-foreground">
                      {user.affiliate_code ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatAffiliateDateTime(user.affiliate_approved_at)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setViewUuid(user.uuid)}
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

      {viewUuid ? (
        <PartnerProfileModal
          userUuid={viewUuid}
          onClose={closeProfile}
          onChanged={() => void load()}
        />
      ) : null}
    </div>
  )
}
