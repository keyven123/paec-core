import { adminApi } from '@/lib/api'

export type PlatformPnLPeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export type PlatformPnLIncomeStatementRow = {
  key: string
  label: string
  less: boolean
  variant: 'standard' | 'summary' | 'commission' | 'margin'
  current_month: number
  previous_month: number
  mom_pct: number | null
  ytd: number
  pct_of_gmv: number
}

export type PlatformPnLKpi = {
  gross_sales_gmv?: number
  net_revenue_commission: number
  tax_and_fees: number
  effective_take_rate_on_gmv_pct: number
  contribution_margin: number
  contribution_margin_pct_of_revenue: number
  mom_gross_sales_gmv_pct: number | null
  mom_net_revenue_commission_pct: number | null
  mom_tax_and_fees_pct: number | null
  mom_contribution_margin_pct: number | null
}

export type PlatformPnLData = {
  as_of: string
  timezone: string
  kpi: PlatformPnLKpi
  income_statement: {
    current_month_label: string
    previous_month_label: string
    ytd_label: string
    rows: PlatformPnLIncomeStatementRow[]
  }
}

export const platformPnLService = {
  async getPlatformPnL(params: {
    period?: PlatformPnLPeriodType
    as_of?: string
    custom_start?: string
    custom_end?: string
  } = {}): Promise<PlatformPnLData> {
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
