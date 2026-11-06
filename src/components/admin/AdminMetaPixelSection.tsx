import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MousePointerClick,
  Radio,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  metaPixelService,
  type MetaPixelEventLog,
  type MetaPixelSettings,
  type MetaPixelStats,
} from '@/services/metaPixelService'

import {
  fieldClassName,
  labelClassName,
  sectionClassName,
} from './create-activity/formStyles'

const EVENT_CARD_ORDER = [
  'PageView',
  'ViewContent',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'CancelCheckout',
] as const

function formatWhen(value: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

function statusClass(status: string) {
  if (status === 'sent') return 'bg-emerald-50 text-emerald-700'
  if (status === 'failed') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-800'
}

function sourceLabel(source: string) {
  if (source === 'browser') return 'Browser'
  if (source === 'capi') return 'Conversions API'
  if (source === 'admin_test') return 'Admin test'
  return source
}

export function AdminMetaPixelSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [pixelId, setPixelId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [testEventCode, setTestEventCode] = useState('')
  const [saved, setSaved] = useState<MetaPixelSettings | null>(null)

  const [stats, setStats] = useState<MetaPixelStats | null>(null)
  const [logs, setLogs] = useState<MetaPixelEventLog[]>([])
  const [logsMeta, setLogsMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })
  const [logsLoading, setLogsLoading] = useState(false)
  const [eventFilter, setEventFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const loadSettings = async () => {
    const data = await metaPixelService.get()
    setSaved(data)
    setEnabled(data.enabled)
    setPixelId(data.pixel_id ?? '')
    setTestEventCode(data.test_event_code ?? '')
    setAccessToken('')
  }

  const loadStats = async () => {
    const data = await metaPixelService.stats()
    setStats(data)
  }

  const loadLogs = useCallback(
    async (page = 1) => {
      setLogsLoading(true)
      try {
        const response = await metaPixelService.logs({
          page,
          per_page: 20,
          event_name: eventFilter || undefined,
          source: sourceFilter || undefined,
          status: statusFilter || undefined,
          search: search.trim() || undefined,
        })
        setLogs(response.data)
        setLogsMeta(response.meta)
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to load Meta Pixel logs.'))
      } finally {
        setLogsLoading(false)
      }
    },
    [eventFilter, sourceFilter, statusFilter, search],
  )

  const refreshAll = async () => {
    setLoading(true)
    try {
      await Promise.all([loadSettings(), loadStats(), loadLogs(1)])
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load Meta Pixel page.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshAll()
    // Initial page load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleEventFilter = (name: string) => {
    const next = eventFilter === name ? '' : name
    setEventFilter(next)
    // loadLogs reads eventFilter from closure on next tick — pass explicitly via setState callback pattern
    void metaPixelService
      .logs({
        page: 1,
        per_page: 20,
        event_name: next || undefined,
        source: sourceFilter || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      })
      .then((response) => {
        setLogs(response.data)
        setLogsMeta(response.meta)
      })
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Failed to load Meta Pixel logs.'))
      })
  }

  const handleSave = async () => {
    if (enabled && !pixelId.trim()) {
      toast.error('Meta Pixel ID is required when tracking is enabled.')
      return
    }
    if (enabled && !accessToken.trim() && !saved?.access_token_set) {
      toast.error('Access token is required when tracking is enabled.')
      return
    }

    setSaving(true)
    try {
      const data = await metaPixelService.update({
        enabled,
        pixel_id: pixelId.trim(),
        access_token: accessToken.trim() || undefined,
        test_event_code: testEventCode.trim() || null,
      })
      setSaved(data)
      setAccessToken('')
      toast.success('Meta Pixel settings saved.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save Meta Pixel settings.'))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await metaPixelService.test()
      if (result.success) {
        toast.success(result.message || 'Test event sent.')
        await Promise.all([loadStats(), loadLogs(1)])
      } else {
        toast.error(result.message || 'Test event failed.')
        await Promise.all([loadStats(), loadLogs(1)])
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send Meta Pixel test event.'))
      await Promise.all([loadStats(), loadLogs(1)])
    } finally {
      setTesting(false)
    }
  }

  const eventCount = (name: string) =>
    stats?.by_event.find((row) => row.event_name === name)?.total ?? 0

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Meta Pixel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Project-wide tracking settings, event click cards, and an audit log of
            every event sent to Meta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshAll()}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-paec-violet hover:bg-violet-50"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total events"
          value={stats?.total ?? 0}
          icon={Activity}
          tone="violet"
        />
        <SummaryCard
          label="Sent today"
          value={stats?.today ?? 0}
          icon={MousePointerClick}
          tone="orange"
        />
        <SummaryCard
          label="Delivered"
          value={stats?.sent ?? 0}
          icon={CheckCircle2}
          tone="emerald"
        />
        <SummaryCard
          label="Failed"
          value={stats?.failed ?? 0}
          icon={AlertTriangle}
          tone="red"
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Event clicks
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {EVENT_CARD_ORDER.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toggleEventFilter(name)}
              className={cn(
                'rounded-2xl border bg-white p-3 text-left shadow-sm transition',
                eventFilter === name
                  ? 'border-paec-violet ring-2 ring-paec-violet/20'
                  : 'border-violet-100 hover:border-violet-200',
              )}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {name}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {eventCount(name)}
              </p>
            </button>
          ))}
        </div>
        {(stats?.by_event ?? [])
          .filter(
            (row) =>
              !EVENT_CARD_ORDER.includes(
                row.event_name as (typeof EVENT_CARD_ORDER)[number],
              ),
          )
          .length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(stats?.by_event ?? [])
              .filter(
                (row) =>
                  !EVENT_CARD_ORDER.includes(
                    row.event_name as (typeof EVENT_CARD_ORDER)[number],
                  ),
              )
              .map((row) => (
                <button
                  key={row.event_name}
                  type="button"
                  onClick={() => toggleEventFilter(row.event_name)}
                  className={cn(
                    'rounded-2xl border bg-white p-3 text-left shadow-sm transition',
                    eventFilter === row.event_name
                      ? 'border-paec-violet ring-2 ring-paec-violet/20'
                      : 'border-violet-100 hover:border-violet-200',
                  )}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {row.event_name}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                    {row.total}
                  </p>
                </button>
              ))}
          </div>
        ) : null}
      </div>

      <section className={sectionClassName}>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-paec-violet">
            <Radio className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Conversions API
            </h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Server-side events are sent when a payment succeeds or is cancelled.
              Browser clicks (PageView, ViewContent, checkout) are also recorded
              in the audit log below.
            </p>
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-4 rounded border-violet-200 accent-paec-violet"
          />
          Enable Meta Pixel tracking for this project
        </label>

        {enabled ? (
          <div className="mt-4 grid gap-4">
            <div>
              <label className={labelClassName}>
                Meta Pixel ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="e.g. 684805839657616"
                className={`${fieldClassName} mt-1.5`}
                autoComplete="off"
              />
            </div>
            <div>
              <label className={labelClassName}>
                Access Token{' '}
                {!saved?.access_token_set ? (
                  <span className="text-red-500">*</span>
                ) : null}
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={
                  saved?.access_token_set
                    ? `Saved token ${saved.access_token_masked ?? ''} — leave blank to keep`
                    : 'Paste Conversions API access token'
                }
                className={`${fieldClassName} mt-1.5 font-mono text-sm`}
                autoComplete="new-password"
              />
              {saved?.access_token_set ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700">
                  <ShieldCheck className="size-3.5" />
                  Token on file: {saved.access_token_masked}
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClassName}>
                Test Event Code{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                type="text"
                value={testEventCode}
                onChange={(e) => setTestEventCode(e.target.value)}
                placeholder="From Meta Events Manager → Test Events"
                className={`${fieldClassName} mt-1.5`}
                autoComplete="off"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-paec-violet px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-paec-violet/20 transition hover:bg-paec-violet/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button
            type="button"
            onClick={() => void handleTest()}
            disabled={testing || saving || !enabled || !saved?.enabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-paec-violet transition hover:bg-violet-50 disabled:opacity-60"
          >
            {testing ? <Loader2 className="size-4 animate-spin" /> : null}
            {testing ? 'Sending…' : 'Send test event'}
          </button>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Event audit log
            </h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Every browser click and server Conversions API send recorded for
              this project.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className={`${fieldClassName} w-auto min-w-[9rem]`}
            >
              <option value="">All sources</option>
              <option value="browser">Browser</option>
              <option value="capi">Conversions API</option>
              <option value="admin_test">Admin test</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${fieldClassName} w-auto min-w-[8rem]`}
            >
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search content, URL, order…"
              className={`${fieldClassName} min-w-[12rem]`}
            />
            <button
              type="button"
              onClick={() => void loadLogs(1)}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-paec-violet hover:bg-violet-50"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-violet-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-violet-50/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">When</th>
                <th className="px-3 py-2.5 font-medium">Event</th>
                <th className="px-3 py-2.5 font-medium">Source</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Content / page</th>
                <th className="px-3 py-2.5 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    No Meta Pixel events recorded yet. Browse the storefront or
                    send a test event.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.uuid}
                    className="border-t border-violet-50 align-top hover:bg-violet-50/30"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                      {formatWhen(log.created_at)}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {log.event_name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {sourceLabel(log.source)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          statusClass(log.status),
                        )}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="max-w-[18rem] px-3 py-2.5">
                      <p className="truncate font-medium text-foreground">
                        {log.content_name || '—'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {log.page_url || log.order_id || log.event_id || '—'}
                      </p>
                      {log.error_message ? (
                        <p className="mt-1 line-clamp-2 text-xs text-red-600">
                          {log.error_message}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-foreground">
                      {log.value != null
                        ? `${log.currency || 'PHP'} ${Number(log.value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>
            {logsMeta.total} record{logsMeta.total === 1 ? '' : 's'}
            {eventFilter ? ` · filtered by ${eventFilter}` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={logsMeta.current_page <= 1 || logsLoading}
              onClick={() => void loadLogs(logsMeta.current_page - 1)}
              className="rounded-lg border border-violet-200 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {logsMeta.current_page} / {logsMeta.last_page || 1}
            </span>
            <button
              type="button"
              disabled={
                logsMeta.current_page >= logsMeta.last_page || logsLoading
              }
              onClick={() => void loadLogs(logsMeta.current_page + 1)}
              className="rounded-lg border border-violet-200 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: typeof Activity
  tone: 'violet' | 'orange' | 'emerald' | 'red'
}) {
  const tones = {
    violet: 'bg-violet-50 text-paec-violet',
    orange: 'bg-orange-50 text-paec-orange',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            'flex size-8 items-center justify-center rounded-xl',
            tones[tone],
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
        {value.toLocaleString('en-PH')}
      </p>
    </div>
  )
}
