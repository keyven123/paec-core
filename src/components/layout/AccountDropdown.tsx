import { Link } from '@tanstack/react-router'
import { ChevronDown, LogOut, Ticket, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { User as AccountUser } from '@/data/mockUser'
import { signOut } from '@/lib/auth'
import { cn } from '@/lib/utils'

type AccountDropdownProps = {
  user: AccountUser
  onSignedOut: () => void
}

const menuItems = [
  { label: 'My Tickets', section: 'tickets' as const, icon: Ticket },
  { label: 'Profile', section: 'profile' as const, icon: User },
]

export function AccountDropdown({ user, onSignedOut }: AccountDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    onSignedOut()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50/50 py-1.5 pr-2 pl-1.5 transition-colors hover:bg-violet-50',
          open && 'border-paec-violet/30 bg-violet-50 ring-2 ring-paec-violet/20',
        )}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-paec-orange text-xs font-bold text-white">
          {user.initials}
        </span>
        <span className="hidden text-sm font-medium text-foreground sm:inline">
          Account
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-violet-100 bg-white py-1 shadow-lg shadow-violet-100/50"
        >
          <div className="border-b border-violet-50 px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.section}
                to="/account"
                search={{ section: item.section }}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-violet-50"
              >
                <Icon className="size-4 text-paec-violet" />
                {item.label}
              </Link>
            )
          })}

          <div className="mt-1 border-t border-violet-50 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
