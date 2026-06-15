import type { PublicPromoCode } from '@/services/promoCodeService'

function calcDiscount(subtotal: number, promo: PublicPromoCode): number {
  const value = Number.parseFloat(promo.discount_value)
  if (Number.isNaN(value) || subtotal <= 0) return 0

  const type = promo.discount_type?.toLowerCase()
  let amount = 0
  if (type === 'percentage') {
    amount = (value / 100) * subtotal
  } else if (type === 'amount') {
    amount = Math.min(value, subtotal)
  }

  return Math.round(amount * 100) / 100
}

export function getPromoDiscountAmount(
  subtotal: number,
  promo: PublicPromoCode | null,
): number {
  if (!promo || subtotal <= 0) return 0
  return calcDiscount(subtotal, promo)
}

export function formatPromoSavingsLabel(
  promo: PublicPromoCode,
  subtotal: number,
): string {
  const type = promo.discount_type?.toLowerCase()
  if (subtotal > 0) {
    return `−₱${calcDiscount(subtotal, promo).toLocaleString()}`
  }
  if (type === 'percentage') {
    return `${promo.discount_value}% off`
  }
  const amount = Number.parseFloat(promo.discount_value)
  return `up to ₱${amount.toLocaleString()} off`
}
