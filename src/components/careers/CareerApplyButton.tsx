import { CheckCircle2, FileText, Loader2, Mail, UploadCloud, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { SignInModal } from '@/components/auth/SignInModal'
import type { User } from '@/data/mockUser'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import { useStoredUser } from '@/lib/useStoredUser'
import { cn } from '@/lib/utils'
import {
  careerService,
  EMPLOYMENT_TYPE_LABELS,
  WORK_SETUP_LABELS,
  type CareerPosition,
} from '@/services/careerService'

const fieldClassName = cn(
  'h-11 w-full rounded-xl border border-violet-100 bg-violet-50/40 px-3.5 text-sm text-foreground',
  'placeholder:text-muted-foreground/60 focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)
const labelClassName = 'text-xs font-semibold text-foreground'

type ApplyForm = {
  full_name: string
  email: string
  phone: string
  salary_expectation: string
  cover_letter: string
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024
const RESUME_ACCEPT = '.pdf,.doc,.docx'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CareerApplyModal({
  open,
  position,
  user,
  onClose,
  onSuccess,
}: {
  open: boolean
  position: CareerPosition
  user: User
  onClose: () => void
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [form, setForm] = useState<ApplyForm>({
    full_name: user.name ?? '',
    email: user.email ?? '',
    phone: '',
    salary_expectation: '',
    cover_letter: '',
  })

  if (!open) return null

  const handleResumeChange = (file: File | null) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next.resume_file
      return next
    })
    if (!file) {
      setResumeFile(null)
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setErrors((prev) => ({ ...prev, resume_file: 'Resume must be a PDF, DOC, or DOCX file.' }))
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setErrors((prev) => ({ ...prev, resume_file: 'Resume must be less than 5MB.' }))
      return
    }
    setResumeFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!form.salary_expectation.trim()) {
      setErrors({ salary_expectation: 'Please write down your salary expectation.' })
      return
    }

    setSubmitting(true)
    try {
      await careerService.apply(position.uuid, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        salary_expectation: form.salary_expectation.trim(),
        resume_file: resumeFile,
        cover_letter: form.cover_letter.trim() || undefined,
      })
      toast.success(`Application submitted for ${position.title}. Good luck!`)
      onSuccess()
      onClose()
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      if (Object.keys(apiErrors).length > 0) {
        const flat: Record<string, string> = {}
        for (const [key, value] of Object.entries(apiErrors)) {
          flat[key] = Array.isArray(value) ? value[0] : value
        }
        setErrors(flat)
      } else {
        toast.error(
          getApiErrorMessage(err, 'Failed to submit application. Please try again.'),
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const meta = [
    position.department,
    position.location,
    WORK_SETUP_LABELS[position.work_setup] ?? position.work_setup,
    EMPLOYMENT_TYPE_LABELS[position.employment_type] ?? position.employment_type,
  ].filter(Boolean)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
        aria-label="Close application form"
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl">
        <div className="shrink-0 border-b border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <p className="text-[11px] font-semibold tracking-widest text-paec-orange uppercase">
            Apply for this position
          </p>
          <h2 className="mt-1 text-lg font-bold text-foreground">{position.title}</h2>
          {meta.length > 0 ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{meta.join(' · ')}</p>
          ) : null}
        </div>

        <form
          id="career-apply-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div>
            <label className={labelClassName}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoComplete="name"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Your full name"
              className={cn(fieldClassName, 'mt-1.5')}
              disabled={submitting}
            />
            {errors.full_name ? (
              <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@email.com"
                className={cn(fieldClassName, 'mt-1.5')}
                disabled={submitting}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              ) : null}
            </div>
            <div>
              <label className={labelClassName}>Phone Number</label>
              <input
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="0917 123 4567"
                className={cn(fieldClassName, 'mt-1.5')}
                disabled={submitting}
              />
              {errors.phone ? (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className={labelClassName}>Upload Resume</label>
            {resumeFile ? (
              <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 px-3.5 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-paec-violet shadow-sm">
                  <FileText className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {resumeFile.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatFileSize(resumeFile.size)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleResumeChange(null)}
                  disabled={submitting}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white hover:text-red-600 disabled:opacity-50"
                  aria-label="Remove resume"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  'mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-5 text-center transition-colors hover:border-paec-violet hover:bg-violet-50',
                  submitting && 'pointer-events-none opacity-60',
                )}
              >
                <UploadCloud className="size-6 text-paec-violet" />
                <span className="mt-2 text-sm font-semibold text-foreground">
                  Click to upload your resume
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  PDF, DOC, or DOCX · up to 5MB
                </span>
                <input
                  type="file"
                  accept={RESUME_ACCEPT}
                  className="sr-only"
                  disabled={submitting}
                  onChange={(e) => {
                    handleResumeChange(e.target.files?.[0] ?? null)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
            {errors.resume_file ? (
              <p className="mt-1 text-xs text-red-600">{errors.resume_file}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClassName}>
              Salary Expectation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.salary_expectation}
              onChange={(e) =>
                setForm((p) => ({ ...p, salary_expectation: e.target.value }))
              }
              placeholder="Write down your salary expectation (e.g. ₱30,000 / month)"
              className={cn(fieldClassName, 'mt-1.5')}
              disabled={submitting}
            />
            {errors.salary_expectation ? (
              <p className="mt-1 text-xs text-red-600">{errors.salary_expectation}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClassName}>Cover Letter / Message (optional)</label>
            <textarea
              value={form.cover_letter}
              onChange={(e) => setForm((p) => ({ ...p, cover_letter: e.target.value }))}
              rows={5}
              placeholder="Tell us briefly why you're a great fit for this role…"
              className={cn(fieldClassName, 'mt-1.5 h-auto py-2.5')}
              disabled={submitting}
            />
            {errors.cover_letter ? (
              <p className="mt-1 text-xs text-red-600">{errors.cover_letter}</p>
            ) : null}
          </div>

          <p className="rounded-lg bg-violet-50/70 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            You&apos;re applying as <span className="font-semibold text-foreground">{user.email}</span>.
            Our team will review your application and contact you for the next steps.
          </p>
        </form>

        <div className="flex shrink-0 justify-end gap-2 border-t border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold text-foreground hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="career-apply-form"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white hover:bg-paec-violet/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CareerApplyButton({
  position,
  className,
  appliedClassName,
}: {
  position: CareerPosition
  className?: string
  appliedClassName?: string
}) {
  const user = useStoredUser()
  const [signInOpen, setSignInOpen] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const [applied, setApplied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [applicant, setApplicant] = useState<User | null>(null)

  const openApplyFor = (signedInUser: User) => {
    setApplicant(signedInUser)
    setApplyOpen(true)
  }

  const handleClick = async () => {
    const currentUser = user ?? getStoredUser()
    if (!currentUser) {
      toast.info('Please sign in first to apply for this position.')
      setSignInOpen(true)
      return
    }

    setChecking(true)
    try {
      const existing = await careerService.getMyApplication(position.uuid)
      if (existing) {
        setApplied(true)
        toast.info('You have already applied for this position.')
        return
      }
    } catch {
      // If the check fails, still let the user open the form; submit is guarded server-side.
    } finally {
      setChecking(false)
    }

    openApplyFor(currentUser)
  }

  return (
    <>
      {applied ? (
        <span
          className={cn(
            'inline-flex h-10 shrink-0 cursor-default items-center gap-1.5 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white',
            appliedClassName ?? className,
          )}
        >
          <CheckCircle2 className="size-4" />
          Applied
        </span>
      ) : (
        <button
          type="button"
          onClick={() => void handleClick()}
          disabled={checking}
          className={cn(
            'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-paec-violet px-5 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:opacity-60',
            className,
          )}
        >
          {checking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Mail className="size-4" />
          )}
          Apply Now
        </button>
      )}

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSuccess={() => {
          setSignInOpen(false)
          const signedInUser = getStoredUser()
          if (signedInUser) openApplyFor(signedInUser)
        }}
      />

      {applyOpen && applicant ? (
        <CareerApplyModal
          open={applyOpen}
          position={position}
          user={applicant}
          onClose={() => setApplyOpen(false)}
          onSuccess={() => setApplied(true)}
        />
      ) : null}
    </>
  )
}
