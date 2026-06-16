import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'

import type { AdminUser } from '@/lib/adminAuth'

type AdminHeaderProps = {
  user: AdminUser
  onMenuClick?: () => void
}

export function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-violet-100 bg-white px-3 py-3 sm:gap-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-violet-100 text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground sm:text-base">
        Welcome back,{' '}
        <span className="font-semibold text-foreground">{user.name}</span>
      </p>

      <div className="flex shrink-0 items-center">
        <Link
          to="/"
          className="rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-paec-violet transition-colors hover:bg-violet-100 sm:px-4 sm:text-sm"
        >
          <span className="sm:hidden">View Site</span>
          <span className="hidden sm:inline">— Customer View</span>
        </Link>
      </div>
    </header>
  )
}
