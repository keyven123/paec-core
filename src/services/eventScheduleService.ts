import { api } from '@/lib/api'

export type EventSchedule = {
  uuid: string
  date_from: string
  date_to: string
  schedule_times?: Array<{
    uuid: string
    time_start: string
    time_end: string
  }>
}

export const eventScheduleService = {
  async getSchedules(eventUuid: string): Promise<EventSchedule[]> {
    const { data } = await api.get<{ data: EventSchedule[] }>(
      `/v1/public/events/${eventUuid}/schedule`,
    )
    return data.data ?? []
  },
}
