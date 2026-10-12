import { useEffect, useMemo, useState } from 'react'

import { AttractionsSection } from '@/components/home/AttractionsSection'
import { CategorySection } from '@/components/home/CategorySection'
import { EventManagementSection } from '@/components/home/EventManagementSection'
import { HeroSection } from '@/components/home/HeroSection'
import { PromotionSection } from '@/components/home/PromotionSection'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import type { Attraction } from '@/data/mockAttractions'
import type { PublicVenueListing } from '@/services/venueListingService'
import {
  buildHeroSlides,
  mergeCatalogActivities,
  marketplaceService,
} from '@/services/marketplaceService'
import { venueListingService } from '@/services/venueListingService'

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activities, setActivities] = useState<Attraction[]>([])
  const [featuredActivities, setFeaturedActivities] = useState<Attraction[]>([])
  const [promoActivities, setPromoActivities] = useState<Attraction[]>([])
  const [venues, setVenues] = useState<Array<PublicVenueListing>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadActivities() {
      setLoading(true)
      try {
        const [list, featured, promos, venueList] = await Promise.all([
          marketplaceService.listActivities(),
          marketplaceService.listFeaturedActivities(100),
          marketplaceService.listPromoActivities().catch(() => []),
          venueListingService.listPublic().catch(() => []),
        ])
        if (!cancelled) {
          setActivities(list)
          setFeaturedActivities(featured)
          setPromoActivities(promos)
          setVenues(venueList)
        }
      } catch {
        if (!cancelled) {
          setActivities([])
          setFeaturedActivities([])
          setPromoActivities([])
          setVenues([])
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

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection slides={heroSlides} loading={loading} />
        <CategorySection
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <AttractionsSection
          activeCategory={activeCategory}
          activities={catalogActivities}
          loading={loading}
        />
        <EventManagementSection venues={venues} loading={loading} />
        <PromotionSection activities={promoActivities} loading={loading} />
      </main>
      <Footer />
    </div>
  )
}
