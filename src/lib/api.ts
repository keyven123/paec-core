import axios from 'axios'

import { isTokenValid } from '@/lib/tokenUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const CUSTOMER_TOKEN_KEY = 'paec_token'
export const ADMIN_TOKEN_KEY = 'paec_admin_token'
const ADMIN_PROFILE_KEY = 'paec_admin'

function redirectToAdminLogin() {
  if (typeof window === 'undefined') return
  if (window.location.pathname.startsWith('/admin/login')) return
  window.location.href = '/admin/login'
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_PROFILE_KEY)
}

function getAdminTokenFromStorage(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

adminApi.interceptors.request.use((config) => {
  const token = getAdminTokenFromStorage()

  if (token) {
    if (!isTokenValid(token)) {
      clearAdminSession()
      redirectToAdminLogin()
      return Promise.reject(new Error('Admin session expired'))
    }

    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401 || message === 'Unauthenticated.') {
      clearAdminSession()
      redirectToAdminLogin()
    }

    return Promise.reject(error)
  },
)

export function getApiValidationErrors(
  error: unknown,
): Record<string, string | string[]> {
  if (!axios.isAxiosError(error)) return {}
  const data = error.response?.data as
    | { errors?: Record<string, string | string[]> }
    | undefined
  return data?.errors ?? {}
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback
  }

  const data = error.response?.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined

  if (data?.errors) {
    const firstField = Object.values(data.errors).flat()[0]
    if (firstField) return firstField
  }

  if (typeof data?.message === 'string' && data.message) {
    return data.message
  }

  if (error.response?.status === 401) {
    return 'Invalid email or password.'
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Make sure the API is running.'
  }

  return fallback
}

export default api
