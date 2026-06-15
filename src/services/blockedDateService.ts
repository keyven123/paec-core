import { adminApi, api } from '@/lib/api'

export type BlockableResource = 'events' | 'venue-listings'

export type BlockedDate = {
  uuid: string
  blockable_type?: string
  blockable_uuid?: string
  blocked_date: string
  reason: string | null
  created_at: string
  updated_at: string
}

export type CreateBlockedDatePayload = {
  blocked_date: string
  reason?: string | null
}

export const blockedDateService = {
  async listPublicForEvent(eventUuid: string): Promise<BlockedDate[]> {
    const { data } = await api.get<{ data: BlockedDate[] }>(
      `/v1/public/events/${eventUuid}/blocked-dates`,
    )
    return data.data ?? []
  },

  async list(
    resource: BlockableResource,
    uuid: string,
  ): Promise<{ data: BlockedDate[] }> {
    const { data } = await adminApi.get<{ data: BlockedDate[] }>(
      `/v1/${resource}/${uuid}/blocked-dates`,
    )
    return data
  },

  async create(
    resource: BlockableResource,
    uuid: string,
    payload: CreateBlockedDatePayload,
  ): Promise<{ data: BlockedDate }> {
    const { data } = await adminApi.post<{ data: BlockedDate }>(
      `/v1/${resource}/${uuid}/blocked-dates`,
      payload,
    )
    return data
  },

  async remove(
    resource: BlockableResource,
    uuid: string,
    blockedDateUuid: string,
  ): Promise<void> {
    await adminApi.delete(
      `/v1/${resource}/${uuid}/blocked-dates/${blockedDateUuid}`,
    )
  },
}
