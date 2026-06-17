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
  mergeCatalogActivities,
  marketplaceService,
} from '@/services/marketplaceService'

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activities, setActivities] = useState<Attraction[]>([])
  const [featuredActivities, setFeaturedActivities] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadActivities() {
      setLoading(true)
      try {
        const [list, featured] = await Promise.all([
          marketplaceService.listActivities(),
          marketplaceService.listFeaturedActivities(100),
        ])
        if (!cancelled) {
          setActivities(list)
          setFeaturedActivities(featured)
        }
      } catch {
        if (!cancelled) {
          setActivities([])
          setFeaturedActivities([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadActivities()

    return () => {
      cancelled = true
    }
  }, [])

  const catalogActivities = useMemo(
    () => mergeCatalogActivities(activities, featuredActivities),
    [activities, featuredActivities],
  )

  const heroSlides = useMemo(() => {
    const source =
      featuredActivities.length > 0 ? featuredActivities : catalogActivities
    return buildHeroSlides(source)
  }, [featuredActivities, catalogActivities])
  const trendingEvents = useMemo(
    () => buildTrendingEvents(catalogActivities),
    [catalogActivities],
  )
  const featuredAttractions = useMemo(
    () =>
      (featuredActivities.length > 0 ? featuredActivities : activities).map(
        (activity) => ({
          id: activity.id,
          name: activity.name,
          price: activity.price,
          image: activity.image,
          location: activity.location,
        }),
      ),
    [featuredActivities, activities],
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
          activities={catalogActivities}
          loading={loading}
        />
      </main>
      <Footer />
    </div>
  )
}
