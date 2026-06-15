import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './styles.css'
import type { AccountSection } from './components/account/AccountSidebar'
import { AccountPage } from './routes/AccountPage'

const accountSections: AccountSection[] = [
  'tickets',
  'coupons',
  'transactions',
  'profile',
]

function parseAccountSection(value: unknown): AccountSection {
  return accountSections.includes(value as AccountSection)
    ? (value as AccountSection)
    : 'tickets'
}
import { AdminActivitiesPage } from './routes/admin/AdminActivitiesPage'
import { AdminActivityDetailPage } from './routes/admin/AdminActivityDetailPage'
import { AdminActivityScannerPage } from './routes/admin/AdminActivityScannerPage'
import { AdminActivityCalendarPage } from './routes/admin/AdminActivityCalendarPage'
import { AdminActivityTicketsPage } from './routes/admin/AdminActivityTicketsPage'
import { AdminCmsPage } from './routes/admin/AdminCmsPage'
import { AdminCreateActivityPage } from './routes/admin/AdminCreateActivityPage'
import { AdminEditActivityPage } from './routes/admin/AdminEditActivityPage'
import { AdminDashboardRoute } from './routes/admin/AdminDashboardRoute'
import { AdminIntelligencePage } from './routes/admin/AdminIntelligencePage'
import { AdminLayout } from './routes/admin/AdminLayout'
import { AdminPromoCodePage } from './routes/admin/AdminPromoCodePage'
import { AdminTransactionPage } from './routes/admin/AdminTransactionPage'
import { AdminUserDetailPage } from './routes/admin/AdminUserDetailPage'
import { AdminUserManagementPage } from './routes/admin/AdminUserManagementPage'
import { AdminUserStatsPage } from './routes/admin/AdminUserStatsPage'
import { AdminLoginPage } from './routes/AdminLoginPage'
import { AttractionDetailPage } from './routes/AttractionDetailPage'
import { CheckoutPage } from './routes/CheckoutPage'
import { HomePage } from './routes/HomePage'
import { InfoPage } from './routes/InfoPage'
import { Toaster } from './components/ui/toast'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const attractionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/attractions/$attractionId',
  component: AttractionDetailPage,
})

const infoPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pages/$slug',
  component: InfoPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: CheckoutPage,
})

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  component: AdminLoginPage,
})

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin-layout',
  component: AdminLayout,
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/dashboard',
  component: AdminDashboardRoute,
})

const adminTransactionRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/transaction',
  component: AdminTransactionPage,
})

const adminActivitiesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/activities',
  component: AdminActivitiesPage,
})

const adminCreateActivityRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/activities/create',
  component: AdminCreateActivityPage,
})

const adminActivityDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/activities/$activityId',
  component: AdminActivityDetailPage,
})

const adminEditActivityRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/activities/$activityId/edit',
  component: AdminEditActivityPage,
})

const adminActivityScannerRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/activities/$activityId/scanner',
  component: AdminActivityScannerPage,
})

const adminActivityTicketsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/activities/$activityId/tickets',
  component: AdminActivityTicketsPage,
})

const adminActivityCalendarRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/activities/$activityId/calendar',
  component: AdminActivityCalendarPage,
})

const adminPromoCodeRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/promocode',
  component: AdminPromoCodePage,
})

const adminUserManagementRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/usermanagement',
  component: AdminUserManagementPage,
})

const adminUserDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/usermanagement/$userUuid',
  component: AdminUserDetailPage,
})

const adminUserStatsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/usermanagement/$userUuid/stats',
  component: AdminUserStatsPage,
})

const adminCmsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/cms',
  component: AdminCmsPage,
})

const adminIntelligenceRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/intelligence',
  component: AdminIntelligencePage,
})

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  validateSearch: (search: Record<string, unknown>) => ({
    section: parseAccountSection(search.section),
  }),
  component: AccountPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  attractionRoute,
  infoPageRoute,
  checkoutRoute,
  adminLoginRoute,
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminTransactionRoute,
    adminActivitiesRoute,
    adminCreateActivityRoute,
    adminActivityDetailRoute,
    adminEditActivityRoute,
    adminActivityScannerRoute,
    adminActivityTicketsRoute,
    adminActivityCalendarRoute,
    adminPromoCodeRoute,
    adminUserManagementRoute,
    adminUserDetailRoute,
    adminUserStatsRoute,
    adminIntelligenceRoute,
    adminCmsRoute,
  ]),
  accountRoute,
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
})

const rootElement = document.getElementById('app')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>,
  )
}
