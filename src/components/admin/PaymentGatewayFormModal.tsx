import { AlertTriangle, Check, Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { FormEvent, ReactNode } from 'react'

import type {
  PaymentGateway,
  PaymentGatewayProvider,
  PaymentGatewayProviderMeta,
  PaymentGatewayStatus,
  PaynamicsChannel,
} from '@/services/paymentGatewayService'
import {
  EnvironmentBadge,
  ProviderChip,
} from '@/components/admin/PaymentGatewayBadges'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  PAYMENT_GATEWAY_PROVIDERS,
  PAYNAMICS_CHANNELS,
  PAYNAMICS_CHANNEL_GROUPS,
  detectPayMongoEnvironment,
  getProviderMeta,
  paymentGatewayService,
} from '@/services/paymentGatewayService'

type PaymentGatewayForm = {
  provider: PaymentGatewayProvider | ''
  name: string
  gatewayId: string
  publicKey: string
  secretKey: string
  apiUsername: string
  apiPassword: string
  paymentChannels: Array<PaynamicsChannel>
  status: PaymentGatewayStatus
}

type FormErrors = Partial<Record<keyof PaymentGatewayForm, string>>

const emptyForm: PaymentGatewayForm = {
  provider: '',
  name: '',
  gatewayId: '',
  publicKey: '',
  secretKey: '',
  apiUsername: '',
  apiPassword: '',
  paymentChannels: PAYNAMICS_CHANNELS.map((channel) => channel.value),
  status: 'active',
}

const API_FIELD_MAP: Record<string, keyof PaymentGatewayForm> = {
  provider: 'provider',
  name: 'name',
  gateway_id: 'gatewayId',
  public_key: 'publicKey',
  secret_key: 'secretKey',
  api_username: 'apiUsername',
  api_password: 'apiPassword',
  payment_channels: 'paymentChannels',
  status: 'status',
}

const fieldClassName = cn(
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const labelClassName = 'text-xs font-medium text-foreground'

function formFromGateway(gateway: PaymentGateway | null): PaymentGatewayForm {
  if (!gateway) return emptyForm
  return {
    ...emptyForm,
    provider: gateway.provider,
    name: gateway.name,
    gatewayId: gateway.gateway_id,
    paymentChannels: gateway.payment_channels ?? emptyForm.paymentChannels,
    status: gateway.status,
  }
}

function suggestedGatewayId(form: PaymentGatewayForm) {
  if (!form.provider) return ''
  if (form.provider !== 'paymongo') return form.provider
  const detected = detectPayMongoEnvironment(form.publicKey, form.secretKey)
  if (detected === 'testing') return 'paymongo-test'
  if (detected === 'production') return 'paymongo-live'
  return 'paymongo'
}

export function PaymentGatewayFormModal({
  open,
  gateway,
  onClose,
  onSaved,
}: {
  open: boolean
  /** When set, the modal edits this gateway instead of adding a new one. */
  gateway: PaymentGateway | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = gateway !== null
  const [form, setForm] = useState<PaymentGatewayForm>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [showPublicKey, setShowPublicKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showApiPassword, setShowApiPassword] = useState(false)
  const [nameEdited, setNameEdited] = useState(false)
  const [gatewayIdEdited, setGatewayIdEdited] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(formFromGateway(gateway))
    setErrors({})
    setShowPublicKey(false)
    setShowSecretKey(false)
    setShowApiPassword(false)
    setNameEdited(gateway !== null)
    setGatewayIdEdited(gateway !== null)
  }, [open, gateway])

  if (!open) return null

  const providerMeta = form.provider ? getProviderMeta(form.provider) : null
  const needsApiCredentials = providerMeta?.requiresApiCredentials === true
  /** Stored API credentials can be kept only when the gateway already uses this provider. */
  const hasStoredApiCredentials =
    isEdit &&
    gateway.provider === form.provider &&
    Boolean(gateway.api_password_preview)

  /** Applies a change and refreshes the auto-suggested name and ID until the admin types their own. */
  const update = (changes: Partial<PaymentGatewayForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...changes }
      if (next.provider && !nameEdited && !('name' in changes)) {
        next.name = getProviderMeta(next.provider).label
      }
      if (!gatewayIdEdited && !('gatewayId' in changes)) {
        next.gatewayId = suggestedGatewayId(next)
      }
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(changes) as Array<
        keyof PaymentGatewayForm
      >) {
        next[key] = undefined
      }
      if (!nameEdited) next.name = undefined
      if (!gatewayIdEdited) next.gatewayId = undefined
      return next
    })
  }

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!form.provider) next.provider = 'Select a payment provider.'
    if (!form.name.trim()) next.name = 'Payment name is required.'
    if (!form.gatewayId.trim()) next.gatewayId = 'Payment ID is required.'
    if (!isEdit && !form.publicKey.trim()) {
      next.publicKey = `${providerMeta?.publicKeyLabel ?? 'Public key'} is required.`
    }
    if (!isEdit && !form.secretKey.trim()) {
      next.secretKey = `${providerMeta?.secretKeyLabel ?? 'Secret key'} is required.`
    }
    if (needsApiCredentials && !hasStoredApiCredentials) {
      if (!form.apiUsername.trim()) {
        next.apiUsername = 'API username is required.'
      }
      if (!form.apiPassword.trim()) {
        next.apiPassword = 'API password is required.'
      }
    }
    if (needsApiCredentials && form.paymentChannels.length === 0) {
      next.paymentChannels =
        'Select at least one payment option enabled on your Paynamics account.'
    }
    return next
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0 || !form.provider) {
      setErrors(clientErrors)
      return
    }

    const payload = {
      provider: form.provider,
      name: form.name.trim(),
      gateway_id: form.gatewayId.trim(),
      public_key: form.publicKey.trim(),
      secret_key: form.secretKey.trim(),
      ...(needsApiCredentials
        ? {
            api_username: form.apiUsername.trim(),
            api_password: form.apiPassword.trim(),
            payment_channels: form.paymentChannels,
          }
        : {}),
      status: form.status,
    }

    setSubmitting(true)
    try {
      const saved = gateway
        ? await paymentGatewayService.updatePaymentGateway(
            gateway.uuid,
            payload,
          )
        : await paymentGatewayService.createPaymentGateway(payload)
      const environmentLabel =
        saved.environment === 'production'
          ? 'production'
          : saved.environment === 'testing'
            ? 'testing'
            : 'unverified'
      toast.success(
        `Payment gateway ${gateway ? 'updated' : 'added'} (${environmentLabel} keys).`,
      )
      onSaved()
      onClose()
    } catch (error) {
      const apiErrors = getApiValidationErrors(error)
      const mapped: FormErrors = {}
      for (const [field, messages] of Object.entries(apiErrors)) {
        const key = API_FIELD_MAP[field] as keyof PaymentGatewayForm | undefined
        if (key) {
          mapped[key] = Array.isArray(messages) ? messages[0] : messages
        }
      }
      if (Object.keys(mapped).length > 0) {
        setErrors(mapped)
      } else {
        toast.error(
          getApiErrorMessage(
            error,
            isEdit
              ? 'Failed to update payment gateway.'
              : 'Failed to add payment gateway.',
          ),
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const keyPlaceholder = (kind: 'public' | 'secret') => {
    if (isEdit) return 'Leave blank to keep the current key'
    if (!providerMeta) return 'Select a provider first'
    return kind === 'public'
      ? providerMeta.publicKeyPlaceholder
      : providerMeta.secretKeyPlaceholder
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
        aria-label="Close payment gateway form"
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl">
        <div className="relative shrink-0 border-b border-violet-100 px-6 py-4 text-center">
          <h2 className="text-lg font-bold text-foreground">
            {isEdit ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Keys are encrypted and never shown in full after saving.
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          id="payment-gateway-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
          noValidate
        >
          <FormField label="Payment Provider" required error={errors.provider}>
            <div
              role="radiogroup"
              aria-label="Payment provider"
              className="grid grid-cols-3 gap-2"
            >
              {PAYMENT_GATEWAY_PROVIDERS.map((meta) => {
                const selected = form.provider === meta.value
                return (
                  <button
                    key={meta.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => update({ provider: meta.value })}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all',
                      selected
                        ? 'border-paec-violet bg-violet-50 text-foreground ring-2 ring-paec-violet/20'
                        : 'border-violet-100 bg-white text-muted-foreground hover:border-violet-200 hover:bg-violet-50/50',
                    )}
                  >
                    {selected ? (
                      <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-paec-violet text-white">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    ) : null}
                    <ProviderChip provider={meta.value} />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Payment Name" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setNameEdited(true)
                  update({ name: e.target.value })
                }}
                placeholder="e.g. PayMongo"
                className={fieldClassName}
                autoComplete="off"
              />
            </FormField>

            <FormField label="Payment ID" required error={errors.gatewayId}>
              <input
                type="text"
                value={form.gatewayId}
                onChange={(e) => {
                  setGatewayIdEdited(true)
                  update({ gatewayId: e.target.value })
                }}
                placeholder="e.g. paymongo-live"
                className={fieldClassName}
                autoComplete="off"
              />
            </FormField>
          </div>

          <SecretField
            label={providerMeta?.publicKeyLabel ?? 'Public Key'}
            required={!isEdit}
            value={form.publicKey}
            visible={showPublicKey}
            onToggle={() => setShowPublicKey((v) => !v)}
            onChange={(value) => update({ publicKey: value })}
            placeholder={keyPlaceholder('public')}
            hint={
              isEdit && gateway.public_key_preview
                ? `Current: ${gateway.public_key_preview}`
                : undefined
            }
            error={errors.publicKey}
          />

          <SecretField
            label={providerMeta?.secretKeyLabel ?? 'Secret Key'}
            required={!isEdit}
            value={form.secretKey}
            visible={showSecretKey}
            onToggle={() => setShowSecretKey((v) => !v)}
            onChange={(value) => update({ secretKey: value })}
            placeholder={keyPlaceholder('secret')}
            hint={
              isEdit && gateway.secret_key_preview
                ? `Current: ${gateway.secret_key_preview}`
                : undefined
            }
            error={errors.secretKey}
          />

          {needsApiCredentials ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="API Username"
                required={!hasStoredApiCredentials}
                error={errors.apiUsername}
                hint={
                  hasStoredApiCredentials && gateway.api_username_preview
                    ? `Current: ${gateway.api_username_preview}`
                    : undefined
                }
              >
                <input
                  type="text"
                  value={form.apiUsername}
                  onChange={(e) => update({ apiUsername: e.target.value })}
                  placeholder={
                    hasStoredApiCredentials
                      ? 'Leave blank to keep the current username'
                      : 'Paynamics API username'
                  }
                  className={cn(fieldClassName, 'font-mono')}
                  autoComplete="off"
                  spellCheck={false}
                />
              </FormField>
              <SecretField
                label="API Password"
                required={!hasStoredApiCredentials}
                value={form.apiPassword}
                visible={showApiPassword}
                onToggle={() => setShowApiPassword((v) => !v)}
                onChange={(value) => update({ apiPassword: value })}
                placeholder={
                  hasStoredApiCredentials
                    ? 'Leave blank to keep the current password'
                    : 'Paynamics API password'
                }
                hint={
                  hasStoredApiCredentials && gateway.api_password_preview
                    ? `Current: ${gateway.api_password_preview}`
                    : undefined
                }
                error={errors.apiPassword}
              />
            </div>
          ) : null}

          {needsApiCredentials ? (
            <FormField
              label="Payment Options"
              required
              error={errors.paymentChannels}
              hint="Tick only the options Paynamics enabled on your merchant account."
            >
              <div className="space-y-2.5 rounded-lg border border-violet-100 p-3">
                {PAYNAMICS_CHANNEL_GROUPS.map((group) => (
                  <div key={group}>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {group}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
                      {PAYNAMICS_CHANNELS.filter(
                        (channel) => channel.group === group,
                      ).map((channel) => (
                        <label
                          key={channel.value}
                          className="flex items-center gap-1.5 text-xs text-foreground"
                        >
                          <input
                            type="checkbox"
                            className="size-3.5 accent-paec-violet"
                            checked={form.paymentChannels.includes(
                              channel.value,
                            )}
                            onChange={(e) =>
                              update({
                                paymentChannels: e.target.checked
                                  ? [...form.paymentChannels, channel.value]
                                  : form.paymentChannels.filter(
                                      (value) => value !== channel.value,
                                    ),
                              })
                            }
                          />
                          {channel.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FormField>
          ) : null}

          {providerMeta ? (
            <DetectedEnvironment
              providerMeta={providerMeta}
              publicKey={form.publicKey}
              secretKey={form.secretKey}
              current={
                isEdit && gateway.provider === form.provider
                  ? gateway.environment
                  : undefined
              }
            />
          ) : null}

          <FormField label="Status" error={errors.status}>
            <select
              value={form.status}
              onChange={(e) =>
                update({ status: e.target.value as PaymentGatewayStatus })
              }
              className={fieldClassName}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
        </form>

        <div className="flex shrink-0 justify-end gap-2 border-t border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-violet-200 bg-white px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="payment-gateway-form"
            disabled={submitting}
            className="rounded-lg bg-paec-violet px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:opacity-50"
          >
            {submitting
              ? providerMeta?.environmentDetection === 'verify-with-provider'
                ? 'Verifying…'
                : 'Saving…'
              : isEdit
                ? 'Save Changes'
                : 'Add Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Read-only preview of how the backend will classify the keys. The saved value always comes
 * from the server, which is the source of truth.
 */
function DetectedEnvironment({
  providerMeta,
  publicKey,
  secretKey,
  current,
}: {
  providerMeta: PaymentGatewayProviderMeta
  publicKey: string
  secretKey: string
  /** Stored environment when editing; undefined when adding or switching provider. */
  current?: PaymentGateway['environment']
}) {
  const typedKeys = publicKey.trim() !== '' || secretKey.trim() !== ''
  const showCurrent = current !== undefined && !typedKeys

  let badge: ReactNode = null
  let message: ReactNode
  let warning = false

  if (showCurrent) {
    badge = <EnvironmentBadge environment={current} />
    message = 'Re-checked automatically if you replace the keys.'
  } else if (providerMeta.environmentDetection === 'key-prefix') {
    const detected = detectPayMongoEnvironment(publicKey, secretKey)
    if (detected === 'mixed') {
      warning = true
      message =
        'One key is a test key and the other is a live key. Both must match.'
    } else if (detected) {
      badge = <EnvironmentBadge environment={detected} />
      message =
        detected === 'production'
          ? 'Live keys. Real payments will be charged to customers.'
          : 'Test keys. No real money is charged.'
    } else if (typedKeys) {
      warning = true
      message =
        'PayMongo keys start with pk_test_ / sk_test_ or pk_live_ / sk_live_.'
    } else {
      message = 'Detected from the key prefix: test_ or live_.'
    }
  } else if (providerMeta.environmentDetection === 'verify-with-provider') {
    message = `Checked with ${providerMeta.label} when you save: sandbox keys are marked Testing, live keys Production.`
  } else {
    badge = <EnvironmentBadge environment={null} />
    message = `${providerMeta.label} keys don't indicate whether they are test or live, so this gateway will be marked Unverified.`
  }

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5',
        warning
          ? 'border-amber-200 bg-amber-50'
          : 'border-violet-100 bg-violet-50/40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">
          Detected environment
        </p>
        {badge}
      </div>
      <p
        className={cn(
          'mt-1 flex items-start gap-1.5 text-[11px]',
          warning ? 'text-amber-800' : 'text-muted-foreground',
        )}
      >
        {warning ? <AlertTriangle className="mt-px size-3 shrink-0" /> : null}
        <span>{message}</span>
      </p>
    </div>
  )
}

function FormField({
  label,
  required = false,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className={labelClassName}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="font-mono text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function SecretField({
  label,
  required,
  value,
  visible,
  onToggle,
  onChange,
  placeholder,
  hint,
  error,
}: {
  label: string
  required: boolean
  value: string
  visible: boolean
  onToggle: () => void
  onChange: (value: string) => void
  placeholder: string
  hint?: string
  error?: string
}) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            fieldClassName,
            'pr-10 font-mono [&::-ms-reveal]:hidden',
          )}
          autoComplete="new-password"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </FormField>
  )
}
