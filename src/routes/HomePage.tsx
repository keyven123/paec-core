import { useEffect, useMemo, useState } from 'react'

import type { Attraction } from '@/data/mockAttractions'
import type { PublicVenueListing } from '@/services/venueListingService'
import { AttractionsSection } from '@/components/home/AttractionsSection'
import { CategorySection } from '@/components/home/CategorySection'
import { EventManagementSection } from '@/components/home/EventManagementSection'
import { HeroSection } from '@/components/home/HeroSection'
import { PromotionSection } from '@/components/home/PromotionSection'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  ALL_CATEGORIES,
  buildActivityCategories,
} from '@/lib/activityCategories'
import { pickFlashSales, type FlashSaleInfo } from '@/lib/flashSale'
import {
  buildHeroSlides,
  marketplaceService,
  mergeCatalogActivities,
} from '@/services/marketplaceService'
import { venueListingService } from '@/services/venueListingService'

const FLASH_SALE_SCAN_LIMIT = 8

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)
  const [activities, setActivities] = useState<Array<Attraction>>([])
  const [featuredActivities, setFeaturedActivities] = useState<
    Array<Attraction>
  >([])
  const [promoActivities, setPromoActivities] = useState<Array<Attraction>>([])
  const [venues, setVenues] = useState<Array<PublicVenueListing>>([])
  const [flashSales, setFlashSales] = useState<FlashSaleInfo[]>([])
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

  useEffect(() => {
    const source =
      featuredActivities.length > 0 ? featuredActivities : activities
    if (source.length === 0) {
      setFlashSales([])
      return
    }

    let cancelled = false

    async function loadFlashSales() {
      const sample = source.slice(0, FLASH_SALE_SCAN_LIMIT)
      const entries = await Promise.all(
        sample.map(async (activity) => ({
          activity,
          tickets: await marketplaceService.getEventTickets(activity.eventUuid),
        })),
      )
      if (!cancelled) {
        setFlashSales(pickFlashSales(entries))
      }
    }

    void loadFlashSales()

    return () => {
      cancelled = true
    }
  }, [featuredActivities, activities])

  const catalogActivities = useMemo(
    () => mergeCatalogActivities(activities, featuredActivities),
    [activities, featuredActivities],
  )

  const categoryOptions = useMemo(
    () => buildActivityCategories(catalogActivities),
    [catalogActivities],
  )

  const selectedCategory = categoryOptions.some((c) => c.id === activeCategory)
    ? activeCategory
    : ALL_CATEGORIES

  const heroSlides = useMemo(() => {
    const source =
      featuredActivities.length > 0 ? featuredActivities : catalogActivities
    return buildHeroSlides(source)
  }, [featuredActivities, catalogActivities])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection
          slides={heroSlides}
          flashSales={flashSales}
          loading={loading}
        />
        <CategorySection
          categories={categoryOptions}
          activeCategory={selectedCategory}
          onCategoryChange={setActiveCategory}
          loading={loading}
        />
        <AttractionsSection
          activeCategory={selectedCategory}
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
