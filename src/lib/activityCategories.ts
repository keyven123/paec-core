import type { Attraction } from '@/data/mockAttractions'

/** Empty selection — show every activity. */
export const ALL_CATEGORIES = 'all'

export type ActivityCategoryOption = {
  id: string
  label: string
  /** Lucide icon key used by CategoryBar */
  icon: string
  count: number
}

/** Marketplace category chips (no “All” — empty selection means all). */
export const MARKETPLACE_CATEGORIES: Array<{
  id: string
  label: string
  icon: string
}> = [
  { id: 'SALE', label: 'SALE', icon: 'tag' },
  { id: 'Events', label: 'Events', icon: 'calendar' },
  { id: 'Cultural and Heritage', label: 'Cultural and Heritage', icon: 'landmark' },
  { id: 'Team Building', label: 'Team Building', icon: 'users' },
  { id: 'Science', label: 'Science', icon: 'flask-conical' },
  { id: 'Outdoor activities', label: 'Outdoor activities', icon: 'trees' },
  { id: 'Art and craft', label: 'Art and craft', icon: 'palette' },
  { id: 'Food', label: 'Food', icon: 'utensils' },
  { id: 'Celebration', label: 'Celebration', icon: 'party-popper' },
  { id: 'Annual pass', label: 'Annual pass', icon: 'ticket' },
]

/** Admin / create-activity dropdown. */
export const ACTIVITY_CATEGORY_OPTIONS = MARKETPLACE_CATEGORIES.map((c) => ({
  id: c.id,
  label: c.label,
  icon: c.icon,
}))

/**
 * Always show the full marketplace category list.
 * Counts come from listed activities when names match.
 */
export function buildActivityCategories(
  activities: Array<Attraction>,
): Array<ActivityCategoryOption> {
  const counts = new Map<string, number>()
  for (const activity of activities) {
    counts.set(activity.category, (counts.get(activity.category) ?? 0) + 1)
  }

  return MARKETPLACE_CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    count: counts.get(cat.id) ?? counts.get(cat.label) ?? 0,
  }))
}
