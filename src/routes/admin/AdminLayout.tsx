import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
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
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [user] = useState<AdminUser | null>(() => getStoredAdmin())
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const token = getAdminToken()
    if (!isAdminAuthenticated() || !isTokenValid(token)) {
      void signOutAdmin()
      navigate({ to: '/admin/login' })
    }
  }, [navigate])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileSidebarOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileSidebarOpen])

  const handleSignOut = async () => {
    await signOutAdmin()
    navigate({ to: '/admin/login' })
  }

  const closeMobileSidebar = () => setMobileSidebarOpen(false)

  if (!user) return null

  return (
    <div className="flex h-dvh overflow-hidden bg-violet-50/30">
      <AdminSidebar
        user={user}
        onSignOut={handleSignOut}
        className="hidden lg:flex"
      />

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={closeMobileSidebar}
            aria-label="Close menu"
          />
          <AdminSidebar
            user={user}
            onSignOut={handleSignOut}
            onNavigate={closeMobileSidebar}
            onClose={closeMobileSidebar}
            className="relative z-10 w-[min(18rem,88vw)] shadow-2xl"
          />
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader
          user={user}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
