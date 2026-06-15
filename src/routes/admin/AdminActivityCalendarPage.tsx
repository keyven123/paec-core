import { useParams } from '@tanstack/react-router'

import { AdminActivityCalendarSection } from '@/components/admin/AdminActivityCalendarSection'

export function AdminActivityCalendarPage() {
  const { activityId } = useParams({ strict: false }) as { activityId: string }

  return (
    <div className="h-full min-h-0">
      <AdminActivityCalendarSection activityId={activityId} />
    </div>
  )
}
