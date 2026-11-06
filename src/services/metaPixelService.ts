import { adminApi } from '@/lib/api'

export type MetaPixelSettings = {
  enabled: boolean
  pixel_id: string
  access_token_set: boolean
  access_token_masked: string | null
  test_event_code: string | null
}

export type MetaPixelUpdatePayload = {
  enabled: boolean
  pixel_id: string
  access_token?: string
  test_event_code?: string | null
}

export type MetaPixelStats = {
  total: number
  sent: number
  failed: number
  today: number
  by_event: Array<{ event_name: string; total: number }>
  by_source: Array<{ source: string; total: number }>
}

export type MetaPixelEventLog = {
  uuid: string
  event_name: string
  source: string
  status: string
  pixel_id: string | null
  event_id: string | null
  content_name: string | null
  page_url: string | null
  value: number | null
  currency: string | null
  transaction_uuid: string | null
  event_uuid: string | null
  order_id: string | null
  http_status: number | null
  error_message: string | null
  ip_address: string | null
  created_at: string | null
}

export type MetaPixelLogsResponse = {
  data: MetaPixelEventLog[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const metaPixelService = {
  async get(): Promise<MetaPixelSettings> {
    const { data } = await adminApi.get<{ data: MetaPixelSettings }>('/v1/cms/meta-pixel')
    return data.data
  },

  async update(payload: MetaPixelUpdatePayload): Promise<MetaPixelSettings> {
    const { data } = await adminApi.put<{ data: MetaPixelSettings; message?: string }>(
      '/v1/cms/meta-pixel',
      payload,
    )
    return data.data
  },

  async test(): Promise<{ success: boolean; message: string }> {
    const { data } = await adminApi.post<{ success: boolean; message: string }>(
      '/v1/cms/meta-pixel/test',
    )
    return data
  },

  async stats(): Promise<MetaPixelStats> {
    const { data } = await adminApi.get<{ data: MetaPixelStats }>('/v1/cms/meta-pixel/stats')
    return data.data
  },

  async logs(params?: {
    page?: number
    per_page?: number
    event_name?: string
    source?: string
    status?: string
    search?: string
  }): Promise<MetaPixelLogsResponse> {
    const { data } = await adminApi.get<MetaPixelLogsResponse>('/v1/cms/meta-pixel/logs', {
      params,
    })
    return data
  },
}
