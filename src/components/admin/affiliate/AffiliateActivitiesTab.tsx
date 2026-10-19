import { Handshake, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  AffiliateTablePagination,
  affiliateAdminInputClassName,
  affiliateAdminTableCardClassName,
  affiliateAdminThClassName,
} from '@/components/admin/affiliate/shared'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  adminEventService,
  type AdminEvent,
} from '@/services/adminEventService'

const PER_PAGE = 15

function AffiliateActivityRow({
  event,
  onUpdated,
}: {
  event: AdminEvent
  onUpdated: (next: AdminEvent) => void
}) {
  const [enabled, setEnabled] = useState(!!event.affiliate_enabled)
  const [percent, setPercent] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEnabled(!!event.affiliate_enabled)
    setPercent(
      event.affiliate_commission_percent != null
        ? String(event.affiliate_commission_percent)
        : '',
    )
    setEndsAt(event.affiliate_ends_at?.slice(0, 10) ?? '')
  }, [
    event.uuid,
    event.affiliate_enabled,
    event.affiliate_commission_percent,
    event.affiliate_ends_at,
  ])

  const savedPercent =
    event.affiliate_commission_percent != null
      ? String(event.affiliate_commission_percent)
      : ''
  const savedEndsAt = event.affiliate_ends_at?.slice(0, 10) ?? ''
  const dirty =
    enabled !== !!event.affiliate_enabled ||
    (enabled && (percent.trim() !== savedPercent || endsAt !== savedEndsAt))

  const save = async () => {
    let commission: number | null = null
    if (enabled) {
      const parsed = Number.parseFloat(percent.trim())
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
        toast.error('Enter a commission between 0.01% and 100%.')
        return
      }
      commission = parsed
    }

    setSaving(true)
    try {
      const response = await adminEventService.updateEventAffiliateSettings(
        event.uuid,
        {
          affiliate_enabled: enabled,
          affiliate_commission_percent: enabled ? commission : null,
          affiliate_ends_at: enabled && endsAt ? endsAt : null,
        },
      )
      onUpdated({ ...event, ...response.data })
      toast.success('Affiliate settings saved.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Could not save affiliate settings.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="border-b border-violet-50 transition-colors last:border-0 hover:bg-violet-50/30">
      <td className="max-w-[240px] px-3 py-2.5">
        <p className="line-clamp-2 text-xs font-bold text-foreground">
          {event.event_name}
        </p>
        {event.slug ? (
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            /{event.slug}
          </p>
        ) : null}
      </td>
      <td className="px-3 py-2.5 text-xs text-foreground capitalize">
        {event.status}
      </td>
      <td className="px-3 py-2.5">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-4 rounded border-violet-300 accent-paec-violet"
          />
          Enabled
        </label>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex max-w-[110px] items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={percent}
            disabled={saving || !enabled}
            onChange={(e) => setPercent(e.target.value)}
            placeholder="%"
            className={affiliateAdminInputClassName}
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <input
          type="date"
          value={endsAt}
          disabled={saving || !enabled}
          onChange={(e) => setEndsAt(e.target.value)}
          className={cn(affiliateAdminInputClassName, 'min-w-[140px]')}
        />
      </td>
      <td className="px-3 py-2.5 text-right">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="rounded-md border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-paec-violet transition-colors hover:border-paec-violet hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </td>
    </tr>
  )
}

export function AffiliateActivitiesTab() {
  const [rows, setRows] = useState<Array<AdminEvent>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminEventService.listEvents({
        page,
        per_page: PER_PAGE,
        q: debouncedSearch.trim() || undefined,
      })
      setRows(response.data)
      setLastPage(Math.max(1, response.meta.last_page))
      setTotal(response.meta.total)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load activities.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activities..."
          className={cn(affiliateAdminInputClassName, 'pl-9')}
        />
      </div>

      <div className={affiliateAdminTableCardClassName}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-violet-50/95">
              <tr className="border-b border-violet-100">
                {[
                  'Activity',
                  'Status',
                  'Affiliate',
                  'Commission',
                  'Program ends',
                  '',
                ].map((col, index) => (
                  <th
                    key={col || index}
                    className={cn(
                      affiliateAdminThClassName,
                      index === 5 && 'text-right',
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
                  <td colSpan={6} className="px-3 py-12 text-center">
                    <Loader2 className="mx-auto mb-2 size-6 animate-spin text-paec-violet" />
                    <p className="text-sm text-muted-foreground">
                      Loading activities…
                    </p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center">
                    <Handshake className="mx-auto mb-2 size-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No activities found
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((event) => (
                  <AffiliateActivityRow
                    key={event.uuid}
                    event={event}
                    onUpdated={(next) =>
                      setRows((current) =>
                        current.map((row) =>
                          row.uuid === next.uuid ? next : row,
                        ),
                      )
                    }
                  />
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
    </div>
  )
}
