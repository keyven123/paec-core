import { adminApi, ADMIN_TOKEN_KEY } from '@/lib/api'

type AdminLoginResponse = {
  access_token: string
  token_type: string
  is_admin?: boolean
  admin_user: {
    uuid: string
    email: string
    first_name: string
    last_name: string
    full_name: string
  }
  role: string
  permissions: string[]
}

export const adminAuthService = {
  async login(email: string, password: string) {
    const { data } = await adminApi.post<AdminLoginResponse>('/v1/admin/login', {
      email,
      password,
    })
    return data
  },

  async logout() {
    try {
      await adminApi.post('/v1/admin/logout')
    } finally {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
  },

  async me() {
    const { data } = await adminApi.get('/v1/admin/me')
    return data
  },
}
