import { Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  Globe,
  Plus,
  Ticket,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import type { AdminUser } from '@/lib/adminAuth'
import { getApiErrorMessage } from '@/lib/api'
import { resolveImageUrl } from '@/lib/imageUtils'
import {
  adminDashboardService,
  type DashboardActivity,
} from '@/services/adminDashboardService'
import {
  activityService,
  type ApiEvent,
  type DashboardStats,
  type FunStats,
} from '@/services/activityService'

type AdminDashboardHomeProps = {
  user: AdminUser
}

function buildStatCards(
  dashboardStats: DashboardStats | null,
  funStats: FunStats | null,
) {
  return [
    {
      label: 'Total Attractions',
      value: dashboardStats ? String(dashboardStats.total_events) : '—',
      icon: Calendar,
      iconClass: 'bg-violet-100 text-paec-violet',
    },
    {
      label: 'Published',
      value: funStats ? String(funStats.total_published) : '—',
      icon: Globe,
      iconClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Tickets Sold',
      value: dashboardStats ? String(dashboardStats.tickets_sold) : '—',
      icon: Ticket,
      iconClass: 'bg-orange-100 text-paec-orange',
    },
    {
      label: 'Total Revenue',
      value: dashboardStats
        ? `₱${dashboardStats.total_revenue.toFixed(2)}`
        : '—',
      icon: Banknote,
      iconClass: 'bg-amber-100 text-amber-600',
    },
  ]
}

function formatBookingCustomer(user: DashboardActivity['data']['user']) {
  if (!user) {
    return { name: 'Guest', email: '' }
  }

  const name = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  return {
    name: name || user.full_name?.trim() || 'Guest',
    email: user.email ?? '',
  }
}

function getEventImage(event: ApiEvent): string {
  return (
    resolveImageUrl(event.featured_image?.url) ||
    resolveImageUrl(event.portrait_image?.url) ||
    ''
  )
}

export function AdminDashboardHome({ user }: AdminDashboardHomeProps) {
  const firstName = user.name.split(' ')[0]
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  )
  const [funStats, setFunStats] = useState<FunStats | null>(null)
  const [activeAttractions, setActiveAttractions] = useState<ApiEvent[]>([])
  const [recentBookings, setRecentBookings] = useState<DashboardActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      try {
        const [stats, fun, attractions, activities] = await Promise.all([
          activityService.getDashboardStats(),
          activityService.getFunStats(),
          activityService.listPublishedAmusements(3),
          adminDashboardService.getRecentActivities(),
        ])

        if (cancelled) return

        setDashboardStats(stats)
        setFunStats(fun)
        setActiveAttractions(attractions)
        setRecentBookings(
          activities.filter((activity) => activity.type === 'purchase').slice(0, 5),
        )
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load dashboard.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const statCards = buildStatCards(dashboardStats, funStats)

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-paec-violet via-[#9333ea] to-paec-orange p-6 sm:p-8">
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="mt-1 text-sm text-white/85 sm:text-base">
          Here&apos;s what&apos;s happening with your attractions today.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {loading ? '…' : stat.value}
                  </p>
                </div>
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${stat.iconClass}`}
                >
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <p className="mb-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Quick Actions
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/admin/activities/create"
            className="flex items-center justify-center gap-2 rounded-xl bg-paec-violet px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark"
          >
            <Plus className="size-4" />
            Create New Attraction
          </Link>
          <Link
            to="/admin/activities"
            className="flex items-center justify-center gap-2 rounded-xl bg-paec-orange px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-paec-orange-light"
          >
            <Calendar className="size-4" />
            Manage Activities
          </Link>
          <Link
            to="/admin/intelligence"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-paec-violet to-paec-orange px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <ArrowUpRight className="size-4" />
            View Analytics
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Active Attractions
            </h2>
            <Link
              to="/admin/activities"
              className="inline-flex items-center gap-1 text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
            >
              View all
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading attractions...
            </p>
          ) : activeAttractions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No published attractions yet
            </p>
          ) : (
            <ul className="space-y-3">
              {activeAttractions.map((attraction) => (
                <li key={attraction.uuid}>
                  <Link
                    to="/attractions/$attractionId"
                    params={{ attractionId: attraction.slug }}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-violet-50/60"
                  >
                    <div className="size-11 shrink-0 overflow-hidden rounded-full">
                      <ImageWithFallback
                        src={getEventImage(attraction)}
                        alt={attraction.event_name}
                        className="size-full object-cover"
                        fallbackClassName="size-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {attraction.event_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {attraction.address}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-paec-orange">
                      {attraction.price_start != null
                        ? `₱${Number(attraction.price_start).toLocaleString()}`
                        : '—'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Recent Transactions
            </h2>
            <Link
              to="/admin/transaction"
              className="inline-flex items-center gap-1 text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
            >
              View all
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading bookings...
            </p>
          ) : recentBookings.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-violet-100 bg-violet-50/30 px-6 py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No bookings yet
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentBookings.map((booking) => {
                const eventName =
                  booking.data.event?.event_name ??
                  booking.data.event?.name ??
                  'Event'
                const customer = formatBookingCustomer(booking.data.user)
                const amount = Number(booking.data.total_amount ?? 0)

                return (
                  <li
                    key={booking.data.uuid ?? booking.timestamp}
                    className="rounded-xl border border-violet-50 bg-violet-50/30 p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {customer.name}
                    </p>
                    {customer.email ? (
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {eventName}
                      {booking.data.order_number
                        ? ` · ${booking.data.order_number}`
                        : ''}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-paec-orange">
                        ₱{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(booking.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
