import { mockUser, type User } from '@/data/mockUser'
import { CUSTOMER_TOKEN_KEY, getApiErrorMessage } from '@/lib/api'
import { authService } from '@/services/authService'

const STORAGE_KEY = 'paec_user'

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(CUSTOMER_TOKEN_KEY)
}

export function getCustomerToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY)
}

export function isCustomerAuthenticated(): boolean {
  return Boolean(getCustomerToken() && getStoredUser())
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const data = await authService.login(email, password)
    localStorage.setItem(CUSTOMER_TOKEN_KEY, data.access_token)

    const user: User = {
      id: data.user.uuid,
      name: `${data.user.first_name} ${data.user.last_name}`.trim(),
      email: data.user.email,
      initials: getInitials(`${data.user.first_name} ${data.user.last_name}`),
      badge: 'Member',
      levelProgress: mockUser.levelProgress,
    }

    setStoredUser(user)
    return user
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Sign in failed.'))
  }
}

export async function signOut() {
  try {
    await authService.logout()
  } catch {
    // Clear local session even if API logout fails
  } finally {
    clearStoredUser()
  }
}

function getInitials(value: string) {
  const parts = value.includes('@')
    ? value.split('@')[0].split(/[._-]/)
    : value.split(' ')

  return (
    parts
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'PA'
  )
}
