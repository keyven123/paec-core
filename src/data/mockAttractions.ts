export type TicketType = {
  id: string
  name: string
  price: number
}

export type AttractionLocation = {
  uuid: string
  name?: string | null
  city: string
  address?: string | null
  label: string
  organizationUuid?: string | null
}

export type Attraction = {
  id: string
  eventUuid: string
  name: string
  location: string
  locations: AttractionLocation[]
  category: string
  categoryLabel: string
  price: number
  originalPrice?: number
  image: string
  promo?: boolean
  featured?: boolean
  hours: string
  intensity: string
  rating: number
  reviewCount: number
  description: string
  tags: string[]
  ticketTypes: TicketType[]
}

export type HeroSlide = {
  id: string
  attractionId: string
  badge: string
  title: string
  highlight: string
  subtitle: string
  location: string
  priceFrom: number
  image: string
  featuredCard: {
    label: string
    name: string
    image: string
    attractionId: string
  }
}

export const categories = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'all-day', label: 'All-Day Activities', icon: '🎡' },
  { id: 'arcade', label: 'Arcade / Game Zone', icon: '🕹️' },
  { id: 'attractions', label: 'Attractions', icon: '🎢' },
  { id: 'cultural', label: 'Cultural & Heritage', icon: '🏛️' },
  { id: 'family', label: 'Family Entertainment', icon: '👨‍👩‍👧' },
  { id: 'food', label: 'Food & Booths', icon: '🍿' },
  { id: 'games', label: 'Games', icon: '🎯' },
  { id: 'indoor', label: 'Indoor Playground', icon: '🛝' },
]

export const heroSlides: HeroSlide[] = [
  {
    id: '1',
    attractionId: '2',
    badge: 'Top Picks',
    title: 'Discover Amazing',
    highlight: 'Attractions',
    subtitle:
      'Book tickets for the best attractions, museums, arcades, and experiences across the Philippines.',
    location: 'Metro Manila, Philippines',
    priceFrom: 699,
    image:
      'https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=1800&q=80',
    featuredCard: {
      label: 'Featured Activity',
      name: 'Boogie Bounce Adventure Park',
      image:
        'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=800&q=80',
      attractionId: '2',
    },
  },
  {
    id: '2',
    attractionId: '4',
    badge: 'Immersive Experience',
    title: 'Bari – The Abandoned',
    highlight: 'Princess',
    subtitle:
      'Step into a world of wonder with immersive storytelling and unforgettable experiences.',
    location: 'Bonifacio Global City, Taguig',
    priceFrom: 999,
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=80',
    featuredCard: {
      label: 'Featured Activity',
      name: 'Sky Fun Carnival',
      image:
        'https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=800&q=80',
      attractionId: '4',
    },
  },
]

export const featuredAttractions = [
  {
    id: '2',
    name: 'Boogie Bounce Adventure Park',
    price: 699,
    image:
      'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '1',
    name: 'Neon Arcade Zone',
    price: 499,
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '4',
    name: 'Sky Fun Carnival',
    price: 599,
    image:
      'https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '7',
    name: 'MindSpark Science Museum',
    price: 799,
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80',
  },
]

const defaultDescription =
  'Step into a world of interactive exhibits, immersive galleries, and hands-on discovery zones designed for curious minds of all ages. From physics playgrounds to digital art labs, every corner sparks wonder and learning through play.'

function singleLocation(id: string, label: string): AttractionLocation[] {
  const parts = label.split(',').map((part) => part.trim())
  const city = parts.length >= 2 ? parts[parts.length - 1] : label

  return [{ uuid: id, city, address: label, label }]
}

export const attractions: Attraction[] = [
  {
    id: '1',
    eventUuid: 'mock-event-1',
    name: 'Neon Arcade Zone',
    location: 'Eastwood Mall, Quezon City',
    locations: singleLocation('mock-loc-1', 'Eastwood Mall, Quezon City'),
    category: 'Arcade / Game Zone',
    categoryLabel: 'ARCADE / GAME ZONE',
    price: 499,
    originalPrice: 699,
    image:
      'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1200&q=80',
    promo: true,
    hours: '10:00 AM – 10:00 PM',
    intensity: 'Moderate',
    rating: 4.7,
    reviewCount: 214,
    description: defaultDescription,
    tags: ['#arcade', '#gaming', '#neon', '#family', '#indoor', '#weekend'],
    ticketTypes: [
      { id: '1a', name: '1-Hour Play Pass', price: 499 },
      { id: '1b', name: '3-Hour Unlimited Pass', price: 799 },
      { id: '1c', name: 'All-Day Pass', price: 999 },
    ],
  },
  {
    id: '2',
    eventUuid: 'mock-event-2',
    name: 'Boogie Bounce Adventure Park',
    location: 'SM Mall of Asia, Pasay City',
    locations: singleLocation('mock-loc-2', 'SM Mall of Asia, Pasay City'),
    category: 'Indoor Playground',
    categoryLabel: 'INDOOR PLAYGROUND / FAMILY',
    price: 699,
    image:
      'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    hours: '9:00 AM – 9:00 PM',
    intensity: 'High',
    rating: 4.9,
    reviewCount: 342,
    description:
      'Jump, climb, and bounce through a massive indoor adventure park packed with trampolines, obstacle courses, foam pits, and ninja warrior zones. Perfect for kids, teens, and families looking for high-energy fun rain or shine.',
    tags: ['#bounce', '#trampoline', '#family', '#kids', '#indoor', '#active'],
    ticketTypes: [
      { id: '2a', name: '90-Minute Session', price: 699 },
      { id: '2b', name: 'Family Bundle (4 pax)', price: 2399 },
    ],
  },
  {
    id: '3',
    eventUuid: 'mock-event-3',
    name: 'Heritage Walk Manila',
    location: 'Intramuros, Manila',
    locations: singleLocation('mock-loc-3', 'Intramuros, Manila'),
    category: 'Cultural & Heritage',
    categoryLabel: 'CULTURAL / HERITAGE TOUR',
    price: 350,
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    hours: '8:00 AM – 6:00 PM',
    intensity: 'Mild',
    rating: 4.6,
    reviewCount: 178,
    description:
      'Walk through centuries of Philippine history along cobblestone streets, Spanish-era fortifications, and beautifully restored heritage sites. Guided tours bring stories of Manila\'s past to life with immersive storytelling.',
    tags: ['#heritage', '#history', '#culture', '#walking', '#intramuros', '#tour'],
    ticketTypes: [
      { id: '3a', name: 'Guided Walking Tour', price: 350 },
      { id: '3b', name: 'Private Group Tour', price: 1200 },
    ],
  },
  {
    id: '4',
    eventUuid: 'mock-event-4',
    name: 'Sky Fun Carnival',
    location: 'BGC, Taguig',
    locations: singleLocation('mock-loc-4', 'BGC, Taguig'),
    category: 'Family Entertainment',
    categoryLabel: 'CARNIVAL / FAMILY ENTERTAINMENT',
    price: 599,
    originalPrice: 799,
    image:
      'https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=1200&q=80',
    promo: true,
    hours: '11:00 AM – 11:00 PM',
    intensity: 'Moderate',
    rating: 4.8,
    reviewCount: 256,
    description:
      'A vibrant open-air carnival featuring classic rides, game booths, live entertainment, and street food favorites. Enjoy ferris wheel views, bumper cars, and family-friendly attractions under the city lights.',
    tags: ['#carnival', '#rides', '#family', '#outdoor', '#food', '#nightlife'],
    ticketTypes: [
      { id: '4a', name: 'Ride All-Day Pass', price: 599 },
      { id: '4b', name: 'VIP Fast Lane Pass', price: 899 },
    ],
  },
  {
    id: '5',
    eventUuid: 'mock-event-5',
    name: 'Pixel Quest VR',
    location: 'Ayala Malls Manila Bay',
    locations: singleLocation('mock-loc-5', 'Ayala Malls Manila Bay'),
    category: 'Games',
    categoryLabel: 'VR / GAMING EXPERIENCE',
    price: 850,
    image:
      'https://images.unsplash.com/photo-1612287230202-1ff1d85c1bdf?auto=format&fit=crop&w=1200&q=80',
    hours: '10:00 AM – 9:00 PM',
    intensity: 'High',
    rating: 4.5,
    reviewCount: 132,
    description:
      'Dive into next-generation virtual reality adventures with multiplayer arenas, escape rooms, and cinematic VR experiences. State-of-the-art headsets and motion tracking deliver fully immersive gameplay.',
    tags: ['#vr', '#gaming', '#tech', '#multiplayer', '#immersive', '#indoor'],
    ticketTypes: [
      { id: '5a', name: 'Single VR Experience', price: 850 },
      { id: '5b', name: '3-Experience Bundle', price: 2100 },
    ],
  },
  {
    id: '6',
    eventUuid: 'mock-event-6',
    name: 'Taste Street Festival',
    location: 'MOA Complex, Pasay',
    locations: singleLocation('mock-loc-6', 'MOA Complex, Pasay'),
    category: 'Food & Booths',
    categoryLabel: 'FOOD FESTIVAL / MARKET',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    hours: '4:00 PM – 12:00 AM',
    intensity: 'Mild',
    rating: 4.4,
    reviewCount: 98,
    description:
      'A curated night market celebrating Filipino street food, global flavors, and local artisan vendors. Live music, pop-up kitchens, and themed food booths make every visit a delicious adventure.',
    tags: ['#food', '#festival', '#streetfood', '#nightmarket', '#livemusic', '#local'],
    ticketTypes: [
      { id: '6a', name: 'Entry Pass', price: 299 },
      { id: '6b', name: 'Food Tasting Bundle', price: 599 },
    ],
  },
  {
    id: '7',
    eventUuid: 'mock-event-7',
    name: 'MindSpark Science Museum',
    location: 'SM Mall of Asia, Pasay City',
    locations: singleLocation('mock-loc-7', 'SM Mall of Asia, Pasay City'),
    category: 'Attractions',
    categoryLabel: 'MUSEUM / EDUCATIONAL ATTRACTION',
    price: 799,
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    promo: true,
    hours: '9:00 AM – 8:00 PM',
    intensity: 'Mild',
    rating: 4.8,
    reviewCount: 120,
    description: defaultDescription,
    tags: [
      '#science',
      '#museum',
      '#educational',
      '#family',
      '#interactive',
      '#indoor',
      '#weekend',
    ],
    ticketTypes: [
      { id: '7a', name: 'Priority Access Pass', price: 799 },
      { id: '7b', name: 'General Admission', price: 599 },
      { id: '7c', name: 'Family Bundle (4 pax)', price: 2499 },
    ],
  },
]

export function getAttractionById(id: string): Attraction | undefined {
  return attractions.find((a) => a.id === id)
}

export function getRelatedAttractions(
  currentId: string,
  limit = 4,
): Attraction[] {
  const current = getAttractionById(currentId)
  if (!current) return attractions.slice(0, limit)

  const sameCategory = attractions.filter(
    (a) => a.id !== currentId && a.category === current.category,
  )
  const others = attractions.filter(
    (a) => a.id !== currentId && a.category !== current.category,
  )

  return [...sameCategory, ...others].slice(0, limit)
}
