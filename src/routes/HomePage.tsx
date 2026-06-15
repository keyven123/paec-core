import { useEffect, useMemo, useState } from 'react'

import { AttractionsSection } from '@/components/home/AttractionsSection'
import { BrowseByCitySection } from '@/components/home/BrowseByCitySection'
import { CategorySection } from '@/components/home/CategorySection'
import { HeroSection } from '@/components/home/HeroSection'
import { TrendingSection } from '@/components/home/TrendingSection'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import type { Attraction } from '@/data/mockAttractions'
import {
  buildHeroSlides,
  buildTrendingEvents,
  marketplaceService,
} from '@/services/marketplaceService'

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activities, setActivities] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadActivities() {
      setLoading(true)
      try {
        const list = await marketplaceService.listActivities()
        if (!cancelled) setActivities(list)
      } catch {
        if (!cancelled) setActivities([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadActivities()

    return () => {
      cancelled = true
    }
  }, [])

  const heroSlides = useMemo(() => buildHeroSlides(activities), [activities])
  const trendingEvents = useMemo(
    () => buildTrendingEvents(activities),
    [activities],
  )
  const featuredAttractions = useMemo(
    () =>
      activities.slice(0, 4).map((activity) => ({
        id: activity.id,
        name: activity.name,
        price: activity.price,
        image: activity.image,
      })),
    [activities],
  )

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection
          slides={heroSlides}
          featuredAttractions={featuredAttractions}
          loading={loading}
        />
        <BrowseByCitySection loading={loading} />
        <TrendingSection events={trendingEvents} loading={loading} />
        <CategorySection
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <AttractionsSection
          activeCategory={activeCategory}
          activities={activities}
          loading={loading}
        />
      </main>
      <Footer />
    </div>
  )
}
