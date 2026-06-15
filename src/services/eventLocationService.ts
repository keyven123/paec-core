import { adminApi } from '@/lib/api'

export type EventLocation = {
  uuid: string
  event_uuid: string
  name?: string | null
  city: string
  address?: string | null
  label: string
  organization_uuid?: string | null
  is_active: boolean
  sort_order: number
  organization?: { uuid: string; name: string } | null
  total_orders?: number
  total_amount?: number
  ticket_sold?: number
}

export type CreateEventLocationData = {
  name?: string
  city: string
  address?: string
  organization_uuid?: string | null
  is_active?: boolean
  sort_order?: number
}

export type UpdateEventLocationData = Partial<CreateEventLocationData>

export const eventLocationService = {
  async list(eventUuid: string): Promise<EventLocation[]> {
    const { data } = await adminApi.get<{ data: EventLocation[] }>(
      `/v1/events/${eventUuid}/locations`,
    )
    return data.data ?? []
  },

  async create(
    eventUuid: string,
    payload: CreateEventLocationData,
  ): Promise<EventLocation> {
    const { data } = await adminApi.post<{ data: EventLocation }>(
      `/v1/events/${eventUuid}/locations`,
      payload,
    )
    return data.data
  },

  async update(
    eventUuid: string,
    locationUuid: string,
    payload: UpdateEventLocationData,
  ): Promise<EventLocation> {
    const { data } = await adminApi.put<{ data: EventLocation }>(
      `/v1/events/${eventUuid}/locations/${locationUuid}`,
      payload,
    )
    return data.data
  },

  async remove(eventUuid: string, locationUuid: string): Promise<void> {
    await adminApi.delete(`/v1/events/${eventUuid}/locations/${locationUuid}`)
  },
}
