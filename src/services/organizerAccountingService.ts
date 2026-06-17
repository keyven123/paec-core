import { adminApi } from '@/lib/api'

export type OrganizerPnLPeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export type OrganizerPnLIncomeStatementRow = {
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

export type OrganizerPnLKpi = {
  gross_sales_gmv: number
  net_merchant_revenue: number
  platform_commission: number
  tax_and_fees: number
  effective_commission_on_gmv_pct: number
  net_merchant_revenue_pct_of_gmv: number
  available_for_payout: number
  pending_remittance: number
  total_cashout: number
  mom_gross_sales_gmv_pct: number | null
  mom_net_merchant_revenue_pct: number | null
  mom_platform_commission_pct: number | null
}

export type OrganizerPnLData = {
  as_of: string
  timezone: string
  organization_uuid: string
  event_uuid: string | null
  effective_commission_percentage: number | null
  kpi: OrganizerPnLKpi
  income_statement: {
    current_month_label: string
    previous_month_label: string
    ytd_label: string
    rows: OrganizerPnLIncomeStatementRow[]
  }
}

export type OrganizerAccountingSummary = {
  available: number
  available_for_cashout: number
  matured_total_payout: number
  pending: number
  pending_total_payout: number
  total_cashout: number
  commission_percentage: number | null
  effective_commission_percentage: number | null
  currency: string
}

const BASE = '/v1/organizer/accounting'

export const organizerAccountingService = {
  async getPnL(params: {
    period?: OrganizerPnLPeriodType
    as_of?: string
    custom_start?: string
    custom_end?: string
    event_uuid?: string
  } = {}): Promise<OrganizerPnLData> {
    const { data } = await adminApi.get<{ data: OrganizerPnLData }>(`${BASE}/pnl`, {
      params: {
        period: params.period ?? 'monthly',
        ...(params.as_of ? { as_of: params.as_of } : {}),
        ...(params.custom_start ? { custom_start: params.custom_start } : {}),
        ...(params.custom_end ? { custom_end: params.custom_end } : {}),
        ...(params.event_uuid ? { event_uuid: params.event_uuid } : {}),
      },
    })

    return data.data
  },

  async getSummary(eventUuid?: string): Promise<OrganizerAccountingSummary> {
    const { data } = await adminApi.get<{ data: OrganizerAccountingSummary }>(
      `${BASE}/summary`,
      { params: eventUuid ? { event_uuid: eventUuid } : undefined },
    )

    return data.data
  },
}
