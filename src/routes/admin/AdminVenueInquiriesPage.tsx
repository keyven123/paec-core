import { useParams } from '@tanstack/react-router'

import { AdminVenueInquiriesSection } from '@/components/admin/event-management/AdminVenueInquiriesSection'

export function AdminVenueInquiriesPage() {
  const { venueId = '' } = useParams({ strict: false })

  return (
    <div className="h-full min-h-0">
      <AdminVenueInquiriesSection key={venueId} venueId={venueId} />
    </div>
  )
}
