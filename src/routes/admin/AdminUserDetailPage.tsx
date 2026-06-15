import { useParams } from '@tanstack/react-router'

import { AdminUserDetailSection } from '@/components/admin/AdminUserDetailSection'

export function AdminUserDetailPage() {
  const { userUuid } = useParams({ strict: false }) as { userUuid: string }

  return (
    <div className="h-full min-h-0">
      <AdminUserDetailSection userUuid={userUuid} />
    </div>
  )
}
