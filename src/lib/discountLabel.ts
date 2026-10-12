export type DiscountType = 'percentage' | 'amount'

export type DiscountInfo = {
  discountPercent?: number
  discountType?: DiscountType
  discountAmount?: number
}

export function formatPesoValue(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export function hasDiscount(info: DiscountInfo): boolean {
  return Boolean(info.discountPercent)
}

export function isAmountDiscount(info: DiscountInfo): boolean {
  return info.discountType === 'amount' && Boolean(info.discountAmount)
}

/** Headline value, e.g. "20%" or "₱50". */
export function discountValueLabel(info: DiscountInfo): string {
  if (isAmountDiscount(info))
    return `₱${formatPesoValue(info.discountAmount ?? 0)}`
  return `${info.discountPercent ?? 0}%`
}

/** Short tag, e.g. "20% off" or "₱50 off". */
export function discountOffLabel(info: DiscountInfo): string {
  return `${discountValueLabel(info)} off`
}
