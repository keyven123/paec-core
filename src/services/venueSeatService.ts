import { api } from '@/lib/api'

export type VenueSeat = {
  uuid: string
  col: number
  row: string
  seat_no: number
  category: string
  is_available?: boolean
}

export const venueSeatService = {
  async searchSeats(params: {
    event_uuid: string
    schedule_uuid?: string
    schedule_time_uuid?: string
    q?: string
    category?: string
  }): Promise<VenueSeat[]> {
    const { event_uuid, ...queryParams } = params
    const { data } = await api.get<VenueSeat[]>(
      `/v1/public/events/${event_uuid}/seats-v2`,
      { params: queryParams },
    )
    return data ?? []
  },
}
