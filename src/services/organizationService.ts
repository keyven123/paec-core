import { adminApi } from '@/lib/api'

export type OrganizationOption = {
  uuid: string
  name: string
}

export const organizationService = {
  async listOptions(perPage = 100): Promise<OrganizationOption[]> {
    const { data } = await adminApi.get<{
      data: OrganizationOption[]
    }>('/v1/organizations', { params: { per_page: perPage } })
    return data.data ?? []
  },
}
