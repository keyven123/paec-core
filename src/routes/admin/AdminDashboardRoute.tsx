import { useState } from 'react'

import { AdminDashboardHome } from '@/components/admin/AdminDashboardHome'
import { getStoredAdmin, type AdminUser } from '@/lib/adminAuth'

export function AdminDashboardRoute() {
  const [user] = useState<AdminUser | null>(() => getStoredAdmin())

  if (!user) return null

  return <AdminDashboardHome user={user} />
}
