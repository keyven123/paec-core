const CHECKOUT_SESSION_KEY = 'paec_checkout_session'

export type CheckoutSession = {
  attractionId: string
  eventUuid: string
  eventLocationUuid: string
  attractionName: string
  location: string
  image: string
  ticketTypeId: string
  ticketTypeName: string
  unitPrice: number
  quantity: number
  visitDate: string
  subtotal: number
  promoDiscount: number
  total: number
  appliedPromoCode?: { uuid: string; code: string } | null
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
    return JSON.parse(raw) as CheckoutSession
  } catch {
    return null
  }
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
