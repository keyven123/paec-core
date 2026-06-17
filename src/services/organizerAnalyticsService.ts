import type { AxiosResponse } from 'axios'

import { adminApi } from '@/lib/api'
import type {
  RevenuePerEventSeriesData,
  TransactionRevenueSeriesData,
} from '@/services/analyticsService'

const BASE = '/v1/analytics/organizer'

export type OrganizerAnalyticsStats = {
  transactions: number
  this_month_transactions: number
  weekly_sales: number
  daily_sales: number
  total_events: number
  active_events: number
  featured_events: number
  past_events: number
  total_transactions: number
}

export type OrganizerTopSellingEvent = {
  event_uuid: string
  event_name: string
  organizer: string
  total_sales: number
  order_count: number
}

export type OrganizerSalesAnalytics = {
  total_sales: number
  this_month_sales: number
  this_week_sales: number
  today_sales: number
  monthly_trend: { month: string; year_month: string; total: number }[]
  top_selling_events: OrganizerTopSellingEvent[]
  sales_by_ticket_type: {
    event_ticket_uuid: string
    ticket_name: string
    event_name: string
    total_sales: number
    total_quantity: number
  }[]
}

export type SuccessfulFailedTransactionCountsData = {
  granularity: TransactionRevenueSeriesData['granularity']
  start_date: string
  end_date: string
  series: {
    date: string
    successful_count: number
    failed_count: number
  }[]
}

type SeriesParams = {
  granularity: TransactionRevenueSeriesData['granularity']
  start_date?: string
  end_date?: string
}

function buildSeriesQuery(params: SeriesParams): Record<string, string> {
  const query: Record<string, string> = { granularity: params.granularity }
  if (params.start_date) query.start_date = params.start_date
  if (params.end_date) query.end_date = params.end_date
  return query
}

function downloadCsvFromResponse(response: AxiosResponse<Blob>, defaultFilename: string): void {
  const rawDisposition = response.headers['content-disposition']
  const contentDisposition =
    typeof rawDisposition === 'string'
      ? rawDisposition
      : Array.isArray(rawDisposition)
        ? rawDisposition[0]
        : undefined
  let filename = defaultFilename

  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?(.*?)"?$/)
    if (match?.[1]) filename = match[1]
  }

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const organizerAnalyticsService = {
  async getStats(): Promise<OrganizerAnalyticsStats> {
    const { data } = await adminApi.get<{ data: OrganizerAnalyticsStats }>(`${BASE}/stats`)
    return data.data
  },

  async getSales(): Promise<OrganizerSalesAnalytics> {
    const { data } = await adminApi.get<{ data: OrganizerSalesAnalytics }>(`${BASE}/sales`)
    return data.data
  },

  async getTransactionRevenueSeries(params: SeriesParams): Promise<TransactionRevenueSeriesData> {
    const { data } = await adminApi.get<{ data: TransactionRevenueSeriesData }>(
      `${BASE}/transaction-revenue-series`,
      { params: buildSeriesQuery(params) },
    )
    return data.data
  },

  async getRevenuePerEventSeries(params: SeriesParams): Promise<RevenuePerEventSeriesData> {
    const { data } = await adminApi.get<{ data: RevenuePerEventSeriesData }>(
      `${BASE}/revenue-per-event-series`,
      { params: buildSeriesQuery(params) },
    )
    return data.data
  },

  async getSuccessfulFailedTransactionCounts(
    params: SeriesParams,
  ): Promise<SuccessfulFailedTransactionCountsData> {
    const { data } = await adminApi.get<{ data: SuccessfulFailedTransactionCountsData }>(
      `${BASE}/successful-failed-transaction-counts`,
      { params: buildSeriesQuery(params) },
    )
    return data.data
  },

  async getCustomerTypePie(): Promise<{
    new_customers: number
    repeat_customers: number
  }> {
    const { data } = await adminApi.get<{
      data: { new_customers: number; repeat_customers: number }
    }>(`${BASE}/customer-type-pie`)

    return data.data
  },

  async getSuccessfulFailedTransactionPie(): Promise<{
    successful_count: number
    failed_count: number
  }> {
    const { data } = await adminApi.get<{
      data: { successful_count: number; failed_count: number }
    }>(`${BASE}/successful-failed-transaction-pie`)

    return data.data
  },

  async exportTransactionRevenueSeries(params: SeriesParams): Promise<void> {
    const response = await adminApi.get<Blob>(`${BASE}/transaction-revenue-series/export`, {
      params: buildSeriesQuery(params),
      responseType: 'blob',
      headers: { Accept: 'text/csv, application/csv, */*' },
    })
    downloadCsvFromResponse(response, 'transaction_revenue_report.csv')
  },
}
