import { adminApi } from '@/lib/api'

export type DashboardActivity = {
  type: 'user' | 'event' | 'purchase'
  message: string
  timestamp: string
  data: {
    uuid?: string
    order_number?: string
    total_amount?: number | string
    user?: {
      first_name?: string
      last_name?: string
      email?: string
      full_name?: string
    }
    event?: { name?: string; event_name?: string }
  }
}

export type DashboardPeriod = 'year' | '30d' | '7d'

export type DashboardKpi = {
  value: number
  previous: number
  change: number | null
  trend: Array<number>
}

export type DashboardAttractionRow = {
  event_uuid: string
  name: string
  slug: string | null
  location: string | null
  image_url: string | null
}

export type DashboardOverview = {
  period: {
    key: DashboardPeriod
    from: string
    to: string
    compare_label: string
  }
  kpis: {
    revenue: DashboardKpi
    orders: DashboardKpi
    tickets_sold: DashboardKpi
    average_order_value: DashboardKpi
    attractions: { total: number; published: number }
  }
  series: Array<{
    label: string
    date: string
    revenue: number
    orders: number
    tickets: number
  }>
  ticket_statuses: Record<string, number>
  top_attractions: Array<
    DashboardAttractionRow & {
      revenue: number
      orders: number
      tickets: number
    }
  >
  upcoming_visits: Array<
    DashboardAttractionRow & { date: string; tickets: number; orders: number }
  >
  recent_bookings: Array<{
    uuid: string
    order_number: string | null
    customer_name: string
    customer_email: string | null
    attraction: string | null
    total_amount: number
    tickets: number
    payment_provider: string | null
    created_at: string
  }>
}

export const adminDashboardService = {
  async getOverview(period: DashboardPeriod): Promise<DashboardOverview> {
    const { data } = await adminApi.get<{
      success: boolean
      data: DashboardOverview
    }>('/v1/admin/dashboard/overview', { params: { period } })

    return data.data
  },

  async getRecentActivities(): Promise<Array<DashboardActivity>> {
    const { data } = await adminApi.get<{
      success: boolean
      activities: Array<DashboardActivity>
    }>('/v1/admin/dashboard/recent-activities')

    return data.activities ?? []
  },
}
