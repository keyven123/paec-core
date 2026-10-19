import type { CreateActivityForm } from '@/types/createActivity'

function normalizeTimeForApi(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '00:00:00'
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed
}

/** Sent as JSON so an empty selection still reaches the API (multipart can't carry `[]`). */
export function appendPaymentGatewayUuids(
  formData: FormData,
  form: Pick<CreateActivityForm, 'paymentGateways'>,
) {
  formData.append(
    'payment_gateway_uuids',
    JSON.stringify(form.paymentGateways.map((gateway) => gateway.uuid)),
  )
}

export function buildCreateActivityFormData(
  form: CreateActivityForm,
  options: { publish?: boolean } = {},
): FormData {
  const formData = new FormData()

  formData.append('event_name', form.name.trim())
  formData.append('event_description', form.description.trim())
  formData.append('contact_email', form.contactEmail.trim())
  if (form.contactNumber.trim()) {
    formData.append('contact_number', form.contactNumber.trim())
  }
  formData.append('category_uuid', form.categoryUuid)
  const isSpecificDate = form.scheduleMode === 'specific_date'
  formData.append('event_type', isSpecificDate ? 'single' : 'daily')
  formData.append('event_config', 'open_ticket')
  formData.append('schedule_type', isSpecificDate ? 'single' : 'daily')
  formData.append('city', form.city.trim())

  if (form.address.trim()) {
    formData.append('address', form.address.trim())
  }

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
    formData.append('ticket_available_from', date)
    formData.append('ticket_available_to', date)
  }

  if (options.publish) {
    formData.append('status', 'published')
  } else {
    formData.append('status', 'draft')
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
  form.showcaseImages.forEach((file, index) => {
    formData.append(`event_showcase[${index}]`, file)
  })

  appendPaymentGatewayUuids(formData, form)

  form.tickets.forEach((ticket, index) => {
    formData.append(`tickets[${index}][name]`, ticket.name.trim())
    formData.append(`tickets[${index}][price]`, ticket.price)
    if (ticket.description.trim()) {
      formData.append(
        `tickets[${index}][description]`,
        ticket.description.trim(),
      )
    }
    formData.append(
      `tickets[${index}][max_ticket]`,
      ticket.isUnlimited
        ? '999999999'
        : String(Number.parseInt(ticket.maxTicket, 10) || 500),
    )
    formData.append(
      `tickets[${index}][is_unlimited]`,
      ticket.isUnlimited ? 'true' : 'false',
    )
    formData.append(`tickets[${index}][is_virtual]`, 'false')
    if (ticket.visitPolicy) {
      formData.append(`tickets[${index}][visit_policy]`, ticket.visitPolicy)
    }
    if (ticket.visitPolicy === 'flexible' && ticket.validityDays > 0) {
      formData.append(
        `tickets[${index}][validity_days]`,
        String(ticket.validityDays),
      )
    }
  })

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

export function validateCreateActivitySchedule(
  form: CreateActivityForm,
): string | null {
  if (form.scheduleMode !== 'specific_date') return null
  if (!form.eventDate.trim()) {
    return 'Please select the event date.'
  }
  if (!form.eventTimeStart.trim() || !form.eventTimeEnd.trim()) {
    return 'Please set the event start and end time.'
  }
  if (form.eventTimeEnd.trim() < form.eventTimeStart.trim()) {
    return 'Event end time must be after or equal to the start time.'
  }
  return null
}

export function validateCreateActivityTickets(
  form: CreateActivityForm,
): string | null {
  if (form.tickets.length === 0) {
    return 'Add at least one ticket before continuing.'
  }

  for (const [index, ticket] of form.tickets.entries()) {
    if (!ticket.name.trim()) {
      return `Ticket ${index + 1}: name is required.`
    }
    const price = Number.parseFloat(ticket.price)
    if (!ticket.price || Number.isNaN(price) || price < 0) {
      return `Ticket ${index + 1}: enter a valid price.`
    }
    if (
      ticket.visitPolicy === 'flexible' &&
      (!Number.isInteger(ticket.validityDays) || ticket.validityDays < 1)
    ) {
      return `Ticket ${index + 1}: validity days is required for flexible tickets.`
    }
  }

  return null
}
