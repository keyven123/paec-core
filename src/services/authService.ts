import api, { CUSTOMER_TOKEN_KEY } from '@/lib/api'

type LoginResponse = {
  access_token: string
  token_type: string
  user: {
    uuid: string
    first_name: string
    last_name: string
    email: string
    email_verified_at?: string | null
  }
  role: string
  expires_in: string
}

export type RegisterPayload = {
  first_name: string
  last_name: string
  address: string
  phone_number: string
  email: string
  password: string
  password_confirmation: string
  terms_accepted: boolean
}

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post<LoginResponse>('/v1/login', { email, password })
    return data
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post<LoginResponse & { success: boolean; message: string }>(
      '/v1/register',
      payload,
    )
    return data
  },

  async logout() {
    try {
      await api.post('/v1/logout')
    } finally {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY)
    }
  },

  async me() {
    const { data } = await api.get('/v1/me')
    return data
  },
}
