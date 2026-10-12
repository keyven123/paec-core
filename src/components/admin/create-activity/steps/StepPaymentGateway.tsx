import { Link } from '@tanstack/react-router'
import { AlertTriangle, Check, CreditCard, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { sectionClassName } from '../formStyles'
import type { CreateActivityForm } from '@/types/createActivity'
import type { PaymentGatewayOption } from '@/services/paymentGatewayService'
import {
  EnvironmentBadge,
  ProviderChip,
} from '@/components/admin/PaymentGatewayBadges'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  PAYMENT_GATEWAY_PROVIDERS,
  paymentGatewayService,
} from '@/services/paymentGatewayService'

type StepPaymentGatewayProps = {
  form: CreateActivityForm
  onChange: (updates: Partial<CreateActivityForm>) => void
}

export function StepPaymentGateway({
  form,
  onChange,
}: StepPaymentGatewayProps) {
  const [options, setOptions] = useState<Array<PaymentGatewayOption>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    paymentGatewayService
      .getPaymentGatewayOptions()
      .then((data) => {
        if (!cancelled) setOptions(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load payment gateways.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedUuids = useMemo(
    () => new Set(form.paymentGateways.map((gateway) => gateway.uuid)),
    [form.paymentGateways],
  )

  // Keep already-linked gateways visible even if they were deactivated since.
  const groups = useMemo(() => {
    const byUuid = new Map(options.map((gateway) => [gateway.uuid, gateway]))
    for (const gateway of form.paymentGateways) {
      if (!byUuid.has(gateway.uuid)) byUuid.set(gateway.uuid, gateway)
    }
    const all = [...byUuid.values()]
    return PAYMENT_GATEWAY_PROVIDERS.map((meta) => ({
      meta,
      gateways: all.filter((gateway) => gateway.provider === meta.value),
    })).filter((group) => group.gateways.length > 0)
  }, [options, form.paymentGateways])

  const toggle = (gateway: PaymentGatewayOption) => {
    if (selectedUuids.has(gateway.uuid)) {
      onChange({
        paymentGateways: form.paymentGateways.filter(
          (selected) => selected.uuid !== gateway.uuid,
        ),
      })
      return
    }
    onChange({
      paymentGateways: [
        ...form.paymentGateways.filter(
          (selected) => selected.provider !== gateway.provider,
        ),
        gateway,
      ],
    })
  }

  const usesTestingKeys = form.paymentGateways.some(
    (gateway) => gateway.environment === 'testing',
  )
  const usesUnverifiedKeys = form.paymentGateways.some(
    (gateway) => gateway.environment === null,
  )

  return (
    <div className="space-y-4">
      <section className={sectionClassName}>
        <h2 className="text-base font-semibold text-foreground">
          Payment Gateways
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Choose which payment gateway keys this activity uses at checkout. Pick
          up to one gateway per provider.
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-paec-violet" />
            Loading payment gateways…
          </div>
        ) : error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : groups.length === 0 ? (
          <div className="mt-4 rounded-lg border-2 border-dashed border-violet-200 bg-violet-50/30 px-4 py-8 text-center">
            <CreditCard className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              No active payment gateways yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add one in{' '}
              <Link
                to="/admin/payment-gateways"
                className="font-semibold text-paec-violet hover:underline"
              >
                Payment Gateway
              </Link>
              , then come back to select it.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {groups.map(({ meta, gateways }) => (
              <div key={meta.value}>
                <div className="mb-2 flex items-center gap-2">
                  <ProviderChip provider={meta.value} size="sm" />
                  <p className="text-sm font-semibold text-foreground">
                    {meta.label}
                  </p>
                </div>
                <div
                  role="radiogroup"
                  aria-label={`${meta.label} gateway`}
                  className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {gateways.map((gateway) => {
                    const selected = selectedUuids.has(gateway.uuid)
                    const inactive = gateway.status !== 'active'
                    return (
                      <button
                        key={gateway.uuid}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => toggle(gateway)}
                        className={cn(
                          'relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                          selected
                            ? 'border-paec-violet bg-violet-50 ring-2 ring-paec-violet/20'
                            : 'border-violet-100 bg-white hover:border-violet-200 hover:bg-violet-50/40',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                            selected
                              ? 'border-paec-violet bg-paec-violet text-white'
                              : 'border-violet-200 bg-white',
                          )}
                        >
                          {selected ? (
                            <Check className="size-3" strokeWidth={3} />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {gateway.name}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-muted-foreground">
                            {gateway.gateway_id}
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <EnvironmentBadge
                              environment={gateway.environment}
                            />
                            {inactive ? (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                                Inactive
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && groups.length > 0 ? (
          <div className="mt-5 space-y-2">
            {form.paymentGateways.length === 0 ? (
              <Notice>
                No gateway selected. Checkout will use the platform&apos;s
                default payment settings for this activity.
              </Notice>
            ) : null}
            {usesTestingKeys ? (
              <Notice tone="warning">
                A selected gateway uses testing keys. Customers won&apos;t be
                charged real money, so switch to production keys before going
                live.
              </Notice>
            ) : null}
            {usesUnverifiedKeys ? (
              <Notice tone="warning">
                A selected gateway is unverified. Make sure its keys are the
                ones you intend to use.
              </Notice>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning'
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
        tone === 'warning'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-violet-100 bg-violet-50/50 text-muted-foreground',
      )}
    >
      {tone === 'warning' ? (
        <AlertTriangle className="mt-px size-3.5 shrink-0" />
      ) : null}
      <span>{children}</span>
    </p>
  )
}
