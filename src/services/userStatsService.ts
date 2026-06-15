import { adminApi } from '@/lib/api'

export type UserStats = {
  total_purchase: number
  on_hand_tickets: number
  transferred_tickets: number
  used_tickets: number
}

export type ActivityItem = {
  type: 'purchase' | 'transferred_ticket' | 'ticket_used'
  message: string
  timestamp: string
}

export type UserTicket = {
  uuid: string
  ticket_number: string
  qr_code?: string | null
  status: string
  used_at?: string | null
  col?: string | null
  row?: string | null
  event_ticket?: { uuid: string; name: string } | null
  event?: { uuid: string; event_name: string } | null
}

export type UserTicketsResponse = {
  data: UserTicket[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const userStatsService = {
  async getUserStats(userUuid: string): Promise<UserStats> {
    const { data } = await adminApi.get<{ data: UserStats }>(
      `/v1/users/${userUuid}/stats`,
    )
    return data.data
  },

  async getUserRecentActivity(userUuid: string): Promise<ActivityItem[]> {
    const { data } = await adminApi.get<{ data: ActivityItem[] }>(
      `/v1/users/${userUuid}/recent-activity`,
    )
    return data.data ?? []
  },

  async getUserTickets(
    userUuid: string,
    params?: { page?: number; per_page?: number; status?: string; q?: string },
  ): Promise<UserTicketsResponse> {
    const { data } = await adminApi.get<UserTicketsResponse>(
      `/v1/users/${userUuid}/tickets`,
      { params },
    )
    return data
  },

  async addTicketToUser(payload: {
    event_uuid: string
    user_uuid: string
    event_location_uuid?: string
    event_ticket_uuid: string
    venue_seat_uuid?: string
    col?: string
    row?: string
    type: string
    quantity?: number
    amount?: number
    valid_until?: string
    other_info?: Array<Record<string, string>>
  }): Promise<void> {
    await adminApi.post('/v1/tickets/add-to-user', payload)
  },
}
