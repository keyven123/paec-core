import { Link } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import { useState } from 'react'

import { SignInModal } from '@/components/auth/SignInModal'
import { AccountDropdown } from '@/components/layout/AccountDropdown'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { MobileHeaderSearch } from '@/components/layout/MobileHeaderSearch'
import { Button } from '@/components/ui/button'
import type { User } from '@/data/mockUser'
import { getStoredUser } from '@/lib/auth'

export function Header() {
  const [signInOpen, setSignInOpen] = useState(false)
  const [user, setUser] = useState<User | null>(() => getStoredUser())

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-violet-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-3 sm:gap-4">
            <Link to="/" className="shrink-0">
              <img
                src="/Paec-Logo.png"
                alt="PAEC"
                className="h-9 w-auto object-contain sm:h-10"
              />
            </Link>

            <div className="mx-auto hidden max-w-4xl flex-1 xl:block">
              <HeaderSearch />
            </div>

            <MobileHeaderSearch className="mx-auto hidden w-full max-w-xl flex-1 md:flex xl:hidden" />

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:ml-0">
              <Link
                to="/pages/$slug"
                params={{ slug: 'about-us' }}
                aria-label="About Us"
                className="flex size-10 items-center justify-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/50 text-sm font-medium text-foreground transition-colors hover:bg-violet-50 md:size-auto md:border-transparent md:bg-transparent md:px-3 md:py-2"
              >
                <Info className="size-4 text-paec-violet" />
                <span className="hidden md:inline">About Us</span>
              </Link>

              {user ? (
                <AccountDropdown
                  user={user}
                  onSignedOut={() => setUser(null)}
                />
              ) : (
                <Button
                  onClick={() => setSignInOpen(true)}
                  className="rounded-full bg-paec-violet px-4 hover:bg-paec-violet-dark sm:px-5"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          <div className="pb-3 md:hidden">
            <MobileHeaderSearch className="h-11 w-full" />
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
