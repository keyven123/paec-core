import type { Attraction } from '@/data/mockAttractions'

export const ALL_CATEGORIES = 'all'

export type ActivityCategoryOption = {
  id: string
  label: string
  icon: string
  count: number
}

const CATEGORY_ICONS: Array<[RegExp, string]> = [
  [/all-day/i, '🎡'],
  [/arcade|game zone/i, '🕹️'],
  [/^games?$/i, '🎯'],
  [/cultur|heritage/i, '🏛️'],
  [/museum|educational|science/i, '🔬'],
  [/family|fec|carnival/i, '👨‍👩‍👧'],
  [/food|booth/i, '🍿'],
  [/playground/i, '🛝'],
  [/nature|eco/i, '🌿'],
  [/outdoor|adventure/i, '🧗'],
  [/water park/i, '🌊'],
  [/zoo|aquarium/i, '🐠'],
  [/sport|fitness|wellness/i, '⚽'],
  [/concert|live|music/i, '🎤'],
  [/\barts?\b/i, '🎨'],
  [/workshop|training|masterclass/i, '🛠️'],
  [/attraction/i, '🎢'],
]

function iconFor(name: string): string {
  return CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? '🎟️'
}

/** Categories that have at least one listed activity, with "All" first. */
export function buildActivityCategories(
  activities: Array<Attraction>,
): Array<ActivityCategoryOption> {
  const counts = new Map<string, number>()
  for (const activity of activities) {
    counts.set(activity.category, (counts.get(activity.category) ?? 0) + 1)
  }

  const options = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({
      id: name,
      label: name,
      icon: iconFor(name),
      count,
    }))

  return [
    { id: ALL_CATEGORIES, label: 'All', icon: '✦', count: activities.length },
    ...options,
  ]
}
