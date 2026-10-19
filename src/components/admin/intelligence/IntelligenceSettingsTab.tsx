import { Link } from '@tanstack/react-router'
import { Loader2, Save, Settings2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  EnvironmentBadge,
  ProviderChip,
} from '@/components/admin/PaymentGatewayBadges'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  emptyChannelFee,
  FEE_MODE_OPTIONS,
  financeChannelRateService,
  type ChannelCatalogItem,
  type ChannelFee,
  type FeeMode,
  type FinanceChannelRatesData,
  type FinanceGatewaySummary,
} from '@/services/financeChannelRateService'
import { getProviderMeta } from '@/services/paymentGatewayService'

const inputClassName = cn(
  'h-9 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

function feeNeedsPercentage(mode: FeeMode) {
  return mode !== 'fixed'
}

function feeNeedsFixed(mode: FeeMode) {
  return mode !== 'percentage'
}

function describeFee(fee: ChannelFee): string {
  const pct =
    fee.percentage !== null && fee.percentage !== undefined
      ? `${fee.percentage}%`
      : null
  const fixed =
    fee.fixed_fee !== null && fee.fixed_fee !== undefined
      ? `₱${Number(fee.fixed_fee).toFixed(2)}`
      : null

  switch (fee.fee_mode) {
    case 'fixed':
      return fixed ?? '—'
    case 'percentage':
      return pct ?? '—'
    case 'higher_of':
      if (pct && fixed) return `${pct} or ${fixed}, whichever is higher`
      return pct ?? fixed ?? '—'
    case 'percentage_plus_fixed':
      if (pct && fixed) return `${pct} + ${fixed}`
      return pct ?? fixed ?? '—'
    default:
      return '—'
  }
}

function channelsForGateway(
  gateway: FinanceGatewaySummary,
  catalog: Array<ChannelCatalogItem>,
): Array<ChannelCatalogItem> {
  if (gateway.provider === 'paynamics') {
    const enabled = new Set(gateway.channels ?? [])
    return catalog.filter((item) => enabled.has(item.key))
  }
  if (gateway.provider === 'paypal') {
    return catalog.length
      ? catalog
      : [{ key: 'default', label: 'PayPal', group: 'PayPal' }]
  }
  return catalog
}

type IntelligenceSettingsTabProps = {
  /** When true, omit the page-level title (used inside Finance sub-tabs). */
  embedded?: boolean
}

export function IntelligenceSettingsTab({
  embedded = false,
}: IntelligenceSettingsTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FinanceChannelRatesData | null>(null)
  const [paynamicsDraft, setPaynamicsDraft] = useState<
    Record<string, ChannelFee>
  >({})
  const [paymongoDraft, setPaymongoDraft] = useState<Record<string, ChannelFee>>(
    {},
  )
  const [paypalDraft, setPaypalDraft] = useState<ChannelFee>(
    emptyChannelFee('percentage_plus_fixed'),
  )

  const applyPayload = useCallback((payload: FinanceChannelRatesData) => {
    setData(payload)
    setPaynamicsDraft(payload.channels.paynamics ?? {})
    setPaymongoDraft(payload.channels.paymongo ?? {})
    setPaypalDraft(
      payload.channels.paypal?.default ??
        emptyChannelFee('percentage_plus_fixed'),
    )
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const payload = await financeChannelRateService.getRates()
        if (!cancelled) applyPayload(payload)
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(err, 'Failed to load payment channel rates.'),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [applyPayload])

  const gatewaySections = useMemo(() => {
    if (!data) return []
    return data.gateways.map((gateway) => {
      const catalog = data.channel_catalog[gateway.provider] ?? []
      const channels = channelsForGateway(gateway, catalog)
      const groups = new Map<string, Array<ChannelCatalogItem>>()
      for (const item of channels) {
        const list = groups.get(item.group) ?? []
        list.push(item)
        groups.set(item.group, list)
      }
      return {
        gateway,
        groups: [...groups.entries()],
        channelCount: channels.length,
      }
    })
  }, [data])

  const updateChannelFee = (
    provider: FinanceGatewaySummary['provider'],
    key: string,
    patch: Partial<ChannelFee>,
  ) => {
    if (provider === 'paynamics') {
      setPaynamicsDraft((current) => ({
        ...current,
        [key]: {
          ...(current[key] ?? emptyChannelFee('higher_of')),
          ...patch,
        },
      }))
      return
    }
    if (provider === 'paymongo') {
      setPaymongoDraft((current) => ({
        ...current,
        [key]: {
          ...(current[key] ?? emptyChannelFee('percentage')),
          ...patch,
        },
      }))
      return
    }
    setPaypalDraft((current) => ({ ...current, ...patch }))
  }

  const channelFee = (
    provider: FinanceGatewaySummary['provider'],
    key: string,
  ): ChannelFee => {
    if (provider === 'paynamics') {
      return paynamicsDraft[key] ?? emptyChannelFee('higher_of')
    }
    if (provider === 'paymongo') {
      return (
        paymongoDraft[key] ??
        emptyChannelFee(key === 'dob' ? 'higher_of' : 'percentage')
      )
    }
    return paypalDraft
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    try {
      const paymongoLegacy: FinanceChannelRatesData['paymongo'] = {}
      const salesVisibility: Record<string, boolean> = {}

      for (const [key, fee] of Object.entries(paymongoDraft)) {
        salesVisibility[`paymongo.${key}`] = fee.show_in_sales !== false
        if (key === 'dob') {
          paymongoLegacy.dob = {
            percentage: fee.percentage,
            fixed_minimum: fee.fixed_fee,
            show_in_sales: fee.show_in_sales !== false,
          }
          continue
        }
        paymongoLegacy[key] = {
          percentage: fee.percentage,
          fixed_fee: fee.fixed_fee,
          fee_mode: fee.fee_mode,
          show_in_sales: fee.show_in_sales !== false,
        }
      }

      for (const [key, fee] of Object.entries(paynamicsDraft)) {
        salesVisibility[`paynamics.${key}`] = fee.show_in_sales !== false
      }
      salesVisibility['paypal.default'] = paypalDraft.show_in_sales !== false

      const payload = await financeChannelRateService.updateRates({
        paymongo: paymongoLegacy,
        paypal: {
          paypal_fee: paypalDraft.percentage,
          additional_fee: paypalDraft.fixed_fee,
          show_in_sales: paypalDraft.show_in_sales !== false,
        },
        paynamics: paynamicsDraft,
        sales_visibility: salesVisibility,
      })
      applyPayload(payload)
      toast.success('Payment channel rates saved.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save channel rates.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading payment channel settings…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {!embedded ? (
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              Settings
            </h2>
          ) : (
            <h3 className="text-sm font-bold text-foreground">
              Payment channel rates
            </h3>
          )}
          <p className="text-xs text-muted-foreground sm:text-sm">
            Check a channel to show its deduction in Sales summary. Net sales
            subtracts only checked channel fees under each payment gateway.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !data?.gateways.length}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save rates
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!data?.gateways.length ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/30 px-6 py-10 text-center">
          <Settings2 className="size-8 text-paec-violet/70" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No payment gateways configured
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            Add an active payment gateway first, then return here to set
            channel percentages and fixed deductions.
          </p>
          <Link
            to="/admin/payment-gateways"
            className="mt-4 inline-flex rounded-lg bg-paec-violet px-3 py-1.5 text-xs font-semibold text-white hover:bg-paec-violet-dark"
          >
            Open Payment Gateway
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {gatewaySections.map(({ gateway, groups, channelCount }) => {
            const meta = getProviderMeta(gateway.provider)
            return (
              <div
                key={gateway.uuid}
                className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-3 border-b border-violet-100 bg-violet-50/40 px-4 py-3">
                  <ProviderChip provider={gateway.provider} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {gateway.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {meta.label} · {channelCount} channel
                      {channelCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <EnvironmentBadge
                    environment={
                      gateway.environment === 'testing' ||
                      gateway.environment === 'production'
                        ? gateway.environment
                        : null
                    }
                  />
                </div>

                {channelCount === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No channels enabled on this gateway.
                  </p>
                ) : (
                  <div className="divide-y divide-violet-50">
                    {groups.map(([group, items]) => (
                      <div key={group} className="px-4 py-3">
                        <p className="pl-4 text-[10px] font-semibold tracking-wider text-paec-orange uppercase">
                          {group}
                        </p>
                        <div className="mt-2 space-y-2">
                          {items.map((item) => {
                            const feeKey =
                              gateway.provider === 'paypal'
                                ? 'default'
                                : item.key
                            const fee = channelFee(gateway.provider, feeKey)
                            return (
                              <ChannelRateRow
                                key={`${gateway.uuid}-${item.key}`}
                                label={item.label}
                                fee={fee}
                                onChange={(patch) =>
                                  updateChannelFee(
                                    gateway.provider,
                                    feeKey,
                                    patch,
                                  )
                                }
                              />
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChannelRateRow({
  label,
  fee,
  onChange,
}: {
  label: string
  fee: ChannelFee
  onChange: (patch: Partial<ChannelFee>) => void
}) {
  const showInSales = fee.show_in_sales !== false

  return (
    <div
      className={cn(
        'rounded-xl border py-3 pr-3 pl-8',
        showInSales
          ? 'border-violet-100 bg-violet-50/20'
          : 'border-dashed border-violet-100 bg-white opacity-80',
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <label className="flex min-w-0 cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={showInSales}
            onChange={(e) => onChange({ show_in_sales: e.target.checked })}
            className="mt-0.5 size-4 accent-paec-violet"
          />
          <span className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <span className="text-violet-300">└</span>
              {label}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {showInSales
                ? describeFee(fee)
                : 'Hidden from Sales summary'}
            </span>
          </span>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-[11px] font-medium text-muted-foreground">
            Fee type
          </span>
          <select
            value={fee.fee_mode}
            onChange={(e) =>
              onChange({ fee_mode: e.target.value as FeeMode })
            }
            className={cn(inputClassName, 'mt-1')}
          >
            {FEE_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {feeNeedsPercentage(fee.fee_mode) ? (
          <label className="block">
            <span className="text-[11px] font-medium text-muted-foreground">
              Percentage (%)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={fee.percentage ?? ''}
              onChange={(e) =>
                onChange({
                  percentage:
                    e.target.value === '' ? null : Number(e.target.value),
                })
              }
              placeholder="e.g. 2.5"
              className={cn(inputClassName, 'mt-1')}
            />
          </label>
        ) : null}

        {feeNeedsFixed(fee.fee_mode) ? (
          <label className="block">
            <span className="text-[11px] font-medium text-muted-foreground">
              Fixed fee (₱)
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={fee.fixed_fee ?? ''}
              onChange={(e) =>
                onChange({
                  fixed_fee:
                    e.target.value === '' ? null : Number(e.target.value),
                })
              }
              placeholder="e.g. 20"
              className={cn(inputClassName, 'mt-1')}
            />
          </label>
        ) : null}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {FEE_MODE_OPTIONS.find((option) => option.value === fee.fee_mode)?.hint}
      </p>
    </div>
  )
}
