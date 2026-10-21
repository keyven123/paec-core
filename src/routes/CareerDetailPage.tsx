import { Link, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock,
  Laptop,
  MapPin,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { CareerApplyButton } from '@/components/careers/CareerApplyButton'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { htmlToPlainText, sanitizeRichHtml } from '@/lib/richText'
import {
  careerService,
  EMPLOYMENT_TYPE_LABELS,
  WORK_SETUP_LABELS,
  type CareerPosition,
} from '@/services/careerService'

function formatPostedDate(value?: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function OverviewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-paec-violet">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function ContentSection({
  title,
  accentClassName,
  html,
}: {
  title: string
  accentClassName: string
  html: string
}) {
  if (!htmlToPlainText(html)) return null
  return (
    <section>
      <h2 className="flex items-center gap-2.5 text-base font-bold tracking-wide text-foreground uppercase sm:text-lg">
        <span className={`h-5 w-1.5 rounded-full ${accentClassName}`} />
        {title}
      </h2>
      <div
        className="rich-text-content mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
      />
    </section>
  )
}

export function CareerDetailPage() {
  const { positionId } = useParams({ strict: false }) as { positionId: string }
  const [position, setPosition] = useState<CareerPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    careerService
      .getPublic(positionId)
      .then((data) => {
        if (!cancelled) setPosition(data)
      })
      .catch(() => {
        if (!cancelled) {
          setPosition(null)
          setNotFound(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [positionId])

  const postedDate = formatPostedDate(position?.created_at)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0f0a1a]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e]/90 via-[#1a0b2e]/70 to-[#0f0a1a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(124,58,237,0.22),_transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(249,115,22,0.10),_transparent_50%)]" />

          <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12 sm:pb-24 lg:px-8">
            <Link
              to="/careers"
              className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to careers
            </Link>

            {loading ? (
              <div className="mt-8 space-y-3">
                <div className="h-4 w-32 animate-pulse rounded bg-white/20" />
                <div className="h-10 w-2/3 animate-pulse rounded bg-white/20" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-white/20" />
              </div>
            ) : notFound || !position ? (
              <>
                <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-paec-orange uppercase">
                  <BriefcaseBusiness className="size-3.5" />
                  PAEC Careers
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Position not found
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                  This position may have been closed or is no longer available.
                </p>
              </>
            ) : (
              <>
                <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-paec-orange uppercase">
                  <BriefcaseBusiness className="size-3.5" />
                  PAEC Careers
                </p>
                <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                  {position.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {position.department ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
                      <Building2 className="size-4 text-paec-orange-light" />
                      {position.department}
                    </span>
                  ) : null}
                  {position.location ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
                      <MapPin className="size-4 text-paec-orange-light" />
                      {position.location}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
                    <Laptop className="size-4 text-paec-orange-light" />
                    {WORK_SETUP_LABELS[position.work_setup] ?? position.work_setup}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
                    <Clock className="size-4 text-paec-orange-light" />
                    {EMPLOYMENT_TYPE_LABELS[position.employment_type] ??
                      position.employment_type}
                  </span>
                  {postedDate ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
                      <CalendarDays className="size-4 text-paec-orange-light" />
                      Posted {postedDate}
                    </span>
                  ) : null}
                </div>

                <div className="mt-7">
                  <CareerApplyButton
                    position={position}
                    className="h-11 bg-paec-orange px-6 shadow-lg shadow-paec-orange/25 hover:bg-paec-orange-light"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Body */}
        <div className="relative mx-auto -mt-12 max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          {loading ? (
            <div className="space-y-3 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <div className="h-4 w-3/4 animate-pulse rounded bg-violet-100" />
              <div className="h-4 w-full animate-pulse rounded bg-violet-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-violet-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-violet-100" />
            </div>
          ) : notFound || !position ? (
            <div className="rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-sm">
              <BriefcaseBusiness className="mx-auto size-10 text-paec-violet/50" />
              <p className="mt-4 text-sm font-semibold text-foreground">
                This position is no longer available
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Browse our other open positions and find the right role for you.
              </p>
              <Link
                to="/careers"
                className="mt-5 inline-flex h-10 items-center rounded-full bg-paec-violet px-5 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark"
              >
                View open positions
              </Link>
            </div>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* Main content */}
              <article className="space-y-9 rounded-2xl border border-violet-100 bg-white p-6 shadow-xl shadow-violet-900/5 sm:p-8">
                <ContentSection
                  title="Job Description"
                  accentClassName="bg-paec-violet"
                  html={position.description ?? ''}
                />
                <ContentSection
                  title="Requirements / Qualifications"
                  accentClassName="bg-paec-orange"
                  html={position.requirements ?? ''}
                />
                {!htmlToPlainText(position.description) &&
                !htmlToPlainText(position.requirements) ? (
                  <p className="text-sm text-muted-foreground">
                    Full details for this position will be shared with qualified
                    applicants. Apply now to learn more.
                  </p>
                ) : null}

                <div className="rounded-xl bg-violet-50/70 p-5">
                  <h3 className="text-sm font-bold text-foreground">
                    How to apply
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Click{' '}
                    <span className="font-semibold text-foreground">Apply Now</span>,
                    sign in to your PAEC account (or create one), then complete
                    and submit the application form. Our team will review your
                    application and contact qualified applicants for the next
                    steps.
                  </p>
                  <div className="mt-4">
                    <CareerApplyButton position={position} />
                  </div>
                </div>
              </article>

              {/* Sidebar */}
              <aside className="space-y-4 lg:sticky lg:top-24">
                <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-xl shadow-violet-900/5">
                  <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">
                    Job Overview
                  </h2>
                  <div className="mt-4 space-y-4">
                    {position.department ? (
                      <OverviewRow
                        icon={Building2}
                        label="Department"
                        value={position.department}
                      />
                    ) : null}
                    {position.location ? (
                      <OverviewRow
                        icon={MapPin}
                        label="Location"
                        value={position.location}
                      />
                    ) : null}
                    <OverviewRow
                      icon={Laptop}
                      label="Work Setup"
                      value={WORK_SETUP_LABELS[position.work_setup] ?? position.work_setup}
                    />
                    <OverviewRow
                      icon={Clock}
                      label="Job Type"
                      value={
                        EMPLOYMENT_TYPE_LABELS[position.employment_type] ??
                        position.employment_type
                      }
                    />
                    {postedDate ? (
                      <OverviewRow
                        icon={CalendarDays}
                        label="Date Posted"
                        value={postedDate}
                      />
                    ) : null}
                  </div>
                  <div className="mt-5">
                    <CareerApplyButton
                      position={position}
                      className="h-11 w-full justify-center"
                      appliedClassName="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white"
                    />
                  </div>
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                    Sign-in required. Complete the application form and our
                    team will review it.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#150b26] p-5 text-white shadow-xl shadow-violet-900/10">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-paec-orange uppercase">
                    <BriefcaseBusiness className="size-3.5" />
                    About PAEC
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Philippine Amusement and Entertainment Corporation — your
                    gateway to the best fun experiences in the Philippines.
                    Join the team behind it.
                  </p>
                  <Link
                    to="/careers"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-paec-orange-light"
                  >
                    View all open positions
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
