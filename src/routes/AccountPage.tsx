import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Tag } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AccountPlaceholderSection } from '@/components/account/AccountPlaceholderSection'
import { AccountSidebar } from '@/components/account/AccountSidebar'
import { MyTransactionsSection } from '@/components/account/MyTransactionsSection'
import { MyTicketsSection } from '@/components/account/MyTicketsSection'
import { ProfileSection } from '@/components/account/ProfileSection'
import type { User } from '@/data/mockUser'
import { getStoredUser, isCustomerAuthenticated, signOut } from '@/lib/auth'

export function AccountPage() {
  const navigate = useNavigate()
  const { section } = useSearch({ from: '/account' })
  const [user] = useState<User | null>(() => getStoredUser())

  useEffect(() => {
    if (!isCustomerAuthenticated()) {
      navigate({ to: '/' })
    }
  }, [navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-violet-50/30">
      <header className="border-b border-violet-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/">
            <img
              src="/Paec-Logo.png"
              alt="PAEC"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <AccountSidebar
            user={user}
            activeSection={section}
            onSectionChange={(next) =>
              navigate({ to: '/account', search: { section: next } })
            }
            onSignOut={handleSignOut}
          />

          <section className="min-w-0">
            {section === 'tickets' && <MyTicketsSection />}
            {section === 'coupons' && (
              <AccountPlaceholderSection
                title="My"
                highlight="coupons"
                description="Your saved deals and promo codes."
                icon={Tag}
              />
            )}
            {section === 'transactions' && <MyTransactionsSection />}
            {section === 'profile' && <ProfileSection user={user} />}
          </section>
        </div>
      </main>
    </div>
  )
}
