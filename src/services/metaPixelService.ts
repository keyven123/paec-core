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
}
