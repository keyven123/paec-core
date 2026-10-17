import { Link } from '@tanstack/react-router'
import { ArrowLeft, Flame, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { FlashSaleTicketCard } from '@/components/flash-sales/FlashSaleTicketCard'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import type { Attraction } from '@/data/mockAttractions'
import {
  getCountdownParts,
  pickFlashSales,
  type FlashSaleInfo,
} from '@/lib/flashSale'
import { cn } from '@/lib/utils'
import {
  marketplaceService,
  mergeCatalogActivities,
} from '@/services/marketplaceService'

type FilterTab = 'all' | 'upcoming' | 'live'

export function FlashSalesPage() {
  const [sales, setSales] = useState<FlashSaleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [list, featured] = await Promise.all([
          marketplaceService.listActivities(),
          marketplaceService.listFeaturedActivities(100).catch(() => []),
        ])
        if (cancelled) return

        const catalog = mergeCatalogActivities(list, featured)
        const entries = await Promise.all(
          catalog.map(async (activity: Attraction) => ({
            activity,
            tickets: await marketplaceService
              .getEventTickets(activity.eventUuid)
              .catch(() => []),
          })),
        )
        if (cancelled) return

        setSales(pickFlashSales(entries, new Date(), 0))
      } catch {
        if (!cancelled) setSales([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const activeSales = useMemo(
    () => sales.filter((sale) => !getCountdownParts(sale.targetAt, now).expired),
    [sales, now],
  )

  const filtered = useMemo(() => {
    if (filter === 'upcoming') {
      return activeSales.filter((sale) => sale.phase === 'upcoming')
    }
    if (filter === 'live') {
      return activeSales.filter((sale) => sale.phase === 'live')
    }
    return activeSales
  }, [activeSales, filter])

  const upcomingCount = activeSales.filter((s) => s.phase === 'upcoming').length
  const liveCount = activeSales.filter((s) => s.phase === 'live').length

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative overflow-hidden bg-[#0f0a1a]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e]/90 via-[#1a0b2e]/70 to-[#0f0a1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.18),_transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to marketplace
          </Link>

          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-paec-orange uppercase">
              <Zap className="size-3.5 fill-paec-orange" />
              Flash Sales
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Limited-time{' '}
              <span className="text-paec-orange">deals</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg">
              Upcoming and live flash sale tickets with live countdown clocks.
              Grab them before time runs out.
            </p>
            {!loading ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                <Flame className="size-4 text-paec-orange" />
                {activeSales.length} flash{' '}
                {activeSales.length === 1 ? 'sale' : 'sales'}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'All', count: activeSales.length },
              { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
              { id: 'live', label: 'Live', count: liveCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                filter === tab.id
                  ? 'border-paec-violet bg-paec-violet text-white'
                  : 'border-violet-100 bg-white text-foreground hover:bg-violet-50',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  filter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-violet-100 text-paec-violet',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading flash sales…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/40 px-6 py-16 text-center">
            <Zap className="mx-auto mb-3 size-10 text-paec-orange/50" />
            <h2 className="text-lg font-semibold text-foreground">
              No flash sales right now
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon — new limited-time deals appear here when tickets
              are featured for flash sale.
            </p>
            <Button
              asChild
              className="mt-6 bg-paec-violet hover:bg-paec-violet-dark"
            >
              <Link to="/">Browse all activities</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((sale) => (
              <FlashSaleTicketCard
                key={sale.ticketId}
                sale={sale}
                now={now}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
