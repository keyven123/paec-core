import type { AdminEvent } from '@/services/adminEventService'
import type { AdminEventTicket } from '@/services/adminEventTicketService'

export const VISIT_POLICY_OPTIONS = [
  { value: 'priority', label: 'Priority Ticket' },
  { value: 'flexible', label: 'Flexible Access Ticket' },
] as const

export type VisitPolicy = (typeof VISIT_POLICY_OPTIONS)[number]['value']

export type CouponFormItem = { uuid?: string; name: string; once_only?: boolean }

export type EventTicketFormState = {
  name: string
  description: string
  price: string
  available_from: string
  available_to: string
  display_order: number
  max_ticket: string
  schedule_uuid: string
  schedule_time_uuid: string
  status: string
  is_virtual: boolean
  virtual_event_url: string
  with_discount: boolean
  discount_type: string
  discount_value: string
  is_unlimited: boolean
  visit_policy: VisitPolicy | ''
  validity_days: number
  ticket_limit_per_user: number | null
  is_bundle: boolean
  bundle_quantity: string
  with_coupon: boolean
  coupons: CouponFormItem[]
}

export const emptyEventTicketForm = (): EventTicketFormState => ({
  name: '',
  description: '',
  price: '',
  available_from: '',
  available_to: '',
  display_order: 1,
  max_ticket: '',
  schedule_uuid: '',
  schedule_time_uuid: '',
  status: 'active',
  is_virtual: false,
  virtual_event_url: '',
  with_discount: false,
  discount_type: '',
  discount_value: '',
  is_unlimited: false,
  visit_policy: '',
  validity_days: 0,
  ticket_limit_per_user: null,
  is_bundle: false,
  bundle_quantity: '',
  with_coupon: false,
  coupons: [],
})

export function formatDateTimeForInput(dateString: string | null | undefined) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function formatDateTimeForBackend(
  dateTimeString: string | null | undefined,
): string | null {
  if (!dateTimeString) return null
  const [datePart, timePart] = dateTimeString.split('T')
  if (!datePart || !timePart) return null
  return `${datePart} ${timePart}:00`
}

export function ticketToForm(
  ticket: AdminEventTicket,
  event: AdminEvent | null,
): EventTicketFormState {
  const hasDiscount = !!(ticket.discount_type && ticket.discount_value)
  const disableBundle = event?.event_config === 'seat_selection'

  return {
    name: ticket.name,
    description: ticket.description ?? '',
    price: ticket.price,
    available_from: formatDateTimeForInput(ticket.available_from),
    available_to: formatDateTimeForInput(ticket.available_to),
    display_order: ticket.display_order,
    max_ticket: String(ticket.max_ticket),
    schedule_uuid: ticket.schedule_uuid ?? '',
    schedule_time_uuid: ticket.schedule_time_uuid ?? '',
    status: ticket.status,
    is_virtual: ticket.is_virtual,
    virtual_event_url: ticket.virtual_event_url ?? '',
    with_discount: hasDiscount,
    discount_type: ticket.discount_type ?? '',
    discount_value: ticket.discount_value ?? '',
    is_unlimited: ticket.is_unlimited,
    visit_policy: (ticket.visit_policy ?? '') as VisitPolicy | '',
    validity_days: ticket.validity_days ?? 0,
    ticket_limit_per_user: ticket.ticket_limit_per_user ?? null,
    is_bundle: disableBundle ? false : ticket.is_bundle,
    bundle_quantity: disableBundle
      ? ''
      : (ticket.bundle_quantity?.toString() ?? ''),
    with_coupon: !!(ticket.coupons && ticket.coupons.length > 0),
    coupons: (ticket.coupons ?? []).map((coupon) => ({
      uuid: coupon.uuid,
      name: coupon.name,
      once_only: coupon.once_only ?? false,
    })),
  }
}

export function isPaecFunActivity(
  event:
    | Pick<AdminEvent, 'event_section_name' | 'event_type' | 'is_featured'>
    | null
    | undefined,
): boolean {
  if (!event) return false

  return (
    event.event_section_name === 'amusements' ||
    event.event_section_name === 'featured' ||
    event.event_type === 'daily'
  )
}

export function shouldHideScheduleFields(event: AdminEvent | null) {
  return isPaecFunActivity(event)
}

export function validateEventTicketForm(
  form: EventTicketFormState,
  event: AdminEvent | null,
  isEdit: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!isEdit && !shouldHideScheduleFields(event)) {
    if (!form.schedule_uuid) errors.schedule_uuid = 'Schedule is required'
    if (!form.schedule_time_uuid) {
      errors.schedule_time_uuid = 'Schedule time is required'
    }
  }

  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.price || Number.parseFloat(form.price) < 0) {
    errors.price = 'Valid price is required'
  }

  if (form.is_virtual && !form.virtual_event_url.trim()) {
    errors.virtual_event_url = 'Virtual activity link is required'
  }

  if (!form.display_order || form.display_order < 1) {
    errors.display_order = 'Display order must be at least 1'
  }

  if (form.with_discount) {
    if (!form.discount_type) {
      errors.discount_type = 'Discount type is required'
    }
    const discountValue = Number.parseFloat(form.discount_value)
    if (!form.discount_value || discountValue <= 0) {
      errors.discount_value = 'Discount value must be greater than 0'
    } else if (form.discount_type === 'percentage' && discountValue > 100) {
      errors.discount_value = 'Discount percentage must be between 0 and 100'
    } else if (form.discount_type === 'amount') {
      const price = Number.parseFloat(form.price)
      if (discountValue > price) {
        errors.discount_value = `Discount amount must not exceed ${price}`
      }
    }
  }

  if (
    form.visit_policy === 'flexible' &&
    (!Number.isInteger(form.validity_days) || form.validity_days < 1)
  ) {
    errors.validity_days =
      'Number of days is required when visit policy is Flexible Access'
  }

  if (
    form.ticket_limit_per_user !== null &&
    (!Number.isInteger(form.ticket_limit_per_user) ||
      form.ticket_limit_per_user < 1)
  ) {
    errors.ticket_limit_per_user = 'Ticket limit per user must be at least 1'
  }

  if (
    form.is_bundle &&
    (!form.bundle_quantity || Number.parseInt(form.bundle_quantity, 10) < 1)
  ) {
    errors.bundle_quantity = 'Bundle quantity must be at least 1'
  }

  if (
    form.with_coupon &&
    (!form.coupons.length ||
      form.coupons.every((coupon) => !coupon.name.trim()))
  ) {
    errors.coupons = 'At least one coupon name is required'
  }

  return errors
}

export function buildCreateTicketPayload(
  activityId: string,
  form: EventTicketFormState,
  event: AdminEvent | null,
) {
  const hideSchedules = shouldHideScheduleFields(event)

  return {
    event_uuid: activityId,
    schedule_uuid: hideSchedules ? undefined : form.schedule_uuid || undefined,
    schedule_time_uuid: hideSchedules
      ? undefined
      : form.schedule_time_uuid || undefined,
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: form.price,
    available_from: formatDateTimeForBackend(form.available_from),
    available_to: formatDateTimeForBackend(form.available_to),
    display_order: form.display_order,
    max_ticket: form.is_unlimited
      ? 999999999
      : form.max_ticket
        ? Number.parseInt(form.max_ticket, 10)
        : undefined,
    is_virtual: form.is_virtual,
    virtual_event_url: form.virtual_event_url.trim() || null,
    discount_type: form.with_discount ? form.discount_type : null,
    discount_value: form.with_discount ? form.discount_value : null,
    is_unlimited: form.is_unlimited,
    ticket_limit_per_user: form.ticket_limit_per_user,
    is_bundle: form.is_bundle,
    bundle_quantity:
      form.is_bundle && form.bundle_quantity
        ? Number.parseInt(form.bundle_quantity, 10)
        : undefined,
    visit_policy: form.visit_policy || undefined,
    validity_days:
      form.visit_policy === 'flexible' ? form.validity_days : undefined,
    with_coupon: form.with_coupon,
    coupons: form.with_coupon
      ? form.coupons
          .filter((coupon) => coupon.name.trim())
          .map((coupon) => ({
            name: coupon.name.trim(),
            once_only: form.is_bundle ? !!coupon.once_only : false,
          }))
      : [],
  }
}

export function buildUpdateTicketPayload(
  form: EventTicketFormState,
): Record<string, unknown> {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: form.price,
    available_from: formatDateTimeForBackend(form.available_from),
    available_to: formatDateTimeForBackend(form.available_to),
    display_order: form.display_order,
    max_ticket: form.is_unlimited
      ? 999999999
      : Number.parseInt(form.max_ticket, 10),
    status: form.status,
    is_virtual: form.is_virtual,
    virtual_event_url: form.virtual_event_url.trim() || null,
    discount_type: form.with_discount ? form.discount_type : null,
    discount_value: form.with_discount ? form.discount_value : null,
    is_unlimited: form.is_unlimited,
    ticket_limit_per_user: form.ticket_limit_per_user,
    is_bundle: form.is_bundle,
    bundle_quantity:
      form.is_bundle && form.bundle_quantity
        ? Number.parseInt(form.bundle_quantity, 10)
        : null,
    visit_policy: form.visit_policy || null,
    validity_days:
      form.visit_policy === 'flexible' ? form.validity_days : null,
    with_coupon: form.with_coupon,
    coupons: form.with_coupon
      ? form.coupons
          .filter((coupon) => coupon.name.trim())
          .map((coupon) => ({
            ...(coupon.uuid ? { uuid: coupon.uuid } : {}),
            name: coupon.name.trim(),
            once_only: form.is_bundle ? !!coupon.once_only : false,
          }))
      : [],
  }
}
