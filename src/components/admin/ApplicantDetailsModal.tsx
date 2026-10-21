import { CalendarDays, FileText, Loader2, MapPin, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  APPLICATION_STATUS_LABELS,
  careerService,
  type CareerApplication,
  type CareerApplicationStatus,
} from '@/services/careerService'

const fieldClassName = cn(
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)
const labelClassName = 'text-xs font-semibold text-foreground'

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Convert an ISO datetime to the value a datetime-local input expects. */
function toDateTimeLocal(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatInterviewAt(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ApplicantDetailsModal({
  application,
  positionTitle,
  onClose,
  onStatusChanged,
}: {
  application: CareerApplication
  positionTitle?: string
  onClose: () => void
  onStatusChanged: (updated: CareerApplication) => void
}) {
  const [status, setStatus] = useState<CareerApplicationStatus>(application.status)
  const [interviewAt, setInterviewAt] = useState(() =>
    toDateTimeLocal(application.interview_at),
  )
  const [interviewLocation, setInterviewLocation] = useState(
    application.interview_location ?? '',
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setStatus(application.status)
    setInterviewAt(toDateTimeLocal(application.interview_at))
    setInterviewLocation(application.interview_location ?? '')
    setErrors({})
  }, [application])

  const isForInterview = status === 'for_interview'
  const hasChanges =
    status !== application.status ||
    (isForInterview &&
      (interviewAt !== toDateTimeLocal(application.interview_at) ||
        interviewLocation !== (application.interview_location ?? '')))

  const handleSaveStatus = async () => {
    setErrors({})
    if (isForInterview) {
      const fieldErrors: Record<string, string> = {}
      if (!interviewAt) {
        fieldErrors.interview_at = 'Please set the date and time of the interview.'
      }
      if (!interviewLocation.trim()) {
        fieldErrors.interview_location =
          'Please indicate where the interview will be held.'
      }
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        return
      }
    }

    setSaving(true)
    try {
      const updated = await careerService.updateApplicationStatus(application.uuid, {
        status,
        interview_at: isForInterview
          ? new Date(interviewAt).toISOString()
          : application.interview_at ?? null,
        interview_location: isForInterview
          ? interviewLocation.trim()
          : application.interview_location ?? null,
      })
      toast.success(
        isForInterview
          ? 'Status set to For Interview. Interview details saved.'
          : 'Application status updated.',
      )
      onStatusChanged({ ...application, ...updated })
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      if (Object.keys(apiErrors).length > 0) {
        const flat: Record<string, string> = {}
        for (const [key, value] of Object.entries(apiErrors)) {
          flat[key] = Array.isArray(value) ? value[0] : value
        }
        setErrors(flat)
      } else {
        toast.error(getApiErrorMessage(err, 'Failed to update application status.'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
        aria-label="Close applicant details"
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl">
        <div className="shrink-0 px-6 pt-5">
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <p className="text-[11px] font-semibold tracking-widest text-paec-orange uppercase">
            Applicant
          </p>
          <h2 className="mt-1 text-lg font-bold text-foreground">
            {application.full_name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {positionTitle ?? application.position?.title ?? 'Position'} · Applied{' '}
            {formatDate(application.created_at)} ·{' '}
            {APPLICATION_STATUS_LABELS[application.status] ?? application.status}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className={labelClassName}>Email</dt>
              <dd className="mt-0.5 text-muted-foreground">{application.email}</dd>
            </div>
            {application.phone ? (
              <div>
                <dt className={labelClassName}>Phone</dt>
                <dd className="mt-0.5 text-muted-foreground">{application.phone}</dd>
              </div>
            ) : null}
            {application.salary_expectation ? (
              <div>
                <dt className={labelClassName}>Salary Expectation</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {application.salary_expectation}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className={labelClassName}>Resume</dt>
              <dd className="mt-0.5">
                {application.resume_url ? (
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium break-all text-paec-violet hover:underline"
                  >
                    <FileText className="size-4 shrink-0" />
                    {application.resume_file_name ?? 'View resume'}
                  </a>
                ) : (
                  <span className="text-muted-foreground">No resume uploaded</span>
                )}
              </dd>
            </div>
            <div>
              <dt className={labelClassName}>Cover Letter / Message</dt>
              <dd className="mt-0.5 leading-relaxed whitespace-pre-line text-muted-foreground">
                {application.cover_letter || '—'}
              </dd>
            </div>
            {application.interview_at && application.status === 'for_interview' ? (
              <div className="rounded-xl bg-amber-50/80 px-3.5 py-3">
                <dt className={labelClassName}>Current Interview Schedule</dt>
                <dd className="mt-1 space-y-1 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-paec-orange" />
                    {formatInterviewAt(application.interview_at)}
                  </span>
                  {application.interview_location ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4 text-paec-orange" />
                      {application.interview_location}
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>

          {/* Change status */}
          <div className="space-y-3 border-t border-violet-100 pt-4">
            <div>
              <label className={labelClassName}>
                Change Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CareerApplicationStatus)}
                disabled={saving}
                className={cn(fieldClassName, 'mt-1.5')}
              >
                {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {isForInterview ? (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                <div>
                  <label className={labelClassName}>
                    Date &amp; Time of Interview <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={interviewAt}
                    onChange={(e) => setInterviewAt(e.target.value)}
                    disabled={saving}
                    className={cn(fieldClassName, 'mt-1.5 bg-white')}
                  />
                  {errors.interview_at ? (
                    <p className="mt-1 text-xs text-red-600">{errors.interview_at}</p>
                  ) : null}
                </div>
                <div>
                  <label className={labelClassName}>
                    Where <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={interviewLocation}
                    onChange={(e) => setInterviewLocation(e.target.value)}
                    placeholder="e.g. PAEC Office, Manila — or Google Meet link"
                    disabled={saving}
                    className={cn(fieldClassName, 'mt-1.5 bg-white')}
                  />
                  {errors.interview_location ? (
                    <p className="mt-1 text-xs text-red-600">{errors.interview_location}</p>
                  ) : null}
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  The applicant will see this schedule in their My Applications
                  page.
                </p>
              </div>
            ) : null}
            {errors.status ? (
              <p className="text-xs text-red-600">{errors.status}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold text-foreground hover:bg-violet-50 disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void handleSaveStatus()}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white hover:bg-paec-violet/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
