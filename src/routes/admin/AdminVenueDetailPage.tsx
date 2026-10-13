import { useParams } from '@tanstack/react-router'

import { AdminVenueDetailSection } from '@/components/admin/event-management/AdminVenueDetailSection'

export function AdminVenueDetailPage() {
  const { venueId = '' } = useParams({ strict: false })

  return (
    <div className="h-full min-h-0">
      <AdminVenueDetailSection key={venueId} venueId={venueId} />
    </div>
  )
}
