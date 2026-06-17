import { ADMIN_TOKEN_KEY, getApiErrorMessage } from '@/lib/api'
import { adminAuthService } from '@/services/adminAuthService'

export type AdminUser = {
  name: string
  email: string
  initials: string
  isMerchantPartner?: boolean
}

const STORAGE_KEY = 'paec_admin'

export function getStoredAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}

export function setStoredAdmin(user: AdminUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredAdmin() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminToken() && getStoredAdmin())
}

export function isMerchantPartnerSession(): boolean {
  return getStoredAdmin()?.isMerchantPartner === true
}

export async function signInAdmin(email: string, password: string): Promise<AdminUser> {
  try {
    const data = await adminAuthService.login(email, password)
    localStorage.setItem(ADMIN_TOKEN_KEY, data.access_token)

    const user: AdminUser = {
      name: data.admin_user.full_name,
      email: data.admin_user.email,
      initials: getInitials(data.admin_user.full_name),
      isMerchantPartner: data.is_admin === false,
    }

    setStoredAdmin(user)
    return user
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Admin sign in failed.'))
  }
}

export async function signOutAdmin() {
  try {
    await adminAuthService.logout()
  } catch {
    // Clear local session even if API logout fails
  } finally {
    clearStoredAdmin()
  }
}

function getInitials(value: string) {
  const parts = value.includes('@')
    ? value.split('@')[0].split(/[._-]/)
    : value.split(' ')

  return (
    parts
      .filter(Boolean)
      .slice(0, 1)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'A'
  )
}
