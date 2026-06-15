import { useParams } from '@tanstack/react-router'

import { AdminUserStatsSection } from '@/components/admin/AdminUserStatsSection'

export function AdminUserStatsPage() {
  const { userUuid } = useParams({ strict: false }) as { userUuid: string }

  return (
    <div className="h-full min-h-0">
      <AdminUserStatsSection userUuid={userUuid} />
    </div>
  )
}
