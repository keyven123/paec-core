import { adminApi, api } from '@/lib/api'

export type VenueListingStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'published'
  | 'inactive'

export const VENUE_STATUS_OPTIONS: Array<{
  value: VenueListingStatus
  label: string
}> = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'inactive', label: 'Inactive' },
]

export const VENUE_TYPE_OPTIONS = [
  'Function hall',
  'Ballroom',
  'Conference',
  'Outdoor / garden',
  'Loft / studio',
] as const

export const VENUE_BEST_FOR_OPTIONS = [
  'Corporate events',
  'Product launches',
  'Gala dinners',
  'Weddings',
  'Conferences',
  'Concerts / shows',
  'Seminars',
  'Birthdays',
  'Meetings',
  'Celebrations',
] as const

export const VENUE_SETUP_OPTIONS: Array<VenueSetup> = [
  { id: 'theater', label: 'Theater', capacity: 500 },
  { id: 'banquet', label: 'Banquet', capacity: 400 },
  { id: 'classroom', label: 'Classroom', capacity: 280 },
  { id: 'ballroom', label: 'Ballroom', capacity: 450 },
  { id: 'cocktail', label: 'Cocktail', capacity: 500 },
  { id: 'ushape', label: 'U-shape', capacity: 80 },
  { id: 'boardroom', label: 'Boardroom', capacity: 40 },
  { id: 'banquet-stage', label: 'Banquet + stage', capacity: 350 },
]

export const VENUE_SPEC_FIELDS = [
  { key: 'floor_area', label: 'Floor area', placeholder: '800 sqm' },
  { key: 'ceiling_height', label: 'Ceiling height', placeholder: '6.5 m' },
  {
    key: 'parking_slots',
    label: 'Parking slots',
    placeholder: '120 (basement + valet)',
  },
  {
    key: 'power_supply',
    label: 'Power supply',
    placeholder: '200 kVA · 3-phase',
  },
  {
    key: 'load_in_access',
    label: 'Load-in access',
    placeholder: '2 freight elevators · ramp',
  },
  {
    key: 'curfew',
    label: 'Curfew',
    placeholder: '2:00 AM (extensions available)',
  },
] as const

export const VENUE_AMENITY_OPTIONS = [
  'High-speed WiFi',
  'Central air-conditioning',
  'CCTV security',
  'Restrooms',
  'LED projector + screen',
  'In-house catering',
  'Stage lighting rig',
  'Holding / VIP room',
  'PA / sound system',
  'PWD accessible',
  'Tables & chairs',
  'Backup generator',
  'Parking',
] as const

export type VenuePackage = {
  id: string
  label: string
  priceFrom: number
  note?: string | null
  start_time: string
  end_time: string
  crosses_midnight?: boolean
  time_label?: string
}

export type VenueSetup = {
  id: string
  label: string
  capacity: number
}

export type VenueSpec = {
  label: string
  value: string
}

export type VenueListing = {
  uuid: string
  slug: string
  name: string
  description: string | null
  address: string | null
  location: string | null
  city: string
  region: string | null
  area: string | null
  capacity_label: string | null
  capacity_min: number | null
  capacity_max: number | null
  min_capacity_note: string | null
  max_capacity_note: string | null
  setups: Array<VenueSetup> | null
  specs: Array<VenueSpec> | null
  venue_type: string
  category: string | null
  price_per_event: number
  currency: string | null
  status: VenueListingStatus
  is_featured: boolean
  inquiries_count: number
  /** Inquiries still in "new" status; only present on the admin listing. */
  new_inquiries_count?: number
  bookings_count: number
  featured_image_url: string | null
  featured_upload_uuid: string | null
  gallery_image_urls: Array<string>
  gallery_upload_uuids: Array<string>
  packages: Array<VenuePackage>
  default_package_id: string | null
  best_for: Array<string> | null
  amenities: Array<string> | null
  organization_uuid: string | null
  organization_name?: string | null
  created_at: string | null
  updated_at: string | null
}

export type VenueListingDetail = VenueListing & {
  inquiry_status_counts: Record<string, number>
  stats: {
    inquiries_count: number
    bookings_count: number
    rating: number
    review_count: number
  }
}

/** Fired after an inquiry is opened so new-inquiry badges can refresh. */
export const VENUE_INQUIRY_VIEWED_EVENT = 'paec:venue-inquiry-viewed'

export type VenueListingStats = {
  total: number
  published: number
  pending: number
  total_inquiries: number
  new_inquiries: number
}

export type VenueInquiry = {
  uuid: string
  full_name: string | null
  email: string | null
  phone: string | null
  event_type: string | null
  event_date: string | null
  guest_count: number | null
  status: string
  status_label: string
  /** When the venue team first opened it; null means it is still new. */
  viewed_at?: string | null
  message: string | null
  site_visit_label?: string | null
  visit_scheduled_label?: string | null
  proposal_amount?: number | null
  deposit_amount?: number | null
  balance_amount?: number | null
  created_at: string | null
}

export type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type VenueListingPayload = {
  organization_uuid?: string | null
  name: string
  slug?: string
  venue_type: string
  category?: string
  description?: string | null
  address?: string | null
  location?: string | null
  city: string
  region?: string | null
  area?: string | null
  capacity_min?: number | null
  capacity_max?: number | null
  capacity_label?: string | null
  min_capacity_note?: string | null
  max_capacity_note?: string | null
  setups?: Array<VenueSetup>
  specs?: Array<VenueSpec>
  price_per_event?: number | null
  status: VenueListingStatus
  is_featured?: boolean
  best_for?: Array<string>
  amenities?: Array<string>
  packages?: Array<VenuePackage>
  default_package_id?: string | null
  featured_upload_uuid?: string | null
  gallery_upload_uuids?: Array<string>
}

export type UploadedImage = {
  uuid: string
  url: string
}

export const venueListingService = {
  async list(params: {
    page?: number
    per_page?: number
    search?: string
    status?: VenueListingStatus
  }): Promise<{ data: Array<VenueListing>; meta: PaginationMeta }> {
    const { data } = await adminApi.get<{
      data: Array<VenueListing>
      meta: PaginationMeta
    }>('/v1/venue-listings', { params })
    return data
  },

  async stats(): Promise<VenueListingStats> {
    const { data } = await adminApi.get<{ data: VenueListingStats }>(
      '/v1/venue-listings/stats',
    )
    return data.data
  },

  async get(uuid: string): Promise<VenueListingDetail> {
    const { data } = await adminApi.get<{ data: VenueListingDetail }>(
      `/v1/venue-listings/${uuid}`,
    )
    return data.data
  },

  async create(payload: VenueListingPayload): Promise<VenueListing> {
    const { data } = await adminApi.post<{ data: VenueListing }>(
      '/v1/venue-listings',
      payload,
    )
    return data.data
  },

  async update(
    uuid: string,
    payload: Partial<VenueListingPayload>,
  ): Promise<VenueListing> {
    const { data } = await adminApi.put<{ data: VenueListing }>(
      `/v1/venue-listings/${uuid}`,
      payload,
    )
    return data.data
  },

  async remove(uuid: string): Promise<void> {
    await adminApi.delete(`/v1/venue-listings/${uuid}`)
  },

  async listInquiries(
    uuid: string,
    params: { page?: number; per_page?: number; status?: string; q?: string },
  ): Promise<{
    data: Array<VenueInquiry>
    meta: PaginationMeta
    status_counts: Partial<Record<string, number>>
  }> {
    const { data } = await adminApi.get<{
      data: Array<VenueInquiry>
      meta: PaginationMeta
      status_counts: Partial<Record<string, number>>
    }>(`/v1/venue-listings/${uuid}/inquiries`, { params })
    return data
  },

  async markInquiryViewed(inquiryUuid: string): Promise<VenueInquiry> {
    const { data } = await adminApi.post<{ data: VenueInquiry }>(
      `/v1/venue-listings/inquiries/${inquiryUuid}/viewed`,
    )
    window.dispatchEvent(new Event(VENUE_INQUIRY_VIEWED_EVENT))
    return data.data
  },

  async listPublic(limit = 8): Promise<Array<PublicVenueListing>> {
    const { data } = await api.get<{ data: Array<PublicVenueListing> }>(
      '/v1/public/venue-listings',
      { params: { per_page: limit } },
    )
    return data.data
  },

  async getPublic(slug: string): Promise<PublicVenueDetail> {
    const { data } = await api.get<{ data: PublicVenueDetail }>(
      `/v1/public/venue-listings/${encodeURIComponent(slug)}`,
    )
    return data.data
  },

  async listPublicUnavailableDates(
    slug: string,
  ): Promise<Array<UnavailableVenueDate>> {
    const { data } = await api.get<{ data: Array<UnavailableVenueDate> }>(
      `/v1/public/venue-listings/${encodeURIComponent(slug)}/blocked-dates`,
    )
    return data.data
  },

  async submitInquiry(
    slug: string,
    payload: VenueInquiryPayload,
  ): Promise<void> {
    await api.post(
      `/v1/public/venue-listings/${encodeURIComponent(slug)}/inquiries`,
      payload,
    )
  },

  async uploadImage(file: File): Promise<UploadedImage> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'image')
    const { data } = await adminApi.post<{ data: UploadedImage }>(
      '/v1/uploads',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },
}

export type PublicVenueListing = {
  uuid: string
  slug: string
  name: string
  location: string | null
  city: string | null
  capacity: string | null
  area: string | null
  type: string | null
  category: string | null
  price_per_event: number
  currency: string
  badge: string | null
  featured_image_url: string | null
  gallery_image_urls: Array<string> | null
}

export type PublicVenueDetail = {
  listing: PublicVenueListing
  slug: string
  address: string | null
  region: string | null
  verified: boolean
  responds_in: string | null
  about: string | null
  featured_image_url: string | null
  gallery_image_urls: Array<string>
  packages: Array<VenuePackage>
  default_package_id: string | null
  min_capacity: number | null
  min_capacity_note: string | null
  max_capacity: number | null
  max_capacity_note: string | null
  setups: Array<VenueSetup>
  specs: Array<VenueSpec>
  best_for: Array<string>
  amenities: Array<string>
}

export type VenueInquiryPayload = {
  full_name: string
  email: string
  phone: string
  guest_count: number
  event_date: string
}

export type UnavailableVenueDate = {
  uuid: string | null
  blocked_date: string
  reason: string
}

export function formatPeso(amount: number | null | undefined): string {
  return `₱${(amount ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatCapacity(
  listing: Pick<
    VenueListing,
    'capacity_label' | 'capacity_min' | 'capacity_max'
  >,
): string {
  if (listing.capacity_min && listing.capacity_max) {
    return `${listing.capacity_min}–${listing.capacity_max} pax`
  }
  return listing.capacity_label ?? '—'
}
