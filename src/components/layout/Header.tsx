import { Link } from '@tanstack/react-router'
import { Search, Ticket } from 'lucide-react'
import { useState } from 'react'

import { SignInModal } from '@/components/auth/SignInModal'
import { AccountDropdown } from '@/components/layout/AccountDropdown'
import { Button } from '@/components/ui/button'
import type { User } from '@/data/mockUser'
import { getStoredUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function Header() {
  const [signInOpen, setSignInOpen] = useState(false)
  const [user, setUser] = useState<User | null>(() => getStoredUser())

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-violet-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0">
            <img
              src="/Paec-Logo.png"
              alt="PAEC"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="mx-auto hidden max-w-xl flex-1 md:block">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search attractions..."
                className={cn(
                  'h-10 w-full rounded-full border border-violet-100 bg-violet-50/50 pr-4 pl-10 text-sm',
                  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
                )}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                to="/account"
                search={{ section: 'tickets' }}
                className="flex size-9 items-center justify-center rounded-full border border-violet-100 bg-violet-50/50 text-paec-violet transition-colors hover:bg-violet-50 sm:hidden"
                aria-label="My Tickets"
              >
                <Ticket className="size-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="flex size-9 items-center justify-center rounded-full border border-violet-100 bg-violet-50/50 text-paec-violet transition-colors hover:bg-violet-50 sm:hidden"
                aria-label="My Tickets"
              >
                <Ticket className="size-4" />
              </button>
            )}

            <Link
              to="/account"
              search={{ section: 'tickets' }}
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-violet-50 sm:flex"
            >
              <Ticket className="size-4 text-paec-violet" />
              My Tickets
            </Link>

            {user ? (
              <AccountDropdown
                user={user}
                onSignedOut={() => setUser(null)}
              />
            ) : (
              <Button
                onClick={() => setSignInOpen(true)}
                className="rounded-full bg-paec-violet px-5 hover:bg-paec-violet-dark"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSuccess={() => setUser(getStoredUser())}
      />
    </>
  )
}
