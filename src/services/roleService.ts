import { adminApi } from '@/lib/api'

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

export const roleService = {
  async getRoles(params?: { is_admin?: number; q?: string }): Promise<Role[]> {
    const { data } = await adminApi.get<{ data: Role[] }>('/v1/roles', { params })
    return data.data ?? []
  },

  async getRole(uuid: string): Promise<Role> {
    const { data } = await adminApi.get<{ data: Role }>(`/v1/roles/${uuid}`)
    return data.data
  },

  async createRole(payload: CreateRoleData): Promise<Role> {
    const { data } = await adminApi.post<{ data: Role }>('/v1/roles', payload)
    return data.data
  },

  async assignPermissions(uuid: string, permissionGrants: PermissionGrant[]): Promise<Role> {
    const { data } = await adminApi.post<{ data: Role }>(`/v1/roles/${uuid}/permissions`, {
      permission_grants: permissionGrants,
    })
    return data.data
  },

  async deleteRole(uuid: string): Promise<void> {
    await adminApi.delete(`/v1/roles/${uuid}`)
  },
}
