import type { PaymentGatewayOption } from '@/services/paymentGatewayService'

export type AttendeeField = {
  id: string
  label: string
  required: boolean
}

export type CreateActivityTicket = {
  id: string
  name: string
  description: string
  price: string
  maxTicket: string
  isUnlimited: boolean
  visitPolicy: 'priority' | 'flexible' | ''
  validityDays: number
}

export type CreateActivityForm = {
  name: string
  description: string
  contactEmail: string
  /** Per-activity phone shown on the storefront for this attraction. */
  contactNumber: string
  category: string
  categoryUuid: string
  address: string
  city: string
  portraitImage: File | null
  featuredImage: File | null
  showcaseImages: Array<File>
  tickets: Array<CreateActivityTicket>
  attendeeFields: Array<AttendeeField>
  /** Selected gateways (at most one per provider); only their uuids are submitted. */
  paymentGateways: Array<PaymentGatewayOption>
}

function createDefaultTicket(): CreateActivityTicket {
  return {
    id: crypto.randomUUID(),
    name: 'General Admission',
    description: '',
    price: '',
    maxTicket: '500',
    isUnlimited: false,
    visitPolicy: 'priority',
    validityDays: 7,
  }
}

export const initialCreateActivityForm: CreateActivityForm = {
  name: '',
  description: '',
  contactEmail: '',
  contactNumber: '',
  category: '',
  categoryUuid: '',
  city: '',
  address: '',
  portraitImage: null,
  featuredImage: null,
  showcaseImages: [],
  tickets: [createDefaultTicket()],
  attendeeFields: [],
  paymentGateways: [],
}

/** Both activity wizards place the Payment step here, right before Summary. */
export const PAYMENT_STEP = 4
export const SUMMARY_STEP = 5

export const createActivitySteps = [
  { id: 1, label: 'Basics', subtitle: 'Attraction details' },
  { id: 2, label: 'Images', subtitle: 'Visuals & preview' },
  { id: 3, label: 'Manage Ticket', subtitle: 'Tickets & attendee fields' },
  { id: PAYMENT_STEP, label: 'Payment', subtitle: 'Payment gateways' },
  { id: SUMMARY_STEP, label: 'Summary', subtitle: 'Review before publish' },
  { id: 6, label: 'Preview', subtitle: 'Microsite preview' },
] as const
