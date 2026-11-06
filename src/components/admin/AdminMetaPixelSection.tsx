import { useEffect, useState } from 'react'
import { Loader2, Radio, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api'
import {
  metaPixelService,
  type MetaPixelSettings,
} from '@/services/metaPixelService'

import {
  fieldClassName,
  labelClassName,
  sectionClassName,
} from './create-activity/formStyles'

export function AdminMetaPixelSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [pixelId, setPixelId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [testEventCode, setTestEventCode] = useState('')
  const [saved, setSaved] = useState<MetaPixelSettings | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await metaPixelService.get()
      setSaved(data)
      setEnabled(data.enabled)
      setPixelId(data.pixel_id ?? '')
      setTestEventCode(data.test_event_code ?? '')
      setAccessToken('')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load Meta Pixel settings.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

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
      } else {
        toast.error(result.message || 'Test event failed.')
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send Meta Pixel test event.'))
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Meta Pixel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Project-wide Conversions API tracking for purchases and cancellations.
          This applies to every activity — not configured per attraction.
        </p>
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
              Use the same Pixel ID and access token from Meta Events Manager.
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
            title={
              !saved?.enabled
                ? 'Save settings with tracking enabled before testing'
                : 'Send a test Purchase event to Meta'
            }
          >
            {testing ? <Loader2 className="size-4 animate-spin" /> : null}
            {testing ? 'Sending…' : 'Send test event'}
          </button>
        </div>
      </section>
    </div>
  )
}
