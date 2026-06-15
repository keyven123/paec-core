import { useParams } from '@tanstack/react-router'

import { AdminActivityTicketsSection } from '@/components/admin/AdminActivityTicketsSection'

export function AdminActivityTicketsPage() {
  const { activityId } = useParams({ strict: false }) as { activityId: string }

  return (
    <div className="h-full min-h-0">
      <AdminActivityTicketsSection activityId={activityId} />
    </div>
  )
}
