export const AFFILIATE_MIN_PAYOUT_PHP = 1000

export function formatPeso(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0)
  const safe = Number.isFinite(n) ? n : 0
  return `₱${safe.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatAffiliateDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** API sends Y-m-d (calendar day); format in UTC so the day never shifts by timezone. */
export function formatAffiliateCalendarDay(value?: string | null): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value?.trim() ?? '')
  if (!match) return null
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  )
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-PH', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** API `commission_amount` is gross (order total × %). INT is 10% of gross; net is gross − INT. */
export function affiliateGrossIntNet(grossCommission: number): {
  intAmount: number
  netCommission: number
} {
  const intAmount = Math.round(grossCommission * 10) / 100
  const netCommission =
    Math.round((grossCommission - intAmount) * 100) / 100
  return { intAmount, netCommission }
}

/** Share link for one activity: `/attractions/{slug|uuid}?ref={code}`. */
export function buildActivityReferralLink(
  slug: string | null | undefined,
  uuid: string,
  code: string,
): string {
  if (typeof window === 'undefined') return ''
  const pathKey = slug || uuid
  return `${window.location.origin}/attractions/${encodeURIComponent(pathKey)}?ref=${encodeURIComponent(code)}`
}
