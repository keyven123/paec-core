import type { CreateActivityForm } from '@/types/createActivity'

export type ExistingImage = {
  uuid: string
  url: string
}

export type EditActivityForm = CreateActivityForm & {
  organizationName: string
  organizationUuid: string
  categoryUuid: string
  eventSectionUuid: string
  eventType: string
  eventConfig: string
  slug: string
  status: string
  existingPortraitImage: ExistingImage | null
  existingFeaturedImage: ExistingImage | null
  existingShowcaseImages: ExistingImage[]
  enableMetaPixel: boolean
  metaPixelId: string
  metaPixelAccessToken: string
}

export const editActivitySteps = [
  { id: 1, label: 'Basics', subtitle: 'Attraction details' },
  { id: 2, label: 'Images', subtitle: 'Visuals & preview' },
  { id: 3, label: 'Attendee & Tracking', subtitle: 'Fields & pixel' },
  { id: 4, label: 'Summary', subtitle: 'Review before publish' },
  { id: 5, label: 'Preview', subtitle: 'Microsite preview' },
] as const
