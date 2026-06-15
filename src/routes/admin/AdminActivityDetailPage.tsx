import { useParams } from '@tanstack/react-router'

import { AdminActivityDetailSection } from '@/components/admin/AdminActivityDetailSection'

export function AdminActivityDetailPage() {
  const { activityId } = useParams({ strict: false }) as { activityId: string }

  return (
    <div className="h-full min-h-0">
      <AdminActivityDetailSection activityId={activityId} />
    </div>
  )
}
