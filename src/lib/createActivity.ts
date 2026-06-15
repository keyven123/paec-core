import type { CreateActivityForm } from '@/types/createActivity'

export function buildCreateActivityFormData(
  form: CreateActivityForm,
  options: { publish?: boolean } = {},
): FormData {
  const formData = new FormData()

  formData.append('event_name', form.name.trim())
  formData.append('event_description', form.description.trim())
  formData.append('contact_email', form.contactEmail.trim())
  formData.append('category_uuid', form.categoryUuid)
  formData.append('event_type', 'daily')
  formData.append('event_config', 'open_ticket')
  formData.append('schedule_type', 'daily')
  formData.append('city', form.city.trim())

  if (form.address.trim()) {
    formData.append('address', form.address.trim())
  }

  if (options.publish) {
    formData.append('status', 'published')
  } else {
    formData.append('status', 'draft')
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

  form.tickets.forEach((ticket, index) => {
    formData.append(`tickets[${index}][name]`, ticket.name.trim())
    formData.append(`tickets[${index}][price]`, ticket.price)
    if (ticket.description.trim()) {
      formData.append(`tickets[${index}][description]`, ticket.description.trim())
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
