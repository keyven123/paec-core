import type {
  UploadedImage,
  VenueListing,
  VenueListingPayload,
  VenueListingStatus,
  VenuePackage,
  VenueSpec,
} from '@/services/venueListingService'
import {
  VENUE_SETUP_OPTIONS,
  VENUE_SPEC_FIELDS,
  VENUE_TYPE_OPTIONS,
} from '@/services/venueListingService'

export const VENUE_WIZARD_STEPS = [
  { title: 'Basics', description: 'Venue details' },
  { title: 'Images', description: 'Photos & gallery' },
  { title: 'Location', description: 'Address & capacity' },
  { title: 'Setups', description: 'Details & amenities' },
  { title: 'Packages', description: 'Day & time blocks' },
  { title: 'Summary', description: 'Review & publish' },
] as const

export const SUMMARY_STEP = VENUE_WIZARD_STEPS.length - 1
export const MAX_GALLERY_IMAGES = 12
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

/** Spec fields edited on the Setups step; floor area lives on the Location step. */
export const SETUP_SPEC_FIELDS = VENUE_SPEC_FIELDS.filter(
  (field) => field.key !== 'floor_area',
)
const FLOOR_AREA_LABEL = 'Floor area'
const PRESET_SPEC_LABELS = new Set<string>(VENUE_SPEC_FIELDS.map((field) => field.label))

export type PackageForm = {
  id: string
  label: string
  priceFrom: string
  note: string
  start_time: string
  end_time: string
}

export type CustomSpecForm = {
  id: string
  label: string
  value: string
}

export type VenueForm = {
  organization_uuid: string
  name: string
  slug: string
  slugTouched: boolean
  venue_type: string
  description: string
  cover: UploadedImage | null
  gallery: Array<UploadedImage>
  address: string
  city: string
  region: string
  area: string
  capacity_min: string
  capacity_max: string
  min_capacity_note: string
  max_capacity_note: string
  price_per_event: string
  setupIds: Array<string>
  setupCapacities: Record<string, string>
  specValues: Record<string, string>
  customSpecs: Array<CustomSpecForm>
  best_for: Array<string>
  amenities: Array<string>
  packages: Array<PackageForm>
  default_package_id: string
  status: VenueListingStatus
  is_featured: boolean
}

export type VenueFormErrors = Partial<Record<string, string>>

export const DEFAULT_PACKAGES: Array<PackageForm> = [
  {
    id: 'half-day-morning',
    label: 'Half day (Morning)',
    priceFrom: '',
    note: '',
    start_time: '06:00',
    end_time: '15:00',
  },
  {
    id: 'half-day-afternoon',
    label: 'Half day (Afternoon)',
    priceFrom: '',
    note: '',
    start_time: '17:00',
    end_time: '01:00',
  },
  {
    id: 'full-day',
    label: 'Full-day (8 hrs)',
    priceFrom: '',
    note: '',
    start_time: '07:00',
    end_time: '21:00',
  },
]

export const EMPTY_VENUE_FORM: VenueForm = {
  organization_uuid: '',
  name: '',
  slug: '',
  slugTouched: false,
  venue_type: VENUE_TYPE_OPTIONS[0],
  description: '',
  cover: null,
  gallery: [],
  address: '',
  city: '',
  region: '',
  area: '',
  capacity_min: '',
  capacity_max: '',
  min_capacity_note: 'guests · intimate setups & meetings',
  max_capacity_note: 'guests · full banquet / standing',
  price_per_event: '',
  setupIds: [],
  setupCapacities: {},
  specValues: {},
  customSpecs: [],
  best_for: [],
  amenities: [],
  packages: DEFAULT_PACKAGES,
  default_package_id: 'full-day',
  status: 'draft',
  is_featured: false,
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function crossesMidnight(start: string, end: string) {
  return toMinutes(end) <= toMinutes(start)
}

export function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function toNumberOrNull(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function resolveCategory(venueType: string) {
  const type = venueType.toLowerCase()
  if (type.includes('conference')) return 'conference'
  if (type.includes('ballroom')) return 'ballrooms'
  if (/outdoor|garden|rooftop/.test(type)) return 'outdoor'
  if (/loft|studio/.test(type)) return 'loft'
  return 'function-halls'
}

export function formFromListing(listing: VenueListing): VenueForm {
  const specs = listing.specs ?? []
  const specValues: Record<string, string> = {}
  for (const field of SETUP_SPEC_FIELDS) {
    const match = specs.find((spec) => spec.label === field.label)
    if (match?.value) specValues[field.key] = match.value
  }
  const floorArea = specs.find((spec) => spec.label === FLOOR_AREA_LABEL)?.value

  const setups = listing.setups ?? []

  return {
    organization_uuid: listing.organization_uuid ?? '',
    name: listing.name,
    slug: listing.slug,
    slugTouched: true,
    venue_type: listing.venue_type,
    description: listing.description ?? '',
    cover:
      listing.featured_upload_uuid && listing.featured_image_url
        ? { uuid: listing.featured_upload_uuid, url: listing.featured_image_url }
        : null,
    gallery: listing.gallery_upload_uuids
      .map((uuid, index) => ({ uuid, url: listing.gallery_image_urls[index] ?? '' }))
      .filter((image) => image.url),
    address: listing.address ?? '',
    city: listing.city,
    region: listing.region ?? '',
    area: listing.area ?? floorArea ?? '',
    capacity_min: listing.capacity_min ? String(listing.capacity_min) : '',
    capacity_max: listing.capacity_max ? String(listing.capacity_max) : '',
    min_capacity_note: listing.min_capacity_note ?? '',
    max_capacity_note: listing.max_capacity_note ?? '',
    price_per_event: listing.price_per_event ? String(listing.price_per_event) : '',
    setupIds: setups.map((setup) => setup.id),
    setupCapacities: Object.fromEntries(
      setups.map((setup) => [setup.id, String(setup.capacity)]),
    ),
    specValues,
    customSpecs: specs
      .filter((spec) => !PRESET_SPEC_LABELS.has(spec.label) && spec.value.trim())
      .map((spec, index) => ({ id: `custom-${index}`, label: spec.label, value: spec.value })),
    best_for: listing.best_for ?? [],
    amenities: listing.amenities ?? [],
    packages: listing.packages.length
      ? listing.packages.map((pkg) => ({
          id: pkg.id,
          label: pkg.label,
          priceFrom: pkg.priceFrom ? String(pkg.priceFrom) : '',
          note: pkg.note ?? '',
          start_time: pkg.start_time.slice(0, 5),
          end_time: pkg.end_time.slice(0, 5),
        }))
      : DEFAULT_PACKAGES,
    default_package_id: listing.default_package_id ?? 'full-day',
    status: listing.status,
    is_featured: listing.is_featured,
  }
}

export function validateStep(step: number, form: VenueForm): VenueFormErrors {
  const errors: VenueFormErrors = {}

  if (step === 0) {
    if (!form.name.trim()) errors.name = 'Venue name is required.'
    if (!form.slug.trim()) {
      errors.slug = 'URL slug is required.'
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      errors.slug = 'Use lowercase letters, numbers and hyphens only.'
    }
    if (!form.venue_type.trim()) errors.venue_type = 'Venue type is required.'
  }

  if (step === 2) {
    if (!form.city.trim()) errors.city = 'City is required.'
    const min = toNumberOrNull(form.capacity_min)
    const max = toNumberOrNull(form.capacity_max)
    if (min !== null && min < 1) errors.capacity_min = 'Must be at least 1.'
    if (max !== null && max < 1) errors.capacity_max = 'Must be at least 1.'
    if (min !== null && max !== null && max < min) {
      errors.capacity_max = 'Must be greater than or equal to the minimum.'
    }
    const price = toNumberOrNull(form.price_per_event)
    if (form.price_per_event.trim() && (price === null || price < 0)) {
      errors.price_per_event = 'Enter a valid amount.'
    }
  }

  if (step === 3) {
    const invalidSetup = form.setupIds.some((id) => {
      const capacity = toNumberOrNull(form.setupCapacities[id] ?? '')
      return capacity === null || capacity < 1
    })
    if (invalidSetup) errors.setups = 'Each selected setup needs a capacity of at least 1.'
    if (form.customSpecs.some((spec) => Boolean(spec.label.trim()) !== Boolean(spec.value.trim()))) {
      errors.specs = 'Custom specs need both a label and a value.'
    }
  }

  if (step === 4) {
    if (form.packages.length === 0) {
      errors.packages = 'Add at least one package.'
    } else if (form.packages.some((pkg) => !pkg.label.trim())) {
      errors.packages = 'Every package needs a name.'
    } else if (form.packages.some((pkg) => !pkg.start_time || !pkg.end_time)) {
      errors.packages = 'Every package needs a start and end time.'
    }
  }

  return errors
}

const ERROR_FIELDS: Partial<Record<string, Array<keyof VenueForm>>> = {
  setups: ['setupIds', 'setupCapacities'],
  specs: ['specValues', 'customSpecs', 'area'],
  packages: ['packages', 'default_package_id'],
  featured_upload_uuid: ['cover'],
  gallery_upload_uuids: ['gallery'],
}

/** Error keys whose form fields differ between the two versions of the form. */
export function changedErrorKeys(
  errors: VenueFormErrors,
  previous: VenueForm,
  next: VenueForm,
): Array<string> {
  return Object.keys(errors).filter((key) =>
    (ERROR_FIELDS[key] ?? [key as keyof VenueForm]).some(
      (field) => field in next && next[field] !== previous[field],
    ),
  )
}

/** Maps an API validation field to the wizard step that edits it. */
export function stepForField(field: string): number {
  if (['name', 'slug', 'venue_type', 'description'].includes(field)) return 0
  if (field.startsWith('featured_upload') || field.startsWith('gallery')) return 1
  if (/^(address|city|region|area|capacity|min_capacity|max_capacity|price_per_event)/.test(field)) {
    return 2
  }
  if (/^(setups|specs|best_for|amenities)/.test(field)) return 3
  if (field.startsWith('packages') || field === 'default_package_id') return 4
  return SUMMARY_STEP
}

/** Packages left without a price use the venue's starting price. */
export function packagePrice(pkg: PackageForm, form: VenueForm): number {
  return toNumberOrNull(pkg.priceFrom) ?? toNumberOrNull(form.price_per_event) ?? 0
}

export function buildPayload(form: VenueForm): VenueListingPayload {
  const min = toNumberOrNull(form.capacity_min)
  const max = toNumberOrNull(form.capacity_max)

  const packages: Array<VenuePackage> = form.packages.map((pkg) => ({
    id: pkg.id,
    label: pkg.label.trim(),
    priceFrom: packagePrice(pkg, form),
    note: pkg.note.trim() || null,
    start_time: pkg.start_time,
    end_time: pkg.end_time,
    crosses_midnight: crossesMidnight(pkg.start_time, pkg.end_time),
  }))
  const defaultPackageId = packages.some((pkg) => pkg.id === form.default_package_id)
    ? form.default_package_id
    : packages[0].id

  const specs: Array<VenueSpec> = [
    ...(form.area.trim() ? [{ label: FLOOR_AREA_LABEL, value: form.area.trim() }] : []),
    ...SETUP_SPEC_FIELDS.map((field) => ({
      label: field.label,
      value: field.key in form.specValues ? form.specValues[field.key].trim() : '',
    })).filter((spec) => spec.value),
    ...form.customSpecs
      .filter((spec) => spec.label.trim() && spec.value.trim())
      .map((spec) => ({ label: spec.label.trim(), value: spec.value.trim() })),
  ]

  return {
    organization_uuid: form.organization_uuid || null,
    name: form.name.trim(),
    slug: form.slug.trim(),
    venue_type: form.venue_type.trim(),
    category: resolveCategory(form.venue_type),
    description: form.description.trim() || null,
    address: form.address.trim() || null,
    location: form.city.trim(),
    city: form.city.trim(),
    region: form.region.trim() || null,
    area: form.area.trim() || null,
    capacity_min: min,
    capacity_max: max,
    capacity_label: min && max ? `${min}–${max} pax` : null,
    min_capacity_note: form.min_capacity_note.trim() || null,
    max_capacity_note: form.max_capacity_note.trim() || null,
    price_per_event: toNumberOrNull(form.price_per_event),
    setups: VENUE_SETUP_OPTIONS.filter((option) => form.setupIds.includes(option.id)).map(
      (option) => ({
        id: option.id,
        label: option.label,
        capacity: toNumberOrNull(form.setupCapacities[option.id] ?? '') ?? option.capacity,
      }),
    ),
    specs,
    best_for: form.best_for,
    amenities: form.amenities,
    packages,
    default_package_id: defaultPackageId,
    featured_upload_uuid: form.cover?.uuid ?? null,
    gallery_upload_uuids: form.gallery.map((image) => image.uuid),
    status: form.status,
    is_featured: form.is_featured,
  }
}
