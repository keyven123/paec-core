import { Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { signIn, signUp } from '@/lib/auth'
import { cn } from '@/lib/utils'

type AuthMode = 'signin' | 'signup'

type SignInModalProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialMode?: AuthMode
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  )
}

const emptySignUpForm = {
  firstName: '',
  lastName: '',
  address: '',
  phoneNumber: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  termsAccepted: false,
}

export function SignInModal({
  open,
  onClose,
  onSuccess,
  initialMode = 'signin',
}: SignInModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [signUpForm, setSignUpForm] = useState(emptySignUpForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) setMode(initialMode)
  }, [open, initialMode])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const handleSocialClick = (provider: string) => {
    toast.info(`${provider} sign-in is coming soon.`)
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password.')
      return
    }

    setIsSubmitting(true)
    try {
      await signIn(email, password)
      onClose()
      onSuccess?.()
      toast.success('Welcome back!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()

    if (!signUpForm.termsAccepted) {
      toast.error('Please agree to the terms and conditions.')
      return
    }

    setIsSubmitting(true)
    try {
      await signUp({
        firstName: signUpForm.firstName,
        lastName: signUpForm.lastName,
        address: signUpForm.address,
        phoneNumber: signUpForm.phoneNumber,
        email: signUpForm.email,
        password: signUpForm.password,
        passwordConfirmation: signUpForm.passwordConfirmation,
        termsAccepted: signUpForm.termsAccepted,
      })
      setSignUpForm(emptySignUpForm)
      onClose()
      onSuccess?.()
      toast.success('Account created successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign up failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  const isSignUp = mode === 'signup'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close auth modal"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl',
          isSignUp ? 'max-w-lg' : 'max-w-md',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        <div className="max-h-[90vh] overflow-y-auto px-6 pt-8 pb-6 sm:px-8">
          <div className="flex flex-col items-center">
            <img
              src="/Paec-Logo.png"
              alt="PAEC"
              className="h-10 w-auto object-contain"
            />
            <h2
              id="auth-modal-title"
              className="mt-5 text-2xl font-bold text-foreground"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {isSignUp
                ? 'Join PAEC to book tickets and manage your experiences.'
                : 'Welcome back to PAEC marketplace.'}
            </p>
          </div>

          {!isSignUp ? (
            <>
              <div className="mt-6 space-y-3">
                <SocialButton
                  icon={<GoogleIcon className="size-5" />}
                  label="Sign in with Google"
                  onClick={() => handleSocialClick('Google')}
                />
                <SocialButton
                  icon={<FacebookIcon className="size-5" />}
                  label="Sign in with Facebook"
                  onClick={() => handleSocialClick('Facebook')}
                />
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-violet-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-muted-foreground lowercase">
                    or
                  </span>
                </div>
              </div>
            </>
          ) : null}

          {isSignUp ? (
            <form onSubmit={handleSignUp} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First Name">
                  <input
                    type="text"
                    autoComplete="given-name"
                    value={signUpForm.firstName}
                    onChange={(e) =>
                      setSignUpForm((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    placeholder="Juan"
                    className={inputClassName}
                    required
                  />
                </Field>
                <Field label="Last Name">
                  <input
                    type="text"
                    autoComplete="family-name"
                    value={signUpForm.lastName}
                    onChange={(e) =>
                      setSignUpForm((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    placeholder="Dela Cruz"
                    className={inputClassName}
                    required
                  />
                </Field>
              </div>

              <Field label="Address">
                <input
                  type="text"
                  autoComplete="street-address"
                  value={signUpForm.address}
                  onChange={(e) =>
                    setSignUpForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Street, city, province"
                  className={inputClassName}
                  required
                />
              </Field>

              <Field label="Mobile Number">
                <input
                  type="tel"
                  autoComplete="tel"
                  value={signUpForm.phoneNumber}
                  onChange={(e) =>
                    setSignUpForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                  }
                  placeholder="09171234567"
                  className={inputClassName}
                  required
                />
              </Field>

              <Field label="Email Address">
                <input
                  type="email"
                  autoComplete="email"
                  value={signUpForm.email}
                  onChange={(e) =>
                    setSignUpForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="you@email.com"
                  className={inputClassName}
                  required
                />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={signUpForm.password}
                    onChange={(e) =>
                      setSignUpForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Min. 8 characters"
                    className={cn(inputClassName, 'pr-12')}
                    required
                  />
                  <PasswordToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Use 8+ characters with uppercase, number, and special character.
                </p>
              </Field>

              <Field label="Confirm Password">
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={signUpForm.passwordConfirmation}
                    onChange={(e) =>
                      setSignUpForm((prev) => ({
                        ...prev,
                        passwordConfirmation: e.target.value,
                      }))
                    }
                    placeholder="Re-enter password"
                    className={cn(inputClassName, 'pr-12')}
                    required
                  />
                  <PasswordToggle
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((v) => !v)}
                  />
                </div>
              </Field>

              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={signUpForm.termsAccepted}
                  onChange={(e) =>
                    setSignUpForm((prev) => ({
                      ...prev,
                      termsAccepted: e.target.checked,
                    }))
                  }
                  className="mt-0.5 size-4 rounded border-violet-200 text-paec-violet focus:ring-paec-violet/30"
                  required
                />
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    className="font-medium text-paec-orange transition-colors hover:text-paec-orange-light"
                    onClick={() => toast.info('Terms and conditions page coming soon.')}
                  >
                    terms and conditions
                  </button>
                </span>
              </label>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-paec-violet text-sm font-bold tracking-wide uppercase hover:bg-paec-violet-dark"
              >
                {isSubmitting ? 'Creating account…' : 'Sign Up'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => switchMode('signin')}
                className="h-12 w-full rounded-xl border-violet-200 text-sm font-bold tracking-wide text-foreground uppercase hover:bg-violet-50"
              >
                Back to Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className={inputClassName}
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={cn(inputClassName, 'pr-12')}
                />
                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-foreground">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-violet-200 text-paec-violet focus:ring-paec-violet/30"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="font-medium text-paec-orange transition-colors hover:text-paec-orange-light"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-paec-violet text-sm font-bold tracking-wide uppercase hover:bg-paec-violet-dark"
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 w-full rounded-xl border-violet-200 text-sm font-bold tracking-wide text-foreground uppercase hover:bg-violet-50"
              >
                Cancel
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-semibold text-paec-orange transition-colors hover:text-paec-orange-light"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Sign up for an account{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-paec-orange transition-colors hover:text-paec-orange-light"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

const inputClassName = cn(
  'h-12 w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 text-sm text-foreground',
  'placeholder:text-muted-foreground/60',
  'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

type FieldProps = {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground">{label}</span>
      {children}
    </label>
  )
}

type PasswordToggleProps = {
  visible: boolean
  onToggle: () => void
}

function PasswordToggle({ visible, onToggle }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      aria-label={visible ? 'Hide password' : 'Show password'}
    >
      {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  )
}

type SocialButtonProps = {
  icon: ReactNode
  label: string
  onClick: () => void
}

function SocialButton({ icon, label, onClick }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-violet-100 bg-white text-sm font-medium text-foreground transition-colors hover:bg-violet-50/50"
    >
      {icon}
      <span>{label}</span>
      <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-paec-violet uppercase">
        Coming Soon
      </span>
    </button>
  )
}
