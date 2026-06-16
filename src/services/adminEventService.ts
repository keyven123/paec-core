import type { AxiosResponse } from 'axios'

import { adminApi } from '@/lib/api'

export type EventReportExportType =
  | 'purchasers'
  | 'used_tickets'
  | 'attendee_registration'
  | 'ticket_list'

export type EventExportDateParams = {
  start_date: string
  end_date: string
}

export type EventImage = {
  uuid: string
  url: string
  disk?: string
}

export type AdminEvent = {
  uuid: string
  venue_uuid: string | null
  category_uuid: string | null
  event_section_uuid: string
  organization_uuid?: string
  event_section_name?: string
  event_name: string
  event_description: string
  contact_email: string
  address: string
  city: string
  event_type: string
  event_config: string
  schedule_type: string
  status: string
  today_cutoff_time?: string | null
  track_event_meta?: boolean
  meta_pixel_id?: string | null
  meta_pixel_key?: string | null
  other_info?: Record<string, unknown> | null
  portrait_image?: EventImage | null
  featured_image?: EventImage | null
  event_showcase?: EventImage[] | null
  is_featured: boolean
  is_request_for_featured: boolean
  featured_order: number | null
  is_cancelled: boolean
  is_completed: boolean
  is_active: boolean
  has_seats?: boolean
  published_at: string | null
  cancelled_at: string | null
  completed_at: string | null
  slug?: string
  total_revenue?: number
  ticket_sold?: number
  total_orders?: number
  approvedBy?: { uuid: string; name: string }
  created_at: string
  updated_at: string
  creator?: { uuid: string; name: string; email?: string }
  organization?: { uuid: string; name: string }
  venue?: { uuid: string; name: string }
  category?: { uuid: string; name: string }
  event_tickets?: unknown[]
  schedules?: Array<{
    uuid: string
    date_from: string | null
    date_to: string | null
    schedule_times?: Array<{
      uuid: string
      time_start: string
      time_end: string
    }>
  }>
}

export type RecentActivityItem = {
  type: string
  timestamp: string
  message: string
}

export type FeaturedActivityItem = {
  uuid: string
  slug?: string | null
  event_name: string
  status: string
  city?: string | null
  address?: string | null
  price_start?: number | string | null
  featured_order: number | null
  is_featured?: boolean
  featured_image?: EventImage | null
  portrait_image?: EventImage | null
}

type PaginatedAdminEvents = {
  data: FeaturedActivityItem[]
  meta: {
    total: number
    current_page: number
    last_page: number
  }
}

export type EventTicketsSold = {
  success: boolean
  message: string
  data: Array<{
    name: string
    total_sold_amount: number
    total_sold_tickets: number
  }>
  location_sales?: Array<{
    uuid: string
    name?: string | null
    city: string
    address?: string | null
    label: string
    organization?: { uuid: string; name: string } | null
    total_orders?: number
    total_amount?: number
    ticket_sold?: number
  }>
  total_orders: number
  total_amount: string
  ticket_sold: number
}

function downloadCsvBlob(response: AxiosResponse<Blob>, defaultFilename: string) {
  const contentDisposition = response.headers['content-disposition']
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

export const adminEventService = {
  async getEventDetails(uuid: string): Promise<{ data: AdminEvent }> {
    const { data } = await adminApi.get<{ data: AdminEvent }>(`/v1/events/${uuid}`)
    return data
  },

  async getEventTicketCalendar(
    uuid: string,
    params: { year: number; month: number },
  ): Promise<{
    success: boolean
    message: string
    data: {
      year: number
      month: number
      date_from: string
      date_to: string
      month_summary: {
        flexible_ticket_count: number
        new_sales_count: number
        redeemed_count: number
        total_ticket_count: number
      }
      days: Array<{
        date: string
        priority_ticket_count: number
        flexible_ticket_count: number
        redeemed_count: number
      }>
    }
  }> {
    const { data } = await adminApi.get(`/v1/events/${uuid}/ticket-calendar`, {
      params,
    })
    return data
  },

  async getEventTicketsSold(uuid: string): Promise<EventTicketsSold> {
    const { data } = await adminApi.get<EventTicketsSold>(
      `/v1/events/${uuid}/event-tickets-sold`,
    )
    return data
  },

  async getRecentPurchasedTickets(uuid: string): Promise<{
    success: boolean
    message: string
    activities: RecentActivityItem[]
  }> {
    const { data } = await adminApi.get<{
      success: boolean
      message: string
      activities: RecentActivityItem[]
    }>(`/v1/events/${uuid}/recent-purchased-tickets`)
    return data
  },

  async exportEventReport(
    uuid: string,
    type: EventReportExportType,
    params: EventExportDateParams,
  ): Promise<void> {
    const endpoints: Record<EventReportExportType, string> = {
      purchasers: `/v1/events/${uuid}/export`,
      used_tickets: `/v1/events/${uuid}/export-used-tickets`,
      attendee_registration: `/v1/events/${uuid}/export-attendee-report`,
      ticket_list: `/v1/events/${uuid}/export-tickets`,
    }
    const defaultFilenames: Record<EventReportExportType, string> = {
      purchasers: `purchasers_export_${uuid}.csv`,
      used_tickets: `attendees_export_${uuid}.csv`,
      attendee_registration: `attendee_registration_report_${uuid}.csv`,
      ticket_list: `tickets_${uuid}.csv`,
    }

    const response = await adminApi.get<Blob>(endpoints[type], {
      params,
      responseType: 'blob',
      headers: { Accept: 'text/csv, application/csv, */*' },
    })

    downloadCsvBlob(response, defaultFilenames[type])
  },

  async createEvent(data: FormData): Promise<{ data: AdminEvent }> {
    const response = await adminApi.post<{ data: AdminEvent }>(
      '/v1/events',
      data,
    )
    return response.data
  },

  async publishEvent(uuid: string): Promise<void> {
    await adminApi.patch(`/v1/events/${uuid}/publish`)
  },

  async deleteEvent(uuid: string): Promise<void> {
    await adminApi.delete(`/v1/events/${uuid}`)
  },

  async updateEvent(uuid: string, data: FormData): Promise<{ data: AdminEvent }> {
    // PHP only parses multipart file uploads on POST, not PUT.
    const response = await adminApi.post<{ data: AdminEvent }>(
      `/v1/events/${uuid}`,
      data,
    )
    return response.data
  },

  async listActivitiesForFeaturing(perPage = 200): Promise<FeaturedActivityItem[]> {
    const { data } = await adminApi.get<PaginatedAdminEvents>('/v1/events', {
      params: {
        per_page: perPage,
        sort_by: 'created_at',
        sort: 'desc',
      },
    })

    return data.data ?? []
  },

  async listFeaturedActivities(perPage = 100): Promise<FeaturedActivityItem[]> {
    const { data: featuredData } = await adminApi.get<PaginatedAdminEvents>(
      '/v1/events',
      {
        params: {
          is_featured: true,
          per_page: perPage,
        },
      },
    )

    const items = featuredData.data ?? []

    return [...items].sort(
      (a, b) => (a.featured_order ?? 9999) - (b.featured_order ?? 9999),
    )
  },

  async arrangeFeaturedActivities(
    events: Array<{ uuid: string; featured_order: number }>,
  ): Promise<void> {
    await adminApi.patch('/v1/events/arrange-featured-events', { events })
  },

  async updateTodayCutoff(
    uuid: string,
    todayCutoffTime: string | null,
  ): Promise<{ today_cutoff_time: string | null }> {
    const { data } = await adminApi.patch<{
      data: { today_cutoff_time: string | null }
    }>(`/v1/events/${uuid}/today-cutoff`, {
      today_cutoff_time: todayCutoffTime,
    })
    return data.data
  },

  async getScannedAttendees(
    uuid: string,
    params?: {
      schedule_uuid?: string
      schedule_time_uuid?: string
      page?: number
      per_page?: number
      search?: string
      scanned_date?: string
    },
  ): Promise<{
    success: boolean
    message: string
    data: Array<{
      uuid: string
      ticket_number: string
      attendee_name: string | null
      qr_code: string
      used_at: string | null
      other_info?: Record<string, unknown> | null
    }>
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }> {
    const { data } = await adminApi.get(`/v1/events/${uuid}/scanned-attendees`, {
      params,
    })
    return data
  },
}
