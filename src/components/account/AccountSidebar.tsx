import {
  ArrowLeftRight,
  LogOut,
  Star,
  Tag,
  Ticket,
  User,
} from 'lucide-react'

import type { User as AccountUser } from '@/data/mockUser'
import { cn } from '@/lib/utils'

export type AccountSection =
  | 'tickets'
  | 'coupons'
  | 'transactions'
  | 'profile'

type AccountSidebarProps = {
  user: AccountUser
  activeSection: AccountSection
  onSectionChange: (section: AccountSection) => void
  onSignOut: () => void
}

const navItems: {
  id: AccountSection
  label: string
  icon: typeof Ticket
  badge?: number
}[] = [
  { id: 'tickets', label: 'My Tickets', icon: Ticket },
  { id: 'coupons', label: 'My Coupons', icon: Tag },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'profile', label: 'Profile', icon: User },
]

export function AccountSidebar({
  user,
  activeSection,
  onSectionChange,
  onSignOut,
}: AccountSidebarProps) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="bg-paec-violet px-5 py-6">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-paec-orange text-sm font-bold text-white">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-white/75">{user.email}</p>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-paec-orange px-2.5 py-1 text-[11px] font-semibold text-white">
          <Star className="size-3 fill-white" />
          {user.badge}
        </div>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-paec-orange-light transition-all"
            style={{ width: `${user.levelProgress}%` }}
          />
        </div>
      </div>

      <nav className="p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-violet-50 text-paec-violet'
                      : 'text-foreground hover:bg-violet-50/60',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4 shrink-0',
                      isActive ? 'text-paec-violet' : 'text-muted-foreground',
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-3 border-t border-violet-100 pt-3">
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50/60 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}
