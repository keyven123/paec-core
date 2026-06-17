import { adminApi } from '@/lib/api'

export type PermissionCatalogItem = {
  uuid: string
  name: string
  code: string
  module?: string | null
  available_access: string[]
  role_scope?: 'admin' | 'organizer' | 'shared'
  description?: string | null
}

export type MerchantPartnerPermissionCatalogEntry = {
  code: string
  available_access: string
}

export const permissionCatalogService = {
  async getPermissions(params?: { role_scope?: 'admin' | 'organizer' }): Promise<PermissionCatalogItem[]> {
    const { data } = await adminApi.get<{ data: PermissionCatalogItem[] }>('/v1/permissions', {
      params,
    })
    return data.data ?? []
  },

  async getMerchantPartnerCatalog(): Promise<MerchantPartnerPermissionCatalogEntry[]> {
    const { data } = await adminApi.get<{ data: MerchantPartnerPermissionCatalogEntry[] }>(
      '/v1/permissions/merchant-partner/catalog',
    )
    return data.data ?? []
  },
}
