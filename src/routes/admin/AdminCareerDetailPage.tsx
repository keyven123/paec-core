import { useParams } from '@tanstack/react-router'

import { AdminCareerDetailSection } from '@/components/admin/AdminCareerDetailSection'

export function AdminCareerDetailPage() {
  const { positionId } = useParams({ strict: false }) as { positionId: string }

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AdminCareerDetailSection positionId={positionId} />
    </div>
  )
}
