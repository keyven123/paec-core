import type { ReactNode } from 'react'

import type { GuestCheckoutDetails } from '@/lib/checkoutSession'
import { cn } from '@/lib/utils'

type CheckoutGuestFormProps = {
  values: GuestCheckoutDetails
  errors: Partial<Record<keyof GuestCheckoutDetails, string>>
  onChange: (field: keyof GuestCheckoutDetails, value: string) => void
  disabled?: boolean
}

const fieldClassName = cn(
  'h-11 w-full rounded-xl border bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const labelClassName = 'text-xs font-medium text-foreground'

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  )
}

export function CheckoutGuestForm({
  values,
  errors,
  onChange,
  disabled = false,
}: CheckoutGuestFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="checkout-first-name"
          label="First Name"
          required
          error={errors.firstName}
        >
          <input
            id="checkout-first-name"
            type="text"
            autoComplete="given-name"
            value={values.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            disabled={disabled}
            className={cn(
              fieldClassName,
              errors.firstName ? 'border-red-300' : 'border-violet-100',
            )}
            placeholder="Juan"
          />
        </Field>

        <Field
          id="checkout-last-name"
          label="Last Name"
          required
          error={errors.lastName}
        >
          <input
            id="checkout-last-name"
            type="text"
            autoComplete="family-name"
            value={values.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            disabled={disabled}
            className={cn(
              fieldClassName,
              errors.lastName ? 'border-red-300' : 'border-violet-100',
            )}
            placeholder="Dela Cruz"
          />
        </Field>
      </div>

      <Field id="checkout-address" label="Address" required error={errors.address}>
        <textarea
          id="checkout-address"
          rows={3}
          autoComplete="street-address"
          value={values.address}
          onChange={(e) => onChange('address', e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full resize-none rounded-xl border bg-white px-3 py-2.5 text-sm text-foreground',
            'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
            errors.address ? 'border-red-300' : 'border-violet-100',
          )}
          placeholder="Street, city, province"
        />
      </Field>

      <Field
        id="checkout-email"
        label="Email Address"
        required
        error={errors.email}
      >
        <input
          id="checkout-email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => onChange('email', e.target.value)}
          disabled={disabled}
          className={cn(
            fieldClassName,
            errors.email ? 'border-red-300' : 'border-violet-100',
          )}
          placeholder="you@email.com"
        />
      </Field>

      <Field
        id="checkout-confirm-email"
        label="Confirm Email Address"
        required
        error={errors.confirmEmail}
      >
        <input
          id="checkout-confirm-email"
          type="email"
          autoComplete="email"
          value={values.confirmEmail}
          onChange={(e) => onChange('confirmEmail', e.target.value)}
          disabled={disabled}
          className={cn(
            fieldClassName,
            errors.confirmEmail ? 'border-red-300' : 'border-violet-100',
          )}
          placeholder="you@email.com"
        />
      </Field>

      <Field
        id="checkout-mobile"
        label="Mobile Number"
        required
        error={errors.mobileNumber}
      >
        <input
          id="checkout-mobile"
          type="tel"
          autoComplete="tel"
          value={values.mobileNumber}
          onChange={(e) => onChange('mobileNumber', e.target.value)}
          disabled={disabled}
          className={cn(
            fieldClassName,
            errors.mobileNumber ? 'border-red-300' : 'border-violet-100',
          )}
          placeholder="09XX XXX XXXX"
        />
      </Field>
    </div>
  )
}
