import { adminApi } from '@/lib/api'
import { isMerchantPartnerSession } from '@/lib/adminAuth'

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
  async getPermissions(params?: { role_scope?: 'admin' | 'organizer' | 'shared' }): Promise<PermissionCatalogItem[]> {
    const path = isMerchantPartnerSession() ? '/v1/organizer/permissions' : '/v1/permissions'
    const { data } = await adminApi.get<{ data: PermissionCatalogItem[] }>(path, {
      params: isMerchantPartnerSession() ? undefined : { role_scope: params?.role_scope ?? 'shared' },
    })
    return data.data ?? []
  },

  async getMerchantPartnerCatalog(): Promise<MerchantPartnerPermissionCatalogEntry[]> {
    const { data } = await adminApi.get<{ data: MerchantPartnerPermissionCatalogEntry[] }>(
      '/v1/organizer/permissions/catalog',
    )
    return data.data ?? []
  },
}
