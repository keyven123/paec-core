export type TrendingEvent = {
  id: string
  attractionId: string
  title: string
  location: string
  date: string
  passType?: string
  price: number
  category: string
  badge: string
  image: string
  featured?: boolean
  sellingFast?: boolean
}

export const trendingEvents: TrendingEvent[] = [
  {
    id: 't1',
    attractionId: '2',
    title: 'Viva Revolución at BSK Manila',
    location: 'BSK Manila, Makati',
    date: 'Mar 14 – 17, 2026',
    passType: '4-Day Pass',
    price: 1800,
    category: 'CONCERT',
    badge: 'SELLING FAST',
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
    featured: true,
    sellingFast: true,
  },
  {
    id: 't2',
    attractionId: '1',
    title: 'Neon Nights Festival',
    location: 'BGC Arts Center',
    date: 'Apr 5, 2026',
    price: 950,
    category: 'FESTIVAL',
    badge: 'FEATURED',
    image:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 't3',
    attractionId: '4',
    title: 'Skyline Carnival 2026',
    location: 'MOA Arena, Pasay',
    date: 'May 1 – 3, 2026',
    price: 650,
    category: 'FAMILY',
    badge: 'NEW',
    image:
      'https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 't4',
    attractionId: '3',
    title: 'Heritage Light Show',
    location: 'Intramuros, Manila',
    date: 'Every Fri & Sat',
    price: 450,
    category: 'CULTURAL',
    badge: 'POPULAR',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 't5',
    attractionId: '5',
    title: 'Pixel Arena Championship',
    location: 'SM North EDSA',
    date: 'Mar 22, 2026',
    price: 799,
    category: 'GAMING',
    badge: 'LIMITED',
    image:
      'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=600&q=80',
  },
]

export const trendingFeatured = trendingEvents.find((e) => e.featured)!
export const trendingGrid = trendingEvents.filter((e) => !e.featured)
