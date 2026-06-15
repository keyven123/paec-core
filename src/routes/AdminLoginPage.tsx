import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { isAdminAuthenticated, signInAdmin } from '@/lib/adminAuth'
import { cn } from '@/lib/utils'

const stats = [
  { value: '500+', label: 'Attractions' },
  { value: '50K+', label: 'Customers' },
  { value: '₱2M+', label: 'Transactions' },
]

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@paec.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate({ to: '/admin/dashboard' })
    }
  }, [navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password.')
      return
    }

    setIsSubmitting(true)
    try {
      await signInAdmin(email, password)
      toast.success('Welcome to the admin portal!')
      navigate({ to: '/admin/dashboard' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — login form */}
      <div className="flex w-full flex-col bg-white lg:w-1/2">
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            <img
              src="/Paec-Logo.png"
              alt="PAEC"
              className="h-12 w-auto object-contain"
            />

            <span className="mt-5 inline-flex rounded-full bg-gradient-to-r from-paec-orange to-paec-orange-light px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
              Admin
            </span>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
              Sign In
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please sign in to your admin account.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@paec.com"
                  className={cn(
                    'h-12 w-full rounded-xl border border-violet-100 bg-white px-4 text-sm text-foreground',
                    'placeholder:text-muted-foreground/60',
                    'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
                  )}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(
                      'h-12 w-full rounded-xl border border-violet-100 bg-white pr-12 pl-4 text-sm text-foreground',
                      'placeholder:text-muted-foreground/60',
                      'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-paec-violet to-paec-violet-dark text-base font-semibold shadow-lg shadow-paec-violet/25 hover:from-paec-violet-dark hover:to-paec-violet-dark"
              >
                {isSubmitting ? 'Signing in…' : 'Continue'}
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-violet-50 px-6 py-6 sm:px-12 lg:px-16 xl:px-24">
          <div className="mx-auto flex w-full max-w-md flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to main site
            </Link>
            <p className="text-xs text-muted-foreground/70">
              Copyright © PAEC Admin Portal. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right — marketing panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-paec-violet via-[#9333ea] to-paec-orange lg:flex lg:w-1/2 lg:flex-col lg:justify-center">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 size-48 rounded-full bg-paec-orange/20 blur-2xl" />

        <div className="relative px-12 py-16 xl:px-20">
          <h2 className="text-3xl leading-tight font-bold text-white xl:text-4xl">
            Welcome to Admin{' '}
            <span className="text-paec-orange">Portal</span>
          </h2>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85">
            Manage attractions, track bookings, and oversee platform operations
            from one powerful dashboard built for the Philippine entertainment
            ecosystem.
          </p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65">
            Join hundreds of venues and experience providers already growing
            their business with PAEC.
          </p>

          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-white/20 pt-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white xl:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
