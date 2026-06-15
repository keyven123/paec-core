import { Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import {
  getStoredAdmin,
  getAdminToken,
  isAdminAuthenticated,
  signOutAdmin,
  type AdminUser,
} from '@/lib/adminAuth'
import { isTokenValid } from '@/lib/tokenUtils'

export function AdminLayout() {
  const navigate = useNavigate()
  const [user] = useState<AdminUser | null>(() => getStoredAdmin())

  useEffect(() => {
    const token = getAdminToken()
    if (!isAdminAuthenticated() || !isTokenValid(token)) {
      void signOutAdmin()
      navigate({ to: '/admin/login' })
    }
  }, [navigate])

  const handleSignOut = async () => {
    await signOutAdmin()
    navigate({ to: '/admin/login' })
  }

  if (!user) return null

  return (
    <div className="flex h-dvh overflow-hidden bg-violet-50/30 lg:flex-row">
      <AdminSidebar user={user} onSignOut={handleSignOut} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader user={user} />
        <main className="min-h-0 flex-1 overflow-hidden p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
