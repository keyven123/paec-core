import axios from 'axios'

import { isTokenValid } from '@/lib/tokenUtils'

/**
 * Resolve API base URL for local (relative / Vite proxy) and Vercel → Hostinger.
 * Services call `/v1/...`, so the base must end at `/api`. If the env is only the
 * Hostinger origin (or mistakenly includes /api/v1), normalize it to `<origin>/api`.
 */
function resolveApiBaseUrl(raw: string | undefined): string {
  const value = (raw || '/api').trim().replace(/\/+$/, '')

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    const path = value.startsWith('/') ? value : `/${value}`
    return path.replace(/\/v\d+$/, '') || '/api'
  }

  try {
    const url = new URL(value)
    const path = url.pathname.replace(/\/+$/, '').replace(/\/v\d+$/, '')

    url.pathname = path.endsWith('/api') ? path : `${path}/api`
    url.search = ''
    url.hash = ''
    return `${url.origin}${url.pathname}`
  } catch {
    return '/api'
  }
}

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL as string | undefined,
)

export const CUSTOMER_TOKEN_KEY = 'paec_token'
export const CUSTOMER_USER_KEY = 'paec_user'
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

function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY)
  localStorage.removeItem(CUSTOMER_USER_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('paec:auth-change'))
  }
}

function isCustomerAuthEndpoint(url?: string): boolean {
  if (!url) return false
  return ['/login', '/register', '/refresh', '/verify-email', '/resend-verification'].some(
    (part) => url.includes(part),
  )
}

let customerRefreshPromise: Promise<string | null> | null = null

/**
 * Exchange the (possibly expired) access token for a new one. The backend
 * accepts this within the JWT refresh window (14 days by default), so users
 * stay signed in instead of hitting "Authentication required" after the
 * 60-minute access token expires.
 */
function refreshCustomerToken(): Promise<string | null> {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  if (!token) return Promise.resolve(null)

  if (!customerRefreshPromise) {
    customerRefreshPromise = (async () => {
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/v1/refresh`,
          null,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        )
        const newToken = (data as { access_token?: string })?.access_token
        if (newToken) {
          localStorage.setItem(CUSTOMER_TOKEN_KEY, newToken)
          return newToken
        }
      } catch {
        // Refresh window expired too — the caller clears the session.
      }
      return null
    })().finally(() => {
      customerRefreshPromise = null
    })
  }

  return customerRefreshPromise
}

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  if (token) {
    let activeToken = token

    // Refresh proactively so expired tokens never reach the API.
    if (!isTokenValid(token) && !isCustomerAuthEndpoint(config.url)) {
      const refreshed = await refreshCustomerToken()
      if (refreshed) activeToken = refreshed
    }

    config.headers.Authorization = `Bearer ${activeToken}`
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
  async (error) => {
    const status = error?.response?.status
    const config = error?.config as
      | (typeof error.config & { _retriedAfterRefresh?: boolean })
      | undefined

    // One silent refresh + retry if the API still rejects the token
    // (e.g. server clock differences). If refresh fails, the session is
    // really over — clear it so the UI shows Sign In again.
    if (
      status === 401 &&
      config &&
      !config._retriedAfterRefresh &&
      !isCustomerAuthEndpoint(config.url) &&
      localStorage.getItem(CUSTOMER_TOKEN_KEY)
    ) {
      const refreshed = await refreshCustomerToken()
      if (refreshed) {
        config._retriedAfterRefresh = true
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${refreshed}`
        return api.request(config)
      }
      clearCustomerSession()
    }

    return Promise.reject(error)
  },
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
