import { useParams } from '@tanstack/react-router'

import { AdminActivityScannerSection } from '@/components/admin/AdminActivityScannerSection'

export function AdminActivityScannerPage() {
  const { activityId } = useParams({ strict: false }) as { activityId: string }

  return (
    <div className="h-full min-h-0">
      <AdminActivityScannerSection activityId={activityId} />
    </div>
  )
}
