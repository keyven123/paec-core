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
  category: string
  categoryUuid: string
  address: string
  city: string
  portraitImage: File | null
  featuredImage: File | null
  showcaseImages: File[]
  tickets: CreateActivityTicket[]
  attendeeFields: AttendeeField[]
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
  category: '',
  categoryUuid: '',
  city: '',
  address: '',
  portraitImage: null,
  featuredImage: null,
  showcaseImages: [],
  tickets: [createDefaultTicket()],
  attendeeFields: [],
}

export const createActivitySteps = [
  { id: 1, label: 'Basics', subtitle: 'Attraction details' },
  { id: 2, label: 'Images', subtitle: 'Visuals & preview' },
  { id: 3, label: 'Manage Ticket', subtitle: 'Tickets & attendee fields' },
  { id: 4, label: 'Summary', subtitle: 'Review before publish' },
  { id: 5, label: 'Preview', subtitle: 'Microsite preview' },
] as const
