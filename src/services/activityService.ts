import { adminApi } from '@/lib/api'

import type { ActivityStatus, AdminActivity } from '@/data/mockAdminActivities'

type PaginatedResponse<T> = {
  data: T[]
  meta: {
    total: number
    current_page: number
    last_page: number
  }
}

export type ApiEvent = {
  uuid: string
  slug: string
  event_name: string
  event_description: string
  event_config?: string
  status: ActivityStatus
  address: string
  published_at?: string | null
  registration_count: number
  total_revenue: number
  ticket_sold: number
  price_start?: number | null
  organization?: { name: string }
  schedules?: { date_from?: string }[]
  featured_image?: { url: string } | null
  portrait_image?: { url: string } | null
}

export type FunStats = {
  total_published: number
  total_pending: number
  total_transaction_amount: number
  total_tickets_sold: number
}

export type DashboardStats = {
  total_events: number
  tickets_sold: number
  total_revenue: number
}

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0
  return typeof value === 'number' ? value : Number(value) || 0
}

function formatEventDate(event: ApiEvent): string {
  const scheduleDate = event.schedules?.[0]?.date_from
  const dateValue = scheduleDate ?? event.published_at
  if (!dateValue) return '—'

  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function mapEventToAdminActivity(event: ApiEvent): AdminActivity {
  return {
    id: event.uuid,
    title: event.event_name,
    description: event.event_description,
    status: event.status,
    organizer: event.organization?.name ?? '—',
    date: formatEventDate(event),
    revenue: toNumber(event.total_revenue),
    purchases: toNumber(event.ticket_sold),
    views: toNumber(event.registration_count),
  }
}

export const activityService = {
  async listAmusements(perPage = 50): Promise<AdminActivity[]> {
    const { data } = await adminApi.get<PaginatedResponse<ApiEvent>>('/v1/events', {
      params: {
        event_section_type: 'amusements',
        per_page: perPage,
      },
    })

    return data.data.map(mapEventToAdminActivity)
  },

  async getFunStats(): Promise<FunStats> {
    const { data } = await adminApi.get<{
      data: {
        total_published: number | string
        total_pending: number | string
        total_transaction_amount: number | string
        total_tickets_sold: number | string
      }
    }>('/v1/events/fun-stats')

    return {
      total_published: toNumber(data.data.total_published),
      total_pending: toNumber(data.data.total_pending),
      total_transaction_amount: toNumber(data.data.total_transaction_amount),
      total_tickets_sold: toNumber(data.data.total_tickets_sold),
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await adminApi.get<{
      data: {
        total_events: number
        tickets_sold: number
        total_revenue: number
      }
    }>('/v1/admin/dashboard/stats')

    return {
      total_events: data.data.total_events,
      tickets_sold: data.data.tickets_sold,
      total_revenue: toNumber(data.data.total_revenue),
    }
  },

  async listPublishedAmusements(limit = 3): Promise<ApiEvent[]> {
    const { data } = await adminApi.get<PaginatedResponse<ApiEvent>>('/v1/events', {
      params: {
        event_section_type: 'amusements',
        status: 'published',
        per_page: limit,
      },
    })

    return data.data
  },

  async searchPublishedEvents(params?: {
    q?: string
    per_page?: number
  }): Promise<ApiEvent[]> {
    const { data } = await adminApi.get<PaginatedResponse<ApiEvent>>('/v1/events', {
      params: {
        status: 'published',
        per_page: params?.per_page ?? 10,
        q: params?.q?.trim() || undefined,
      },
    })

    return data.data ?? []
  },

  async publish(uuid: string): Promise<void> {
    await adminApi.patch(`/v1/events/${uuid}/publish`)
  },

  async delete(uuid: string): Promise<void> {
    await adminApi.delete(`/v1/events/${uuid}`)
  },
}
