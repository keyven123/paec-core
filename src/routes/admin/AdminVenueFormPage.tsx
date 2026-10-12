import { useParams } from '@tanstack/react-router'

import { AdminVenueFormSection } from '@/components/admin/event-management/AdminVenueFormSection'

export function AdminVenueFormPage() {
  const { venueId } = useParams({ strict: false })

  return <AdminVenueFormSection key={venueId ?? 'new'} venueId={venueId} />
}
