import { useEffect, useState } from 'react'

import type { User } from '@/data/mockUser'
import {
  AUTH_CHANGE_EVENT,
  getStoredUser,
  isCustomerAuthenticated,
} from '@/lib/auth'

function readSignedInUser(): User | null {
  return isCustomerAuthenticated() ? getStoredUser() : null
}

/** The signed-in customer, kept in sync with sign-in and sign-out anywhere on the site (and in other tabs). */
export function useStoredUser(): User | null {
  const [user, setUser] = useState<User | null>(readSignedInUser)

  useEffect(() => {
    const sync = () => setUser(readSignedInUser())
    window.addEventListener(AUTH_CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return user
}
