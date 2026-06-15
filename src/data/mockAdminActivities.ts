export type ActivityStatus = 'published' | 'pending' | 'draft'

export type AdminActivity = {
  id: string
  title: string
  description: string
  status: ActivityStatus
  organizer: string
  date: string
  revenue: number
  purchases: number
  views: number
}

export const mockAdminActivities: AdminActivity[] = [
  {
    id: '1',
    title: 'BARI – THE ABANDONED PRINCESS',
    description:
      'Step into a world of wonder with immersive storytelling and unforgettable experiences in Bonifacio Global City.',
    status: 'published',
    organizer: 'Philippine Amusement and Entertainment Corporation (PAEC)',
    date: 'May 25, 2026',
    revenue: 0,
    purchases: 0,
    views: 1240,
  },
  {
    id: '2',
    title: 'Neon Arcade Zone',
    description:
      'Interactive exhibits, immersive galleries, and hands-on discovery zones designed for curious minds of all ages.',
    status: 'published',
    organizer: 'Philippine Amusement and Entertainment Corporation (PAEC)',
    date: 'Jun 12, 2026',
    revenue: 0,
    purchases: 0,
    views: 892,
  },
  {
    id: '3',
    title: 'Boogie Bounce Adventure Park',
    description:
      'Jump, climb, and bounce through a massive indoor adventure park packed with trampolines and obstacle courses.',
    status: 'published',
    organizer: 'Philippine Amusement and Entertainment Corporation (PAEC)',
    date: 'Jul 3, 2026',
    revenue: 0,
    purchases: 0,
    views: 2105,
  },
  {
    id: '4',
    title: 'Sky Fun Carnival',
    description:
      'A vibrant open-air carnival featuring classic rides, game booths, live entertainment, and street food favorites.',
    status: 'published',
    organizer: 'Philippine Amusement and Entertainment Corporation (PAEC)',
    date: 'Aug 15, 2026',
    revenue: 0,
    purchases: 0,
    views: 1567,
  },
  {
    id: '5',
    title: 'MindSpark Science Museum',
    description:
      'Interactive science exhibits, digital art labs, and hands-on discovery zones for curious minds of all ages.',
    status: 'published',
    organizer: 'Philippine Amusement and Entertainment Corporation (PAEC)',
    date: 'Sep 1, 2026',
    revenue: 0,
    purchases: 0,
    views: 743,
  },
  {
    id: '6',
    title: 'Pixel Quest VR',
    description:
      'Next-generation virtual reality adventures with multiplayer arenas, escape rooms, and cinematic VR experiences.',
    status: 'pending',
    organizer: 'Philippine Amusement and Entertainment Corporation (PAEC)',
    date: 'Oct 10, 2026',
    revenue: 0,
    purchases: 0,
    views: 312,
  },
]

export const activityStats = {
  published: mockAdminActivities.filter((a) => a.status === 'published').length,
  pending: mockAdminActivities.filter((a) => a.status === 'pending').length,
  revenue: mockAdminActivities.reduce((sum, a) => sum + a.revenue, 0),
  ticketsSold: mockAdminActivities.reduce((sum, a) => sum + a.purchases, 0),
}
