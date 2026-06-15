import { Link } from '@tanstack/react-router'

import type { AdminUser } from '@/lib/adminAuth'

type AdminHeaderProps = {
  user: AdminUser
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-violet-100 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <p className="truncate text-sm text-muted-foreground sm:text-base">
        Welcome back,{' '}
        <span className="font-semibold text-foreground">{user.name}</span>
      </p>

      <div className="flex shrink-0 items-center gap-3">
        <Link
          to="/"
          className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-paec-violet transition-colors hover:bg-violet-100 sm:text-sm"
        >
          — Customer View
        </Link>
      </div>
    </header>
  )
}
