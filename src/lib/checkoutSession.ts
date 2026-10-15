const CHECKOUT_SESSION_KEY = 'paec_checkout_session'

export type CheckoutTicketLine = {
  ticketTypeId: string
  name: string
  unitPrice: number
  originalUnitPrice?: number
  quantity: number
}

export type CheckoutSession = {
  attractionId: string
  eventUuid: string
  eventLocationUuid: string
  attractionName: string
  location: string
  image: string
  tickets: Array<CheckoutTicketLine>
  visitDate: string
  subtotal: number
  promoDiscount: number
  total: number
  appliedPromoCode?: {
    uuid: string
    code: string
    /** Kept so the cart can re-price the discount when quantities change. */
    discountType?: string
    discountValue?: string
  } | null
}

export type GuestCheckoutDetails = {
  firstName: string
  lastName: string
  address: string
  email: string
  confirmEmail: string
  mobileNumber: string
}

export function saveCheckoutSession(session: CheckoutSession): void {
  sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(session))
}

export function loadCheckoutSession(): CheckoutSession | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Partial<CheckoutSession>
    if (!Array.isArray(session.tickets) || session.tickets.length === 0) {
      return null
    }
    return session as CheckoutSession
  } catch {
    return null
  }
}

export function getTicketCount(
  session: Pick<CheckoutSession, 'tickets'>,
): number {
  return session.tickets.reduce((sum, line) => sum + line.quantity, 0)
}

export function clearCheckoutSession(): void {
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY)
}

export function validateCheckoutDetails(
  isLoggedIn: boolean,
  guest: GuestCheckoutDetails,
): Partial<Record<keyof GuestCheckoutDetails, string>> {
  if (isLoggedIn) return {}

  const errors: Partial<Record<keyof GuestCheckoutDetails, string>> = {}

  if (!guest.firstName.trim()) errors.firstName = 'First name is required'
  if (!guest.lastName.trim()) errors.lastName = 'Last name is required'
  if (!guest.address.trim()) errors.address = 'Address is required'
  if (!guest.email.trim()) {
    errors.email = 'Email address is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (!guest.confirmEmail.trim()) {
    errors.confirmEmail = 'Please confirm your email address'
  } else if (guest.email.trim() !== guest.confirmEmail.trim()) {
    errors.confirmEmail = 'Email addresses do not match'
  }
  if (!guest.mobileNumber.trim()) {
    errors.mobileNumber = 'Mobile number is required'
  } else if (!/^\d{10,15}$/.test(guest.mobileNumber.replace(/\D/g, ''))) {
    errors.mobileNumber = 'Enter a valid mobile number'
  }

  return errors
}
