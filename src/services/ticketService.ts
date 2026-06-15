import { api } from '@/lib/api'

export type Schedule = {
  uuid: string
  date_from: string
  date_to: string
}

export type ScheduleTime = {
  uuid: string
  time_start: string
  time_end: string
}

export type TicketTransaction = {
  uuid: string
  order_number: string
  total_amount: number
  paid_at?: string | null
}

export type EventTicket = {
  uuid: string
  name: string
  code: string
  price: number
  is_virtual?: boolean
  virtual_event_url?: string | null
}

export type TicketEventLocation = {
  uuid: string
  name?: string | null
  city: string
  address?: string | null
  label: string
}

export type TicketEvent = {
  uuid: string
  name: string
  organizer_name?: string | null
  description: string
  address?: string
  portrait?: { path: string; url: string }
  featured?: { path: string; url: string }
}

export type Ticket = {
  uuid: string
  status: string
  ticket_number: string | null
  attendee_name: string | null
  attendee_email: string | null
  qr_code: string | null
  valid_until: string | null
  date_of_visit?: string | null
  used_at: string | null
  is_past_due?: boolean
  is_downloaded: boolean
  price?: string | number
  gross_revenue?: number | string
  created_at: string
  transaction: TicketTransaction
  event_ticket: EventTicket
  event: TicketEvent
  event_location?: TicketEventLocation | null
  schedule: Schedule | null
  schedule_time: ScheduleTime | null
  transferred_to_user?: {
    uuid: string
    name: string
    email: string
  } | null
}

export type PaginatedTickets = {
  data: Ticket[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function formatTicketVenue(ticket: Ticket): string {
  const location = ticket.event_location
  if (location) {
    const parts = [location.label, location.address, location.city].filter(
      (part, index, array) => Boolean(part) && array.indexOf(part) === index,
    )
    if (parts.length > 0) {
      return parts.join(', ')
    }
  }

  return ticket.event?.address ?? 'Philippines'
}

export const ticketService = {
  async getCustomerTickets(
    page = 1,
    perPage = 10,
    q?: string,
    tab?: 'upcoming' | 'past' | 'transferred',
  ): Promise<PaginatedTickets> {
    const params: Record<string, string | number> = { page, per_page: perPage }
    if (q?.trim()) params.q = q.trim()
    if (tab) params.tab = tab

    const { data } = await api.get<PaginatedTickets>('/v1/customer/my-tickets', {
      params,
    })
    return data
  },
}
