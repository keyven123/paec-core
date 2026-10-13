import {
  AlertCircle,
  Building2,
  CreditCard,
  FlaskConical,
  Lock,
  Monitor,
  Wallet,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import type { PublicPaymentGateway } from '@/services/marketplaceService'
import type {
  PaymentGatewayProvider,
  PaynamicsChannel,
} from '@/services/paymentGatewayService'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  PAYNAMICS_CHANNELS,
  PAYNAMICS_CHANNEL_GROUPS,
  getProviderMeta,
} from '@/services/paymentGatewayService'

type PaymentBrand = {
  label: string
  className: string
}

type CheckoutProviderContent = {
  title: string
  subtitle: string
  icon: LucideIcon
  brands: Array<PaymentBrand>
  footnote: string
}

const CHECKOUT_PROVIDER_CONTENT: Record<
  PaymentGatewayProvider,
  CheckoutProviderContent
> = {
  paymongo: {
    title: 'Online / eWallet Payment',
    subtitle: 'Pay instantly with your e-wallet, card, or bank',
    icon: Monitor,
    brands: [
      { label: 'GCash', className: 'bg-[#007dfe] text-white' },
      { label: 'GrabPay', className: 'bg-[#00b14f] text-white' },
      { label: 'maya', className: 'bg-black text-[#00d27a] lowercase' },
    ],
    footnote:
      'Secure payment via PayMongo. Supports credit/debit cards, e-wallets, QRPh, and online banking.',
  },
  paypal: {
    title: 'PayPal / Credit & Debit Card',
    subtitle: 'Pay with your PayPal balance or any major card',
    icon: Wallet,
    brands: [
      { label: 'PayPal', className: 'bg-[#003087] text-white italic' },
      { label: 'VISA', className: 'bg-[#1a1f71] text-white italic' },
      { label: 'Mastercard', className: 'bg-[#252525] text-[#f79e1b]' },
    ],
    footnote:
      'Secure payment via PayPal. Pay with your PayPal balance or any major credit/debit card.',
  },
  paynamics: {
    title: 'Card, E-Wallet & Online Banking',
    subtitle: 'Pay by card, e-wallet, or bank transfer',
    icon: Building2,
    brands: [
      { label: 'Cards', className: 'bg-orange-50 text-orange-700' },
      { label: 'E-Wallets', className: 'bg-orange-50 text-orange-700' },
      { label: 'Online Banking', className: 'bg-orange-50 text-orange-700' },
    ],
    footnote:
      'Secure payment via Paynamics. Supports cards, e-wallets, and online banking.',
  },
}

type CheckoutPaymentMethodsProps = {
  gateways: Array<PublicPaymentGateway>
  selectedUuid: string | null
  onSelect: (uuid: string) => void
  paynamicsChannel: PaynamicsChannel | null
  onPaynamicsChannelChange: (channel: PaynamicsChannel) => void
  total: number
  detailsComplete: boolean
  paying: boolean
  onPay: () => void
}

export function CheckoutPaymentMethods({
  gateways,
  selectedUuid,
  onSelect,
  paynamicsChannel,
  onPaynamicsChannelChange,
  total,
  detailsComplete,
  paying,
  onPay,
}: CheckoutPaymentMethodsProps) {
  const selected = gateways.find((gateway) => gateway.uuid === selectedUuid)
  const selectedMeta = selected ? getProviderMeta(selected.provider) : null
  const needsChannel = selected?.provider === 'paynamics'
  const availableChannels = availablePaynamicsChannels(selected)
  const channelMissing =
    needsChannel &&
    (!paynamicsChannel || !availableChannels.includes(paynamicsChannel))
  const canPay =
    detailsComplete && Boolean(selected) && !channelMissing && !paying

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="border-b border-violet-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CreditCard className="size-4 text-paec-violet" />
          Choose Payment Method
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Select your preferred payment option below
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div
          role="radiogroup"
          aria-label="Payment method"
          className="space-y-3"
        >
          {gateways.map((gateway) => (
            <PaymentOptionCard
              key={gateway.uuid}
              gateway={gateway}
              checked={gateway.uuid === selectedUuid}
              disabled={paying}
              onSelect={() => onSelect(gateway.uuid)}
            />
          ))}
        </div>

        {needsChannel ? (
          <PaynamicsChannelPicker
            available={availableChannels}
            value={paynamicsChannel}
            disabled={paying}
            onChange={onPaynamicsChannelChange}
          />
        ) : null}

        <div className="space-y-2.5">
          <Button
            type="button"
            onClick={onPay}
            disabled={!canPay}
            className="h-12 w-full rounded-xl bg-amber-400 text-base font-bold text-slate-900 shadow-sm hover:bg-amber-500 disabled:bg-amber-300/80 disabled:text-slate-700 disabled:opacity-60"
          >
            <Lock className="size-4" />
            {paying
              ? `Redirecting to ${selectedMeta?.label ?? 'payment'}…`
              : `Pay Now · ₱${total.toLocaleString()}`}
          </Button>

          {!detailsComplete ? (
            <p className="flex items-center justify-center gap-1.5 text-center text-sm text-red-600">
              <AlertCircle className="size-4 shrink-0" />
              Please fill in all required fields above before proceeding.
            </p>
          ) : !selected ? (
            <p className="text-center text-sm text-muted-foreground">
              Select a payment method to continue.
            </p>
          ) : channelMissing ? (
            <p className="text-center text-sm text-muted-foreground">
              Choose how you want to pay to continue.
            </p>
          ) : null}
        </div>

        {selected && selectedMeta ? (
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Powered by{' '}
              <span className="font-semibold text-foreground">
                {selectedMeta.label}
              </span>
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              {CHECKOUT_PROVIDER_CONTENT[selected.provider].footnote}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** Channels the gateway's merchant account accepts; older gateways without a list accept all. */
export function availablePaynamicsChannels(
  gateway: PublicPaymentGateway | undefined,
): Array<PaynamicsChannel> {
  if (gateway?.provider !== 'paynamics') return []
  return (
    gateway.payment_channels ??
    PAYNAMICS_CHANNELS.map((channel) => channel.value)
  )
}

function PaynamicsChannelPicker({
  available,
  value,
  disabled,
  onChange,
}: {
  available: Array<PaynamicsChannel>
  value: PaynamicsChannel | null
  disabled: boolean
  onChange: (channel: PaynamicsChannel) => void
}) {
  const channels = PAYNAMICS_CHANNELS.filter((channel) =>
    available.includes(channel.value),
  )

  return (
    <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/30 p-4">
      <p className="text-sm font-semibold text-foreground">
        How would you like to pay?
      </p>
      {PAYNAMICS_CHANNEL_GROUPS.filter((group) =>
        channels.some((channel) => channel.group === group),
      ).map((group) => (
        <div key={group} className="space-y-1.5">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {group}
          </p>
          <div
            role="radiogroup"
            aria-label={`${group} options`}
            className="flex flex-wrap gap-2"
          >
            {channels
              .filter((channel) => channel.group === group)
              .map((channel) => {
                const checked = channel.value === value
                return (
                  <button
                    key={channel.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    disabled={disabled}
                    onClick={() => onChange(channel.value)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                      'focus-visible:ring-2 focus-visible:ring-paec-violet/40 focus-visible:outline-none',
                      'disabled:cursor-not-allowed disabled:opacity-70',
                      checked
                        ? 'border-paec-violet bg-white text-foreground ring-1 ring-paec-violet'
                        : 'border-slate-200 bg-white text-muted-foreground hover:border-violet-200',
                    )}
                  >
                    {channel.label}
                  </button>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}

function PaymentOptionCard({
  gateway,
  checked,
  disabled,
  onSelect,
}: {
  gateway: PublicPaymentGateway
  checked: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const content = CHECKOUT_PROVIDER_CONTENT[gateway.provider]
  const Icon = content.icon

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border bg-white p-4 text-left transition-all',
        'focus-visible:ring-2 focus-visible:ring-paec-violet/40 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-70',
        checked
          ? 'border-paec-violet bg-violet-50/40 ring-1 ring-paec-violet'
          : 'border-slate-200 hover:border-violet-200 hover:bg-violet-50/20',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            checked
              ? 'bg-paec-violet text-white'
              : 'bg-slate-100 text-slate-600',
          )}
        >
          <Icon className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {content.title}
            </span>
            {gateway.environment === 'testing' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                <FlaskConical className="size-3" />
                Test mode
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {content.subtitle}
          </span>

          <span className="mt-3 flex flex-wrap gap-1.5">
            {content.brands.map((brand) => (
              <span
                key={brand.label}
                className={cn(
                  'inline-flex h-7 items-center rounded-md px-2.5 text-xs font-extrabold tracking-tight',
                  brand.className,
                )}
              >
                {brand.label}
              </span>
            ))}
          </span>
        </span>

        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
            checked ? 'border-paec-violet' : 'border-slate-300',
          )}
        >
          {checked ? (
            <span className="size-2.5 rounded-full bg-paec-violet" />
          ) : null}
        </span>
      </div>
    </button>
  )
}
