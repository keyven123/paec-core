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

export const adminDashboardService = {
  async getRecentActivities(): Promise<DashboardActivity[]> {
    const { data } = await adminApi.get<{
      success: boolean
      activities: DashboardActivity[]
    }>('/v1/admin/dashboard/recent-activities')

    return data.activities ?? []
  },
}
