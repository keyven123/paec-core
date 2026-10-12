import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  User,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type { FormEvent, InputHTMLAttributes } from 'react'

import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { getStoredUser, isCustomerAuthenticated } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { venueListingService } from '@/services/venueListingService'

type InquiryForm = {
  firstName: string
  lastName: string
  mobile: string
  email: string
  eventDate: string
  pax: string
}

type InquiryErrors = Partial<Record<keyof InquiryForm, string>>

const API_FIELD_MAP: Partial<Record<string, keyof InquiryForm>> = {
  full_name: 'firstName',
  phone: 'mobile',
  email: 'email',
  event_date: 'eventDate',
  guest_count: 'pax',
}

const PH_MOBILE_PATTERN = /^(?:\+?63|0)9\d{9}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function formatLongDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function initialForm(): InquiryForm {
  const user = isCustomerAuthenticated() ? getStoredUser() : null
  const [firstName = '', ...rest] = user?.name.trim().split(/\s+/) ?? []
  return {
    firstName,
    lastName: rest.join(' '),
    mobile: '',
    email: user?.email ?? '',
    eventDate: '',
    pax: '',
  }
}

function validate(
  form: InquiryForm,
  maxCapacity: number | null,
  unavailableDates: Map<string, string>,
): InquiryErrors {
  const errors: InquiryErrors = {}
  if (!form.firstName.trim()) errors.firstName = 'First name is required.'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.'

  const mobile = form.mobile.replace(/[\s()-]/g, '')
  if (!mobile) errors.mobile = 'Mobile number is required.'
  else if (!PH_MOBILE_PATTERN.test(mobile)) errors.mobile = 'Enter a valid mobile number, e.g. 0917 123 4567.'

  if (!form.email.trim()) errors.email = 'Email address is required.'
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.'

  const unavailableReason = unavailableDates.get(form.eventDate)
  if (!form.eventDate) errors.eventDate = 'Event date is required.'
  else if (form.eventDate < todayIso()) errors.eventDate = 'Choose a date from today onwards.'
  else if (unavailableReason)
    errors.eventDate = `This date is not available (${unavailableReason}). Please choose another date.`

  const pax = Number(form.pax)
  if (!form.pax.trim()) errors.pax = 'Number of guests is required.'
  else if (!Number.isInteger(pax) || pax < 1) errors.pax = 'Enter at least 1 guest.'
  else if (maxCapacity && pax > maxCapacity) errors.pax = `This venue fits up to ${maxCapacity.toLocaleString()} guests.`

  return errors
}

type VenueInquirySidebarProps = {
  slug: string
  venueName: string
  startingPrice: number
  maxCapacity: number | null
  respondsIn: string | null
}

export function VenueInquirySidebar({
  slug,
  venueName,
  startingPrice,
  maxCapacity,
  respondsIn,
}: VenueInquirySidebarProps) {
  const [form, setForm] = useState<InquiryForm>(initialForm)
  const [errors, setErrors] = useState<InquiryErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [unavailableDates, setUnavailableDates] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    let cancelled = false
    venueListingService
      .listPublicUnavailableDates(slug)
      .then((dates) => {
        if (!cancelled) setUnavailableDates(new Map(dates.map((d) => [d.blocked_date, d.reason])))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [slug])

  const update = (field: keyof InquiryForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'eventDate') {
      const reason = unavailableDates.get(value)
      setErrors((current) => ({
        ...current,
        eventDate: reason
          ? `This date is not available (${reason}). Please choose another date.`
          : undefined,
      }))
      return
    }
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(form, maxCapacity, unavailableDates)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please complete the highlighted fields.')
      return
    }

    setSubmitting(true)
    try {
      await venueListingService.submitInquiry(slug, {
        full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim(),
        phone: form.mobile.replace(/[\s()-]/g, ''),
        guest_count: Number(form.pax),
        event_date: form.eventDate,
      })
      setSentTo(form.email.trim())
      toast.success('Inquiry sent. The venue team will contact you soon.')
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      const mapped: InquiryErrors = {}
      for (const [key, messages] of Object.entries(apiErrors)) {
        const field = API_FIELD_MAP[key]
        if (field) mapped[field] = Array.isArray(messages) ? messages[0] : messages
      }
      setErrors(mapped)
      toast.error(getApiErrorMessage(err, 'Failed to send your inquiry. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <aside className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg">
      <div className="bg-paec-violet px-5 py-4 text-white">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <MessageSquareText className="size-3.5" />
          Get Inquire
        </div>
        <p className="mt-1 text-lg leading-snug font-semibold">{venueName}</p>
        {startingPrice > 0 ? (
          <p className="mt-1 text-sm text-white/80">
            From <span className="font-semibold text-white">₱{startingPrice.toLocaleString()}</span> / event
          </p>
        ) : null}
      </div>

      {sentTo ? (
        <div className="flex flex-col items-center px-5 py-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-7" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-foreground">Inquiry sent</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Thank you, {form.firstName.trim()}. The venue team will reach out to you at{' '}
            <span className="font-medium text-foreground">{sentTo}</span>
            {respondsIn ? ` within ${respondsIn}` : ''}.
          </p>
          <button
            type="button"
            onClick={() => {
              setSentTo(null)
              setForm((current) => ({ ...current, eventDate: '', pax: '' }))
            }}
            className="mt-5 text-sm font-semibold text-paec-violet transition-colors hover:text-paec-violet-dark"
          >
            Send another inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            Tell us about your event and the venue team will get back to you with availability and a quote.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <InquiryField
              label="First name"
              icon={User}
              error={errors.firstName}
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              placeholder="Juan"
              autoComplete="given-name"
              maxLength={120}
            />
            <InquiryField
              label="Last name"
              error={errors.lastName}
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              placeholder="Dela Cruz"
              autoComplete="family-name"
              maxLength={120}
            />
          </div>

          <InquiryField
            label="Mobile number"
            icon={Phone}
            error={errors.mobile}
            type="tel"
            inputMode="tel"
            value={form.mobile}
            onChange={(e) => update('mobile', e.target.value)}
            placeholder="0917 123 4567"
            autoComplete="tel"
            maxLength={20}
          />

          <InquiryField
            label="Email address"
            icon={Mail}
            error={errors.email}
            type="email"
            inputMode="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={255}
          />

          <InquiryField
            label="Event date"
            icon={CalendarDays}
            error={errors.eventDate}
            hint={form.eventDate ? formatLongDate(form.eventDate) : undefined}
            type="date"
            min={todayIso()}
            value={form.eventDate}
            onChange={(e) => update('eventDate', e.target.value)}
          />

          <InquiryField
            label="Number of guests (pax)"
            icon={Users}
            error={errors.pax}
            hint={maxCapacity ? `Up to ${maxCapacity.toLocaleString()} guests` : undefined}
            type="number"
            inputMode="numeric"
            min={1}
            value={form.pax}
            onChange={(e) => update('pax', e.target.value)}
            placeholder="e.g. 120"
          />

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-paec-orange text-base font-semibold text-white shadow-md shadow-orange-500/20 transition-colors hover:bg-paec-orange-light disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {submitting ? 'Sending…' : 'Send Inquire'}
          </button>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-emerald-600">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />
              Free to inquire
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />
              No payment required
            </span>
            {respondsIn ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                Replies within {respondsIn}
              </span>
            ) : null}
          </div>
        </form>
      )}
    </aside>
  )
}

type InquiryFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: LucideIcon
  error?: string
  hint?: string
}

function InquiryField({ label, icon: Icon, error, hint, className, ...props }: InquiryFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label} <span className="text-red-500">*</span>
      </span>
      <span className="relative block">
        {Icon ? (
          <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-paec-violet/70" />
        ) : null}
        <input
          {...props}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-11 w-full rounded-xl border bg-white px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:outline-none',
            Icon && 'pl-9',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-violet-100 focus:border-paec-violet focus:ring-paec-violet/15',
            className,
          )}
        />
      </span>
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}
