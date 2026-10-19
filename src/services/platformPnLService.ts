import { adminApi } from '@/lib/api'

export type PlatformPnLPeriodType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom'

export type PlatformPnLIncomeStatementRow = {
  key: string
  label: string
  less: boolean
  variant:
    | 'standard'
    | 'summary'
    | 'commission'
    | 'margin'
    | 'gateway_provider'
    | 'gateway_channel'
  /** 0 = top-level, 1 = gateway name, 2 = channel */
  indent?: number
  current_month: number
  previous_month: number
  mom_pct: number | null
  ytd: number
  pct_of_gmv: number
}

export type PlatformPnLKpi = {
  gross_sales_gmv?: number
  refunds?: number
  chargebacks?: number
  gateway_fees?: number
  net_gmv?: number
  net_sales?: number
  mom_gross_sales_gmv_pct: number | null
  mom_refunds_pct?: number | null
  mom_chargebacks_pct?: number | null
  mom_gateway_fees_pct?: number | null
  mom_net_gmv_pct?: number | null
  mom_net_sales_pct?: number | null
}

export type PlatformPnLData = {
  as_of: string
  timezone: string
  period?: {
    type: PlatformPnLPeriodType
    current_label: string
    previous_label: string
    gmv_scope_hint?: string
    current_range?: { start: string; end: string }
    previous_range?: { start: string; end: string }
  }
  kpi: PlatformPnLKpi
  income_statement: {
    current_month_label: string
    previous_month_label: string
    ytd_label: string
    rows: PlatformPnLIncomeStatementRow[]
  }
}

export const platformPnLService = {
  async getPlatformPnL(
    params: {
      period?: PlatformPnLPeriodType
      as_of?: string
      custom_start?: string
      custom_end?: string
    } = {},
  ): Promise<PlatformPnLData> {
    const { data } = await adminApi.get<{ data: PlatformPnLData }>(
      '/v1/admin/finance/platform-pnl',
      {
        params: {
          period: params.period ?? 'monthly',
          ...(params.as_of ? { as_of: params.as_of } : {}),
          ...(params.custom_start ? { custom_start: params.custom_start } : {}),
          ...(params.custom_end ? { custom_end: params.custom_end } : {}),
        },
      },
    )

    return data.data
  },
}
