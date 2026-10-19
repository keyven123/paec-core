import type { AdminEvent } from '@/services/adminEventService'
import type { EditActivityForm } from '@/types/editActivity'
import { appendPaymentGatewayUuids } from '@/lib/createActivity'
import type { ActivityScheduleMode } from '@/types/createActivity'
import { initialCreateActivityForm } from '@/types/createActivity'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeTimeForApi(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '00:00:00'
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function toTimeInputValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 5)
}

function scheduleFromEvent(event: AdminEvent): {
  scheduleMode: ActivityScheduleMode
  eventDate: string
  eventTimeStart: string
  eventTimeEnd: string
} {
  const isSingle =
    event.event_type === 'single' || event.schedule_type === 'single'
  const firstSchedule = event.schedules?.[0]
  const firstTime = firstSchedule?.schedule_times?.[0]

  if (!isSingle) {
    return {
      scheduleMode: 'daily',
      eventDate: '',
      eventTimeStart: '',
      eventTimeEnd: '',
    }
  }

  return {
    scheduleMode: 'specific_date',
    eventDate: toDateInputValue(firstSchedule?.date_from),
    eventTimeStart: toTimeInputValue(firstTime?.time_start),
    eventTimeEnd: toTimeInputValue(firstTime?.time_end),
  }
}

export function mapEventToEditForm(event: AdminEvent): EditActivityForm {
  const attendeeFields = event.other_info
    ? Object.entries(event.other_info).map(([label, value]) => {
        const required =
          typeof value === 'string'
            ? value === 'required'
            : typeof value === 'object' && value !== null && 'required' in value
              ? (value as { required?: string }).required === 'required'
              : false
        return {
          id: crypto.randomUUID(),
          label,
          required,
        }
      })
    : []

  const schedule = scheduleFromEvent(event)

  return {
    ...initialCreateActivityForm,
    name: event.event_name,
    description: event.event_description,
    contactEmail: event.contact_email,
    contactNumber: event.contact_number ?? '',
    category: event.category?.name ?? '',
    categoryUuid: event.category_uuid ?? '',
    address: event.address ?? '',
    city: event.city ?? '',
    scheduleMode: schedule.scheduleMode,
    eventDate: schedule.eventDate,
    eventTimeStart: schedule.eventTimeStart,
    eventTimeEnd: schedule.eventTimeEnd,
    organizationName: event.organization?.name ?? '—',
    organizationUuid: event.organization_uuid ?? event.organization?.uuid ?? '',
    eventSectionUuid: event.event_section_uuid,
    eventType: event.event_type,
    eventConfig: event.event_config,
    slug: event.slug ?? slugify(event.event_name),
    status: event.status,
    attendeeFields,
    existingLogoImage: event.logo
      ? { uuid: event.logo.uuid, url: event.logo.url }
      : null,
    existingPortraitImage: event.portrait_image
      ? { uuid: event.portrait_image.uuid, url: event.portrait_image.url }
      : null,
    existingFeaturedImage: event.featured_image
      ? { uuid: event.featured_image.uuid, url: event.featured_image.url }
      : null,
    existingShowcaseImages: (event.event_showcase ?? []).map((image) => ({
      uuid: image.uuid,
      url: image.url,
    })),
    paymentGateways: event.payment_gateways ?? [],
    enableMetaPixel: !!event.track_event_meta,
    metaPixelId: event.meta_pixel_id ?? '',
    metaPixelAccessToken: event.meta_pixel_key ?? '',
  }
}

export function buildEditActivityFormData(form: EditActivityForm): FormData {
  const formData = new FormData()

  formData.append('event_name', form.name.trim())
  formData.append('event_description', form.description.trim())
  formData.append('contact_email', form.contactEmail.trim())
  // Always send so clearing the field removes the number on save.
  formData.append('contact_number', form.contactNumber.trim())
  formData.append('category_uuid', form.categoryUuid)
  const isSpecificDate = form.scheduleMode === 'specific_date'
  formData.append('event_type', isSpecificDate ? 'single' : 'daily')
  formData.append('event_config', form.eventConfig)
  formData.append('schedule_type', isSpecificDate ? 'single' : 'daily')
  formData.append('status', form.status)
  formData.append('slug', form.slug || slugify(form.name))
  formData.append('city', form.city.trim())
  if (form.address.trim()) formData.append('address', form.address.trim())
  if (isSpecificDate) {
    const date = form.eventDate.trim()
    const timeStart = normalizeTimeForApi(form.eventTimeStart)
    const timeEnd = normalizeTimeForApi(form.eventTimeEnd)
    formData.append('schedules[0][date_from]', date)
    formData.append('schedules[0][date_to]', date)
    formData.append('schedules[0][status]', 'published')
    formData.append('schedules[0][time][0][time_start]', timeStart)
    formData.append('schedules[0][time][0][time_end]', timeEnd)
    formData.append('schedules[0][time][0][status]', 'published')
  }
  // Super-admin update requires this; omit only when truly unset so the API can fill a default.
  if (form.organizationUuid.trim()) {
    formData.append('organization_uuid', form.organizationUuid.trim())
  }
  if (form.eventSectionUuid) {
    formData.append('event_section_uuid', form.eventSectionUuid)
  }

  if (form.logoImage) {
    formData.append('logo_image', form.logoImage)
  }
  if (form.portraitImage) {
    formData.append('portrait_image', form.portraitImage)
  }
  if (form.featuredImage) {
    formData.append('featured_image', form.featuredImage)
  }
  // Tell the API which saved showcase images to keep (removals are dropped from this list).
  formData.append('sync_event_showcase', '1')
  form.existingShowcaseImages.forEach((image, index) => {
    formData.append(`event_showcase_uuids[${index}]`, image.uuid)
  })
  form.showcaseImages.forEach((file, index) => {
    formData.append(`event_showcase[${index}]`, file)
  })

  appendPaymentGatewayUuids(formData, form)

  formData.append('enable_meta_pixel', form.enableMetaPixel ? 'true' : 'false')
  if (form.enableMetaPixel) {
    if (form.metaPixelId.trim()) {
      formData.append('meta_pixel_id', form.metaPixelId.trim())
    }
    if (form.metaPixelAccessToken.trim()) {
      formData.append(
        'meta_pixel_access_token',
        form.metaPixelAccessToken.trim(),
      )
    }
  }

  if (form.attendeeFields.length > 0) {
    const otherInfo = form.attendeeFields
      .filter((field) => field.label.trim())
      .reduce<
        Record<string, { required: string; type: string; placeholder: string }>
      >((acc, field) => {
        acc[field.label.trim()] = {
          required: field.required ? 'required' : 'optional',
          type: 'text',
          placeholder: '',
        }
        return acc
      }, {})
    if (Object.keys(otherInfo).length > 0) {
      formData.append('other_info', JSON.stringify(otherInfo))
    }
  }

  return formData
}
