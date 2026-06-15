import { Link, useRouterState } from '@tanstack/react-router'
import {
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Tag,
  Users,
} from 'lucide-react'

import type { AdminUser } from '@/lib/adminAuth'
import { cn } from '@/lib/utils'

type AdminSidebarProps = {
  user: AdminUser
  onSignOut: () => void
}

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/transaction', label: 'Transactions', icon: CreditCard },
  { to: '/admin/activities', label: 'Activities', icon: Calendar },
  { to: '/admin/promocode', label: 'Promo Codes', icon: Tag },
  { to: '/admin/usermanagement', label: 'User Management', icon: Users },
  { to: '/admin/intelligence', label: 'Intelligence', icon: BarChart3 },
  { to: '/admin/cms', label: 'Content Management', icon: FileText },
] as const

export function AdminSidebar({ user, onSignOut }: AdminSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-violet-100 bg-white lg:h-dvh lg:w-64">
      <div className="shrink-0 border-b border-violet-50 px-5 py-4">
        <Link to="/admin/dashboard">
          <img
            src="/Paec-Logo.png"
            alt="PAEC"
            className="h-8 w-auto object-contain"
          />
        </Link>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.to ||
            (item.to === '/admin/activities' &&
              pathname.startsWith('/admin/activities')) ||
            (item.to === '/admin/usermanagement' &&
              pathname.startsWith('/admin/usermanagement')) ||
            (item.to === '/admin/intelligence' &&
              pathname.startsWith('/admin/intelligence')) ||
            (item.to === '/admin/cms' && pathname.startsWith('/admin/cms'))

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-paec-violet text-white shadow-sm shadow-paec-violet/20'
                  : 'text-foreground hover:bg-violet-50',
              )}
            >
              <Icon
                className={cn(
                  'size-4 shrink-0',
                  isActive ? 'text-white' : 'text-muted-foreground',
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-violet-50 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paec-violet text-xs font-bold text-white">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
