import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'

import type { AdminUser } from '@/lib/adminAuth'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import {
  getStoredAdmin,
  isAdminAuthenticated,
  signOutAdmin,
} from '@/lib/adminAuth'
import {
  VENUE_INQUIRY_VIEWED_EVENT,
  venueListingService,
} from '@/services/venueListingService'

const NEW_INQUIRY_POLL_MS = 60_000

/** Venue inquiries nobody has opened yet; refreshed on navigation, when one is opened, and every minute. */
function useNewVenueInquiryCount(pathname: string): number {
  const [count, setCount] = useState(0)
  const forbidden = useRef(false)

  useEffect(() => {
    if (forbidden.current) return
    let cancelled = false

    const load = () => {
      venueListingService
        .stats()
        .then((stats) => {
          if (!cancelled) setCount(stats.new_inquiries)
        })
        .catch((err: unknown) => {
          if (isAxiosError(err) && err.response?.status === 403) {
            forbidden.current = true
          }
        })
    }

    load()
    const timer = window.setInterval(() => {
      if (!forbidden.current) load()
    }, NEW_INQUIRY_POLL_MS)
    window.addEventListener(VENUE_INQUIRY_VIEWED_EVENT, load)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener(VENUE_INQUIRY_VIEWED_EVENT, load)
    }
  }, [pathname])

  return count
}

export function AdminLayout() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [user] = useState<AdminUser | null>(() => getStoredAdmin())
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const newInquiryCount = useNewVenueInquiryCount(pathname)

  useEffect(() => {
    if (!isAdminAuthenticated()) {
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
        newInquiryCount={newInquiryCount}
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
            newInquiryCount={newInquiryCount}
            className="relative z-10 w-[min(18rem,88vw)] shadow-2xl"
          />
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader
          user={user}
          onMenuClick={() => setMobileSidebarOpen(true)}
          hasMenuAlert={newInquiryCount > 0}
        />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
