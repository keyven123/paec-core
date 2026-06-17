import { adminApi } from '@/lib/api'
import { isMerchantPartnerSession } from '@/lib/adminAuth'

export type PermissionGrant = {
  code: string
  available_access: string
}

export type Role = {
  uuid: string
  name: string
  code: string
  is_admin?: boolean
  organization_uuid?: string | null
  description?: string
  permission_grants?: PermissionGrant[]
  permissions?: Array<{
    uuid: string
    name: string
    code: string
    module?: string | null
  }>
}

export type CreateRoleData = {
  name: string
  code: string
  is_admin?: boolean
  description?: string
  permission_grants?: PermissionGrant[]
}

function rolesPath(suffix = '') {
  const base = isMerchantPartnerSession() ? '/v1/organizer/roles' : '/v1/roles'
  return suffix ? `${base}/${suffix}` : base
}

export const roleService = {
  async getRoles(params?: { is_admin?: number; q?: string }): Promise<Role[]> {
    const requestParams = isMerchantPartnerSession()
      ? { q: params?.q }
      : params

    const { data } = await adminApi.get<{ data: Role[] }>(rolesPath(), { params: requestParams })
    return data.data ?? []
  },

  async getRole(uuid: string): Promise<Role> {
    const { data } = await adminApi.get<{ data: Role }>(rolesPath(uuid))
    return data.data
  },

  async createRole(payload: CreateRoleData): Promise<Role> {
    const body = isMerchantPartnerSession()
      ? {
          name: payload.name,
          code: payload.code,
          permission_grants: payload.permission_grants,
        }
      : payload

    const { data } = await adminApi.post<{ data: Role }>(rolesPath(), body)
    return data.data
  },

  async assignPermissions(uuid: string, permissionGrants: PermissionGrant[]): Promise<Role> {
    const { data } = await adminApi.post<{ data: Role }>(rolesPath(`${uuid}/permissions`), {
      permission_grants: permissionGrants,
    })
    return data.data
  },

  async deleteRole(uuid: string): Promise<void> {
    await adminApi.delete(rolesPath(uuid))
  },
}
