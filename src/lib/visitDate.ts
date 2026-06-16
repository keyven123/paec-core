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
