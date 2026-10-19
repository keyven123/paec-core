import { adminApi } from '@/lib/api'
import type { PaymentGatewayProvider } from '@/services/paymentGatewayService'

export type FeeMode =
  | 'percentage'
  | 'fixed'
  | 'higher_of'
  | 'percentage_plus_fixed'

export type ChannelFee = {
  fee_mode: FeeMode
  percentage: number | null
  fixed_fee: number | null
  fixed_minimum?: number | null
  /** When true, channel appears as a deduction row in Sales summary. */
  show_in_sales?: boolean
}

export type ChannelCatalogItem = {
  key: string
  label: string
  group: string
}

export type FinanceGatewaySummary = {
  uuid: string
  name: string
  provider: PaymentGatewayProvider
  environment: string | null
  status: string
  channels: Array<string> | null
}

export type FinanceChannelRatesData = {
  gateways: Array<FinanceGatewaySummary>
  channel_catalog: {
    paynamics: Array<ChannelCatalogItem>
    paymongo: Array<ChannelCatalogItem>
    paypal: Array<ChannelCatalogItem>
  }
  channels: {
    paymongo: Record<string, ChannelFee>
    paypal: Record<string, ChannelFee>
    paynamics: Record<string, ChannelFee>
  }
  paymongo: Record<
    string,
    | number
    | null
    | {
        percentage?: number | null
        fixed_fee?: number | null
        fixed_minimum?: number | null
        fee_mode?: FeeMode
        show_in_sales?: boolean
      }
  >
  paypal: {
    paypal_fee: number | null
    additional_fee: number | null
    show_in_sales?: boolean
  }
  paynamics: Record<string, ChannelFee>
  updated_at?: string | null
}

export const FEE_MODE_OPTIONS: Array<{ value: FeeMode; label: string; hint: string }> =
  [
    {
      value: 'percentage',
      label: 'Percentage only',
      hint: 'Charge a % of the gross amount',
    },
    {
      value: 'fixed',
      label: 'Fixed fee only',
      hint: 'Charge a flat PHP amount',
    },
    {
      value: 'higher_of',
      label: 'Whichever is higher',
      hint: 'Max of % amount and fixed fee',
    },
    {
      value: 'percentage_plus_fixed',
      label: 'Percentage + fixed',
      hint: 'Add % of gross plus a flat fee',
    },
  ]

export function emptyChannelFee(mode: FeeMode = 'higher_of'): ChannelFee {
  return {
    fee_mode: mode,
    percentage: null,
    fixed_fee: null,
    show_in_sales: true,
  }
}

export const financeChannelRateService = {
  async getRates(): Promise<FinanceChannelRatesData> {
    const { data } = await adminApi.get<{ data: FinanceChannelRatesData }>(
      '/v1/admin/finance/payment-channel-rates',
    )
    return data.data
  },

  async updateRates(payload: {
    paymongo: FinanceChannelRatesData['paymongo']
    paypal: FinanceChannelRatesData['paypal'] & { show_in_sales?: boolean }
    paynamics: Record<string, ChannelFee>
    sales_visibility?: Record<string, boolean>
  }): Promise<FinanceChannelRatesData> {
    const { data } = await adminApi.put<{ data: FinanceChannelRatesData }>(
      '/v1/admin/finance/payment-channel-rates',
      payload,
    )
    return data.data
  },
}
