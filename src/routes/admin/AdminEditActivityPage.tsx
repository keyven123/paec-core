import { useParams } from '@tanstack/react-router'

import { AdminEditActivitySection } from '@/components/admin/AdminEditActivitySection'

export function AdminEditActivityPage() {
  const { activityId } = useParams({ strict: false }) as { activityId: string }

  return (
    <div className="h-full min-h-0">
      <AdminEditActivitySection activityId={activityId} />
    </div>
  )
}
