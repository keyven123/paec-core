import type { AxiosResponse } from 'axios'

import { adminApi } from '@/lib/api'

export type AnalyticsStats = {
  transactions: number
  total_revenue: number
  this_month_transactions: number
  weekly_sales: number
  daily_sales: number
  total_events: number
  active_events: number
  featured_events: number
  past_events: number
  total_transactions: number
  total_users: number
}

export type TransactionRevenueSeriesPoint = {
  date: string
  total_amount: number
}

export type TransactionRevenueSeriesData = {
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string
  series: TransactionRevenueSeriesPoint[]
}

export type RevenueByEventItem = {
  event_uuid: string
  event_name: string
  total_amount: number
}

export type RevenuePerEventMeta = {
  event_uuid: string
  event_name: string
}

export type RevenuePerEventSeriesPoint = {
  date: string
  amounts: number[]
}

export type RevenuePerEventSeriesData = {
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string
  events: RevenuePerEventMeta[]
  series: RevenuePerEventSeriesPoint[]
}

function buildSeriesQuery(params: {
  granularity: TransactionRevenueSeriesData['granularity']
  start_date?: string
  end_date?: string
  organization_uuid?: string
}): Record<string, string> {
  const query: Record<string, string> = { granularity: params.granularity }
  if (params.organization_uuid) query.organization_uuid = params.organization_uuid
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

export const analyticsService = {
  async getStats(): Promise<AnalyticsStats> {
    const { data } = await adminApi.get<{ data: AnalyticsStats }>('/v1/analytics/stats')
    return data.data
  },

  async getTransactionRevenueSeries(params: {
    granularity: TransactionRevenueSeriesData['granularity']
    start_date?: string
    end_date?: string
    organization_uuid?: string
  }): Promise<TransactionRevenueSeriesData> {
    const { data } = await adminApi.get<{ data: TransactionRevenueSeriesData }>(
      '/v1/analytics/transaction-revenue-series',
      { params: buildSeriesQuery(params) },
    )
    return data.data
  },

  async getRevenuePerEventSeries(params: {
    granularity: RevenuePerEventSeriesData['granularity']
    start_date?: string
    end_date?: string
    organization_uuid?: string
  }): Promise<RevenuePerEventSeriesData> {
    const { data } = await adminApi.get<{ data: RevenuePerEventSeriesData }>(
      '/v1/analytics/revenue-per-event-series',
      { params: buildSeriesQuery(params) },
    )
    return data.data
  },

  async getRevenueByEventPie(params?: { organization_uuid?: string }): Promise<RevenueByEventItem[]> {
    const query: Record<string, string> = {}
    if (params?.organization_uuid) query.organization_uuid = params.organization_uuid

    const { data } = await adminApi.get<{ data: { items: RevenueByEventItem[] } }>(
      '/v1/analytics/revenue-by-event-pie',
      { params: query },
    )

    return data.data.items ?? []
  },

  async getCustomerTypePie(params?: { organization_uuid?: string }): Promise<{
    new_customers: number
    repeat_customers: number
  }> {
    const query: Record<string, string> = {}
    if (params?.organization_uuid) query.organization_uuid = params.organization_uuid

    const { data } = await adminApi.get<{
      data: { new_customers: number; repeat_customers: number }
    }>('/v1/analytics/customer-type-pie', { params: query })

    return data.data
  },

  async exportSalesReport(startDate: string, endDate: string): Promise<void> {
    const response = await adminApi.get<Blob>('/v1/analytics/sales-report', {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob',
      headers: { Accept: 'text/csv, application/csv, */*' },
    })
    downloadCsvFromResponse(response, 'sales_report.csv')
  },

  async exportCancelledCheckouts(startDate: string, endDate: string): Promise<void> {
    const response = await adminApi.get<Blob>('/v1/analytics/cancelled-checkouts', {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob',
      headers: { Accept: 'text/csv, application/csv, */*' },
    })
    downloadCsvFromResponse(response, 'cancelled_checkouts_report.csv')
  },
}
