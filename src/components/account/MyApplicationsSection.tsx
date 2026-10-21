import { Link } from '@tanstack/react-router'
import {
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  PhoneCall,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  APPLICATION_STATUS_LABELS,
  careerService,
  EMPLOYMENT_TYPE_LABELS,
  WORK_SETUP_LABELS,
  type CareerApplication,
  type CareerApplicationStatus,
} from '@/services/careerService'

const STATUS_STYLES: Record<CareerApplicationStatus, string> = {
  applied: 'border-violet-200 bg-violet-50 text-paec-violet',
  accepted: 'border-sky-200 bg-sky-50 text-sky-700',
  for_interview: 'border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  denied: 'border-red-200 bg-red-50 text-red-700',
}

const STATUS_DESCRIPTIONS: Record<CareerApplicationStatus, string> = {
  applied: 'Your application has been received and is waiting for review.',
  accepted: 'Good news — your application has been accepted and is moving forward.',
  for_interview: 'You are scheduled for an interview. Our team will contact you with the details.',
  completed: 'Congratulations! Your application process is completed.',
  denied: 'Thank you for applying. This position has moved forward with other candidates.',
}

const PROGRESS_STEPS: Array<{ id: CareerApplicationStatus; label: string }> = [
  { id: 'applied', label: 'Applied' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'for_interview', label: 'For Interview' },
  { id: 'completed', label: 'Completed' },
]

function progressIndex(status: CareerApplicationStatus): number {
  if (status === 'applied') return 0
  if (status === 'accepted') return 1
  if (status === 'for_interview') return 2
  if (status === 'completed') return 3
  return 0
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function ApplicationCard({ application }: { application: CareerApplication }) {
  const position = application.position
  const status = application.status
  const activeStep = progressIndex(status)
  const isRejected = status === 'denied'

  return (
    <article className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {position ? (
            <Link
              to="/careers/$positionId"
              params={{ positionId: position.uuid }}
              className="text-base font-bold text-foreground transition-colors hover:text-paec-violet sm:text-lg"
            >
              {position.title}
            </Link>
          ) : (
            <p className="text-base font-bold text-foreground sm:text-lg">Position</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            {position?.department ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4 text-paec-violet" />
                {position.department}
              </span>
            ) : null}
            {position?.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-paec-violet" />
                {position.location}
              </span>
            ) : null}
            {position ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-paec-violet" />
                {EMPLOYMENT_TYPE_LABELS[position.employment_type] ??
                  position.employment_type}
                {' · '}
                {WORK_SETUP_LABELS[position.work_setup] ?? position.work_setup}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-paec-violet" />
              Applied {formatDate(application.created_at)}
            </span>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-bold',
            STATUS_STYLES[status],
          )}
        >
          {APPLICATION_STATUS_LABELS[status] ?? status}
        </span>
      </div>

      {/* Status progress */}
      {isRejected ? (
        <p className="mt-4 rounded-xl bg-red-50/70 px-4 py-3 text-sm text-red-700">
          {STATUS_DESCRIPTIONS[status]}
        </p>
      ) : (
        <div className="mt-5">
          <ol className="flex items-center">
            {PROGRESS_STEPS.map((step, index) => {
              const done = index < activeStep
              const current = index === activeStep
              return (
                <li
                  key={step.id}
                  className={cn('flex items-center', index > 0 && 'flex-1')}
                >
                  {index > 0 ? (
                    <span
                      className={cn(
                        'mx-2 h-0.5 flex-1 rounded-full',
                        index <= activeStep ? 'bg-paec-violet' : 'bg-violet-100',
                      )}
                    />
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        done || current
                          ? 'bg-paec-violet text-white'
                          : 'bg-violet-100 text-muted-foreground',
                        current && 'ring-4 ring-violet-100',
                      )}
                    >
                      {done ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    <span
                      className={cn(
                        'hidden text-xs font-semibold sm:inline',
                        current || done ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {step.label}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">
            {STATUS_DESCRIPTIONS[status]}
          </p>

          {status === 'for_interview' && application.interview_at ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-paec-orange text-white">
                  <CalendarDays className="size-4" />
                </span>
                Your Interview Schedule
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-white px-3 py-2.5 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    <CalendarDays className="size-3.5 text-paec-orange" />
                    Date &amp; Time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {new Date(application.interview_at).toLocaleString('en-PH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {application.interview_location ? (
                  <div className="rounded-lg bg-white px-3 py-2.5 shadow-sm">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                      <MapPin className="size-3.5 text-paec-orange" />
                      Where
                    </p>
                    <p className="mt-1 text-sm font-semibold break-words text-foreground">
                      {application.interview_location.startsWith('http') ? (
                        <a
                          href={application.interview_location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-paec-violet hover:underline"
                        >
                          {application.interview_location}
                        </a>
                      ) : (
                        application.interview_location
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Please be ready at least 15 minutes before your schedule and
                bring a copy of your resume.
              </p>
            </div>
          ) : null}

          {status === 'accepted' || status === 'for_interview' ? (
            <div className="mt-4 rounded-xl border border-paec-orange/30 bg-orange-50/70 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-paec-orange text-white">
                  <BellRing className="size-4" />
                </span>
                {status === 'for_interview'
                  ? 'Get ready for your interview'
                  : "What's next?"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {status === 'for_interview'
                  ? 'Our team will send your interview details and may coordinate with you for scheduling. '
                  : 'Our team will reach out to you for the next steps. '}
                Please expect a{' '}
                <span className="font-semibold text-foreground">call</span>,{' '}
                <span className="font-semibold text-foreground">text message</span>,
                or <span className="font-semibold text-foreground">email</span>{' '}
                from us — make sure your phone line and email are{' '}
                <span className="font-semibold text-foreground">
                  always open and reachable
                </span>
                , and check your inbox (including spam/junk) regularly.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {application.phone ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                    <PhoneCall className="size-3.5 text-paec-orange" />
                    {application.phone}
                  </span>
                ) : null}
                {application.phone ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                    <MessageSquare className="size-3.5 text-paec-orange" />
                    SMS / Text
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                  <Mail className="size-3.5 text-paec-orange" />
                  {application.email}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-violet-50 pt-4 text-xs text-muted-foreground sm:text-sm">
        {application.salary_expectation ? (
          <span>
            Salary expectation:{' '}
            <span className="font-semibold text-foreground">
              {application.salary_expectation}
            </span>
          </span>
        ) : null}
        {application.resume_url ? (
          <a
            href={application.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-paec-violet hover:underline"
          >
            <FileText className="size-4" />
            {application.resume_file_name ?? 'View resume'}
          </a>
        ) : null}
        {position ? (
          <Link
            to="/careers/$positionId"
            params={{ positionId: position.uuid }}
            className="ml-auto font-semibold text-paec-violet hover:underline"
          >
            View position
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export function MyApplicationsSection() {
  const [applications, setApplications] = useState<CareerApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    careerService
      .listMyApplications()
      .then((data) => {
        if (!cancelled) setApplications(data)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, 'Failed to load your applications.'))
          setApplications([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          My <span className="text-paec-violet">applications</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track the status of the positions you applied for.
        </p>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-paec-violet" />
        </div>
      ) : applications.length === 0 ? (
        <div className="mt-8 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-violet-100 bg-white px-6 py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-50">
            <BriefcaseBusiness className="size-8 text-paec-violet/40" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            No applications yet
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            When you apply for a position, you can track its status here.
          </p>
          <Link
            to="/careers"
            className="mt-4 text-sm font-semibold text-paec-violet hover:underline"
          >
            Browse open positions
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            {applications.length} application{applications.length === 1 ? '' : 's'}
          </p>
          {applications.map((application) => (
            <ApplicationCard key={application.uuid} application={application} />
          ))}
        </div>
      )}
    </div>
  )
}
