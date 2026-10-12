import { FlaskConical, Radio, ShieldQuestion } from 'lucide-react'

import type {
  PaymentGatewayEnvironment,
  PaymentGatewayProvider,
} from '@/services/paymentGatewayService'
import { cn } from '@/lib/utils'
import { getProviderMeta } from '@/services/paymentGatewayService'

export function ProviderChip({
  provider,
  size = 'md',
}: {
  provider: PaymentGatewayProvider
  size?: 'sm' | 'md'
}) {
  const meta = getProviderMeta(provider)
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center font-bold tracking-tight',
        meta.chipClassName,
        size === 'sm'
          ? 'size-7 rounded-md text-[10px]'
          : 'size-9 rounded-lg text-xs',
      )}
      aria-hidden
    >
      {meta.initials}
    </span>
  )
}

const environmentStyles = {
  production: {
    label: 'Production',
    icon: Radio,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    title: 'Production keys: real payments are charged',
  },
  testing: {
    label: 'Testing',
    icon: FlaskConical,
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    title: 'Testing keys: sandbox only, no real charges',
  },
  unverified: {
    label: 'Unverified',
    icon: ShieldQuestion,
    className: 'border-slate-200 bg-slate-50 text-slate-600',
    title: 'The environment could not be detected from these keys',
  },
} as const

export function EnvironmentBadge({
  environment,
  className,
}: {
  environment: PaymentGatewayEnvironment | null
  className?: string
}) {
  const style = environmentStyles[environment ?? 'unverified']
  const Icon = style.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        style.className,
        className,
      )}
      title={style.title}
    >
      <Icon className="size-3" />
      {style.label}
    </span>
  )
}
