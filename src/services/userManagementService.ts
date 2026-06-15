import { adminApi } from '@/lib/api'

export type CustomerUser = {
  uuid: string
  email: string
  profile_image_uuid?: string
  first_name: string
  middle_name?: string
  last_name: string
  full_name: string
  phone_number?: string
  birth_date?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  region?: string
  postal_code?: string
  country?: string
  status: string
  marketing_consent?: boolean
  marketing_consent_date?: string | null
  terms_accepted_at?: string | null
  created_at: string
  updated_at: string
  image?: {
    uuid: string
    url: string
    path: string
  }
  role?: {
    uuid: string
    name: string
    code: string
  } | null
}

export type AdminUser = {
  uuid: string
  email: string
  first_name: string
  middle_name?: string
  last_name: string
  full_name: string
  phone_number?: string
  status: string
  created_at: string
  updated_at: string
  organization?: { uuid: string; name: string } | null
  role?: { uuid: string; name: string; code: string } | null
}

export type CreateAdminUserData = {
  role_uuid: string
  email: string
  first_name: string
  last_name: string
  organization_uuid?: string
  password?: string
}

type UserListResponse = {
  data: CustomerUser[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

type AdminUserListResponse = {
  data: AdminUser[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const userManagementService = {
  async getCustomer(uuid: string): Promise<CustomerUser> {
    const { data } = await adminApi.get<{ data: CustomerUser }>(`/v1/users/${uuid}`)
    return data.data
  },

  async getCustomers(params?: {
    q?: string
    page?: number
    per_page?: number
    status?: string
  }): Promise<UserListResponse> {
    const { data } = await adminApi.get<UserListResponse>('/v1/users', { params })
    return data
  },

  async exportCustomers(): Promise<void> {
    const response = await adminApi.get('/v1/users/export', {
      responseType: 'blob',
    })

    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async getAdminUsers(params?: {
    is_admin?: number
    q?: string
    page?: number
    per_page?: number
  }): Promise<AdminUserListResponse> {
    const { data } = await adminApi.get<AdminUserListResponse>('/v1/admin-users', { params })
    return data
  },

  async createAdminUser(payload: CreateAdminUserData): Promise<AdminUser> {
    const { data } = await adminApi.post<{ data: AdminUser }>('/v1/admin-users', payload)
    return data.data
  },
}
