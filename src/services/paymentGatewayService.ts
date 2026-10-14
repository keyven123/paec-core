import { adminApi } from '@/lib/api'

export type PaymentGatewayStatus = 'active' | 'inactive'

export type PaymentGatewayProvider = 'paymongo' | 'paypal' | 'paynamics'

export type PaymentGatewayEnvironment = 'testing' | 'production'

export type PaymentGatewayProviderMeta = {
  value: PaymentGatewayProvider
  label: string
  initials: string
  chipClassName: string
  publicKeyLabel: string
  secretKeyLabel: string
  publicKeyPlaceholder: string
  secretKeyPlaceholder: string
  /** How the backend works out whether the keys are testing or production. */
  environmentDetection: 'key-prefix' | 'verify-with-provider' | 'not-detectable'
  /** Paynamics also needs its API username and password (HTTP Basic auth). */
  requiresApiCredentials?: boolean
}

export const PAYMENT_GATEWAY_PROVIDERS: Array<PaymentGatewayProviderMeta> = [
  {
    value: 'paymongo',
    label: 'PayMongo',
    initials: 'PM',
    chipClassName: 'bg-emerald-100 text-emerald-700',
    publicKeyLabel: 'Public Key',
    secretKeyLabel: 'Secret Key',
    publicKeyPlaceholder: 'pk_test_… or pk_live_…',
    secretKeyPlaceholder: 'sk_test_… or sk_live_…',
    environmentDetection: 'key-prefix',
  },
  {
    value: 'paypal',
    label: 'PayPal',
    initials: 'PP',
    chipClassName: 'bg-blue-100 text-blue-700',
    publicKeyLabel: 'Client ID',
    secretKeyLabel: 'Client Secret',
    publicKeyPlaceholder: 'PayPal REST app client ID',
    secretKeyPlaceholder: 'PayPal REST app client secret',
    environmentDetection: 'verify-with-provider',
  },
  {
    value: 'paynamics',
    label: 'Paynamics',
    initials: 'PN',
    chipClassName: 'bg-orange-100 text-orange-700',
    publicKeyLabel: 'Merchant ID',
    secretKeyLabel: 'Merchant Key',
    publicKeyPlaceholder: 'Paynamics merchant ID',
    secretKeyPlaceholder: 'Paynamics merchant key',
    environmentDetection: 'verify-with-provider',
    requiresApiCredentials: true,
  },
]

export type PaynamicsChannel =
  | 'card'
  | 'gcash'
  | 'maya'
  | 'grabpay'
  | 'shopeepay'
  | 'bdo'
  | 'bpi'
  | 'landbank'
  | 'unionbank'
  | 'billease'

export type PaynamicsChannelGroup =
  | 'Card'
  | 'E-Wallet'
  | 'Online Banking'
  | 'Buy Now, Pay Later'

export const PAYNAMICS_CHANNEL_GROUPS: Array<PaynamicsChannelGroup> = [
  'Card',
  'E-Wallet',
  'Online Banking',
  'Buy Now, Pay Later',
]

/** Mirrors PaynamicsService::CHANNELS on the backend. */
export const PAYNAMICS_CHANNELS: Array<{
  value: PaynamicsChannel
  label: string
  group: PaynamicsChannelGroup
}> = [
  { value: 'card', label: 'Credit / Debit Card', group: 'Card' },
  { value: 'gcash', label: 'GCash', group: 'E-Wallet' },
  { value: 'maya', label: 'Maya', group: 'E-Wallet' },
  { value: 'grabpay', label: 'GrabPay', group: 'E-Wallet' },
  { value: 'shopeepay', label: 'ShopeePay', group: 'E-Wallet' },
  { value: 'bdo', label: 'BDO', group: 'Online Banking' },
  { value: 'bpi', label: 'BPI', group: 'Online Banking' },
  { value: 'landbank', label: 'Landbank', group: 'Online Banking' },
  { value: 'unionbank', label: 'UnionBank', group: 'Online Banking' },
  { value: 'billease', label: 'BillEase', group: 'Buy Now, Pay Later' },
]

/**
 * Mirrors the backend PayMongo check so the form can preview the result.
 * Returns 'mixed' when one key is test and the other live.
 */
export function detectPayMongoEnvironment(
  publicKey: string,
  secretKey: string,
): PaymentGatewayEnvironment | 'mixed' | null {
  const modeOf = (key: string, prefix: 'pk' | 'sk') => {
    const trimmed = key.trim()
    if (trimmed.startsWith(`${prefix}_test_`)) return 'testing'
    if (trimmed.startsWith(`${prefix}_live_`)) return 'production'
    return null
  }
  const publicMode = modeOf(publicKey, 'pk')
  const secretMode = modeOf(secretKey, 'sk')
  if (publicMode && secretMode) {
    return publicMode === secretMode ? publicMode : 'mixed'
  }
  return publicMode ?? secretMode
}

export function getProviderMeta(
  provider: PaymentGatewayProvider,
): PaymentGatewayProviderMeta {
  return (
    PAYMENT_GATEWAY_PROVIDERS.find((meta) => meta.value === provider) ??
    PAYMENT_GATEWAY_PROVIDERS[0]
  )
}

export type PaymentGateway = {
  uuid: string
  name: string
  provider: PaymentGatewayProvider
  /** Detected from the keys; null when it could not be determined. */
  environment: PaymentGatewayEnvironment | null
  gateway_id: string
  public_key_preview: string | null
  secret_key_preview: string | null
  /** Paynamics only; null for other providers. */
  api_username_preview: string | null
  api_password_preview: string | null
  /** Paynamics channels enabled on the merchant account; null for other providers. */
  payment_channels: Array<PaynamicsChannel> | null
  /** Paynamics Paybiz wallet that receives each sale; null settles to the merchant account. */
  paybiz_wallet_id: string | null
  status: PaymentGatewayStatus
  created_at: string | null
  updated_at: string | null
}

/** Key-free gateway summary used when choosing gateways for an activity. */
export type PaymentGatewayOption = Pick<
  PaymentGateway,
  'uuid' | 'name' | 'provider' | 'environment' | 'gateway_id' | 'status'
>

export type PaymentGatewayFilters = {
  q?: string
  provider?: PaymentGatewayProvider
  environment?: PaymentGatewayEnvironment | 'unverified'
  status?: PaymentGatewayStatus
  per_page?: number
}

export type PaymentGatewayListResponse = {
  data: Array<PaymentGateway>
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type CreatePaymentGatewayData = {
  name: string
  provider: PaymentGatewayProvider
  gateway_id: string
  public_key: string
  secret_key: string
  /** Required for Paynamics; ignored for other providers. */
  api_username?: string
  api_password?: string
  payment_channels?: Array<PaynamicsChannel>
  /** Optional Paynamics Paybiz wallet; blank clears it. */
  paybiz_wallet_id?: string
  status: PaymentGatewayStatus
}

/** Blank keys keep the stored credentials. */
export type UpdatePaymentGatewayData = Partial<CreatePaymentGatewayData>

export const paymentGatewayService = {
  async getPaymentGateways(
    filters?: PaymentGatewayFilters,
  ): Promise<PaymentGatewayListResponse> {
    const { data } = await adminApi.get<PaymentGatewayListResponse>(
      '/v1/payment-gateways',
      { params: filters },
    )
    return data
  },

  /** Active gateways, available to activity editors without the Payments permission. */
  async getPaymentGatewayOptions(): Promise<Array<PaymentGatewayOption>> {
    const { data } = await adminApi.get<{ data: Array<PaymentGatewayOption> }>(
      '/v1/payment-gateways/options',
    )
    return data.data
  },

  async createPaymentGateway(
    payload: CreatePaymentGatewayData,
  ): Promise<PaymentGateway> {
    const { data } = await adminApi.post<{ data: PaymentGateway }>(
      '/v1/payment-gateways',
      payload,
    )
    return data.data
  },

  async updatePaymentGateway(
    uuid: string,
    payload: UpdatePaymentGatewayData,
  ): Promise<PaymentGateway> {
    const { data } = await adminApi.put<{ data: PaymentGateway }>(
      `/v1/payment-gateways/${uuid}`,
      payload,
    )
    return data.data
  },

  async deletePaymentGateway(uuid: string): Promise<void> {
    await adminApi.delete(`/v1/payment-gateways/${uuid}`)
  },
}
