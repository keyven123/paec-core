const MANILA_TIMEZONE = 'Asia/Manila'

function getManilaDateString(date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: MANILA_TIMEZONE })
}

function getManilaTimeString(date = new Date()): string {
  return date.toLocaleTimeString('en-GB', {
    timeZone: MANILA_TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getManilaTodayIso(date = new Date()): string {
  return getManilaDateString(date)
}

export function getManilaTodayDate(date = new Date()): Date {
  const [year, month, day] = getManilaTodayIso(date).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isTodayPastCutoff(
  cutoffTime: string | null | undefined,
  now = new Date(),
): boolean {
  if (!cutoffTime) return false

  const cutoff = cutoffTime.slice(0, 5)
  return getManilaTimeString(now) >= cutoff
}

export function isVisitDateBookable(
  visitDate: string,
  cutoffTime: string | null | undefined,
  now = new Date(),
): boolean {
  const manilaToday = getManilaDateString(now)

  if (visitDate < manilaToday) return false
  if (visitDate === manilaToday && isTodayPastCutoff(cutoffTime, now)) {
    return false
  }

  return true
}

type TicketAvailabilityWindow = {
  availableFrom?: string | null
  availableTo?: string | null
  featureOnFlashSale?: boolean
  flashSaleFrom?: string | null
  flashSaleTo?: string | null
  operationDays?: 'any' | 'weekdays' | 'weekends'
  operationHoursFrom?: string | null
  operationHoursTo?: string | null
}

function getManilaDateTimeString(date = new Date()): string {
  const datePart = getManilaDateString(date)
  const timePart = date.toLocaleTimeString('en-GB', {
    timeZone: MANILA_TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${datePart} ${timePart}`
}

/** Normalize API datetime ("Y-m-d H:i:s" or ISO) for string compares. */
function normalizeTicketDateTime(value: string): string {
  return value.replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 19)
}

function isWithinSaleWindow(
  from: string | null | undefined,
  to: string | null | undefined,
  now: Date,
): boolean {
  if (!from && !to) return true

  const manilaNow = getManilaDateTimeString(now)

  if (from) {
    const fromNorm = normalizeTicketDateTime(from)
    if (manilaNow < fromNorm) return false
  }

  if (to) {
    const toNorm = normalizeTicketDateTime(to)
    if (manilaNow > toNorm) return false
  }

  return true
}

/**
 * Sales window: when the ticket can be purchased.
 * Flash-featured tickets use flashSaleFrom/To; others use availableFrom/To.
 */
export function isTicketCurrentlyOnSale(
  ticket: TicketAvailabilityWindow,
  now = new Date(),
): boolean {
  if (ticket.featureOnFlashSale) {
    return isWithinSaleWindow(ticket.flashSaleFrom, ticket.flashSaleTo, now)
  }

  return isWithinSaleWindow(ticket.availableFrom, ticket.availableTo, now)
}

/** Manila weekday: Mon–Fri vs Sat–Sun. */
export function allowsOperationDay(
  visitDate: string,
  operationDays: 'any' | 'weekdays' | 'weekends' | undefined,
): boolean {
  if (!operationDays || operationDays === 'any') return true
  const [y, m, d] = visitDate.split('-').map(Number)
  if (!y || !m || !d) return true
  const day = new Date(y, m - 1, d).getDay() // 0=Sun … 6=Sat
  const isWeekend = day === 0 || day === 6
  if (operationDays === 'weekdays') return !isWeekend
  if (operationDays === 'weekends') return isWeekend
  return true
}

/**
 * Visit-date window from availableFrom / availableTo (inclusive).
 * Independent of the flash sale purchase window — leave empty for any date.
 */
export function isTicketAvailableForVisitDate(
  ticket: TicketAvailabilityWindow,
  visitDate: string | null | undefined,
): boolean {
  if (!visitDate) return true

  const from = ticket.availableFrom?.slice(0, 10)
  if (from && visitDate < from) return false

  const to = ticket.availableTo?.slice(0, 10)
  if (to && visitDate > to) return false

  if (!allowsOperationDay(visitDate, ticket.operationDays)) return false

  return true
}

export function ticketHasOperationHours(
  ticket: TicketAvailabilityWindow,
): boolean {
  return !!(ticket.operationHoursFrom || ticket.operationHoursTo)
}

/** 30-minute slots between from/to inclusive. */
export function buildOperationTimeSlots(
  from: string | null | undefined,
  to: string | null | undefined,
): Array<string> {
  const start = (from ?? '09:00').slice(0, 5)
  const end = (to ?? '17:00').slice(0, 5)
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = sh * 60 + sm
  const endMins = eh * 60 + em
  if (!Number.isFinite(mins) || !Number.isFinite(endMins) || endMins < mins) {
    return []
  }
  const slots: Array<string> = []
  while (mins <= endMins) {
    const h = String(Math.floor(mins / 60)).padStart(2, '0')
    const m = String(mins % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    mins += 30
  }
  return slots
}

export function isVisitTimeAllowed(
  ticket: TicketAvailabilityWindow,
  visitTime: string | null | undefined,
): boolean {
  if (!ticketHasOperationHours(ticket)) return true
  if (!visitTime) return false
  const time = visitTime.slice(0, 5)
  const from = ticket.operationHoursFrom?.slice(0, 5)
  const to = ticket.operationHoursTo?.slice(0, 5)
  if (from && time < from) return false
  if (to && time > to) return false
  return true
}

/** On sale now, and visit date (when set) falls inside the visit window. */
export function isTicketAvailableForBooking(
  ticket: TicketAvailabilityWindow,
  visitDate: string | null | undefined,
  now = new Date(),
): boolean {
  return (
    isTicketCurrentlyOnSale(ticket, now) &&
    isTicketAvailableForVisitDate(ticket, visitDate)
  )
}

export function getEarliestBookableDate(
  cutoffTime: string | null | undefined,
  now = new Date(),
): Date {
  const manilaToday = getManilaDateString(now)
  const [year, month, day] = manilaToday.split('-').map(Number)

  if (isTodayPastCutoff(cutoffTime, now)) {
    return new Date(year, month - 1, day + 1)
  }

  return new Date(year, month - 1, day)
}

export function formatCutoffTimeLabel(
  cutoffTime: string | null | undefined,
): string | null {
  if (!cutoffTime) return null

  const [hours, minutes] = cutoffTime.slice(0, 5).split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
