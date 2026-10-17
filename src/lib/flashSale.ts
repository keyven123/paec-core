import type { Attraction } from '@/data/mockAttractions'
import type { PublicEventTicket } from '@/services/marketplaceService'

const MANILA_TIMEZONE = 'Asia/Manila'

export type FlashSaleInfo = {
  ticketId: string
  ticketName: string
  activityName: string
  activityId: string
  /** Target datetime the countdown counts toward (start if upcoming, end if live). */
  targetAt: string
  startsAt: string
  endsAt: string | null
  phase: 'upcoming' | 'live'
  image: string
  location: string
  categoryLabel: string
  price: number
  originalPrice?: number
}

function ticketPrice(ticket: PublicEventTicket, activity: Attraction): {
  price: number
  originalPrice?: number
} {
  const list = Number.parseFloat(String(ticket.price ?? ''))
  const discounted =
    ticket.discounted_price != null
      ? Number.parseFloat(String(ticket.discounted_price))
      : NaN
  const listOk = Number.isFinite(list)
  const discOk = Number.isFinite(discounted)

  if (listOk && discOk && discounted < list) {
    return { price: discounted, originalPrice: list }
  }
  if (listOk) return { price: list }
  return {
    price: activity.price,
    originalPrice: activity.originalPrice,
  }
}

export type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  expired: boolean
}

function getManilaDateTimeString(date = new Date()): string {
  const datePart = date.toLocaleDateString('en-CA', { timeZone: MANILA_TIMEZONE })
  const timePart = date.toLocaleTimeString('en-GB', {
    timeZone: MANILA_TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${datePart} ${timePart}`
}

/** Parse admin/API "Y-m-d H:i:s" as Asia/Manila wall time → epoch ms. */
export function parseManilaDateTime(value: string): number {
  const normalized = value.replace('T', ' ').replace(/\.\d+Z?$/, '').slice(0, 19)
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})(?::(\d{2}))?$/,
  )
  if (!match) {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? NaN : parsed
  }

  const [, y, m, d, hh, mm, ss = '00'] = match
  // Interpret components as Manila by building an ISO with +08:00 offset.
  return Date.parse(`${y}-${m}-${d}T${hh}:${mm}:${ss}+08:00`)
}

export function getCountdownParts(
  targetAt: string,
  now = new Date(),
): CountdownParts {
  const targetMs = parseManilaDateTime(targetAt)
  if (Number.isNaN(targetMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true }
  }

  const totalMs = Math.max(0, targetMs - now.getTime())
  const totalSeconds = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    expired: totalMs <= 0,
  }
}

function ticketWindow(ticket: PublicEventTicket): {
  from: string | null
  to: string | null
} {
  return {
    from: ticket.flash_sale_from ?? null,
    to: ticket.flash_sale_to ?? null,
  }
}

const DEFAULT_FLASH_SALE_LIMIT = 5

/**
 * Collect featured flash-sale tickets: upcoming first (soonest start), then
 * live (soonest end). Opt-in via feature_on_flash_sale + flash_sale window.
 * Pass `limit: 0` (or omit with a high number) for an uncapped listing page.
 */
export function pickFlashSales(
  entries: Array<{ activity: Attraction; tickets: PublicEventTicket[] }>,
  now = new Date(),
  limit = DEFAULT_FLASH_SALE_LIMIT,
): FlashSaleInfo[] {
  const nowStamp = getManilaDateTimeString(now)
  const upcoming: FlashSaleInfo[] = []
  const live: FlashSaleInfo[] = []

  for (const { activity, tickets } of entries) {
    for (const ticket of tickets) {
      if (!ticket.feature_on_flash_sale) continue

      const { from, to } = ticketWindow(ticket)
      if (!from && !to) continue

      const startsAt = from ?? to!
      const endsAt = to
      const pricing = ticketPrice(ticket, activity)
      const card = {
        ticketId: ticket.uuid,
        ticketName: ticket.name,
        activityName: activity.name,
        activityId: activity.id,
        startsAt,
        endsAt,
        image: activity.image,
        location: activity.location,
        categoryLabel: activity.categoryLabel || 'Attraction',
        price: pricing.price,
        originalPrice: pricing.originalPrice,
      }

      if (from && nowStamp < from) {
        upcoming.push({
          ...card,
          targetAt: from,
          phase: 'upcoming',
        })
        continue
      }

      const started = !from || nowStamp >= from
      const notEnded = !to || nowStamp <= to
      if (started && notEnded && to) {
        live.push({
          ...card,
          targetAt: to,
          endsAt: to,
          phase: 'live',
        })
      }
    }
  }

  upcoming.sort(
    (a, b) => parseManilaDateTime(a.targetAt) - parseManilaDateTime(b.targetAt),
  )
  live.sort(
    (a, b) => parseManilaDateTime(a.targetAt) - parseManilaDateTime(b.targetAt),
  )

  const combined = [...upcoming, ...live]
  if (limit <= 0) return combined
  return combined.slice(0, Math.max(1, limit))
}

/** @deprecated Prefer pickFlashSales for multi-sale banners. */
export function pickFlashSale(
  entries: Array<{ activity: Attraction; tickets: PublicEventTicket[] }>,
  now = new Date(),
): FlashSaleInfo | null {
  return pickFlashSales(entries, now, 1)[0] ?? null
}
