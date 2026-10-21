import { Link, useNavigate } from '@tanstack/react-router'
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronLeft,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Laptop,
  Loader2,
  MapPin,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ApplicantDetailsModal } from '@/components/admin/ApplicantDetailsModal'
import { CareerPositionModal } from '@/components/admin/CareerPositionModal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
import { htmlToPlainText, sanitizeRichHtml } from '@/lib/richText'
import { cn } from '@/lib/utils'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  careerService,
  EMPLOYMENT_TYPE_LABELS,
  WORK_SETUP_LABELS,
  type CareerApplication,
  type CareerPosition,
  type CareerPositionPayload,
} from '@/services/careerService'

const cardClassName =
  'rounded-xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6'

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

function DetailField({
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
        <p className="mt-0.5 text-sm font-semibold break-words text-foreground">{value}</p>
      </div>
    </div>
  )
}

function RichSection({ title, html, accent }: { title: string; html: string; accent: string }) {
  if (!htmlToPlainText(html)) return null
  return (
    <section>
      <h2 className="flex items-center gap-2.5 text-sm font-bold tracking-wide text-foreground uppercase">
        <span className={cn('h-4 w-1.5 rounded-full', accent)} />
        {title}
      </h2>
      <div
        className="rich-text-content mt-3 text-sm text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
      />
    </section>
  )
}

type CareerDetailTab = 'information' | 'applications'

export function AdminCareerDetailSection({ positionId }: { positionId: string }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CareerDetailTab>('information')
  const [position, setPosition] = useState<CareerPosition | null>(null)
  const [applications, setApplications] = useState<CareerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingApplications, setLoadingApplications] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewApplication, setViewApplication] = useState<CareerApplication | null>(null)

  const loadPosition = useCallback(async () => {
    setLoading(true)
    try {
      const data = await careerService.getPosition(positionId)
      setPosition(data)
      setNotFound(false)
    } catch {
      setPosition(null)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [positionId])

  const loadApplications = useCallback(async () => {
    setLoadingApplications(true)
    try {
      const response = await careerService.listApplications({
        career_position_uuid: positionId,
        per_page: 100,
      })
      setApplications(response.data ?? [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load applicants.'))
      setApplications([])
    } finally {
      setLoadingApplications(false)
    }
  }, [positionId])

  useEffect(() => {
    void loadPosition()
    void loadApplications()
  }, [loadPosition, loadApplications])

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase()
    return applications.filter((application) => {
      if (statusFilter && application.status !== statusFilter) return false
      if (!term) return true
      return [application.full_name, application.email, application.phone ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [applications, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: applications.length,
      applied: applications.filter((a) => a.status === 'applied').length,
      forInterview: applications.filter((a) => a.status === 'for_interview').length,
      completed: applications.filter((a) => a.status === 'completed').length,
    }),
    [applications],
  )

  const handleSave = async (payload: CareerPositionPayload, uuid?: string) => {
    if (uuid) {
      await careerService.updatePosition(uuid, payload)
    } else {
      await careerService.createPosition(payload)
    }
    await loadPosition()
  }

  const handleDelete = async () => {
    if (!position) return
    setDeleting(true)
    try {
      await careerService.deletePosition(position.uuid)
      toast.success('Position deleted successfully.')
      navigate({ to: '/admin/careers' })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete position.'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-paec-violet" />
      </div>
    )
  }

  if (notFound || !position) {
    return (
      <div className="rounded-xl border border-violet-100 bg-white p-10 text-center shadow-sm">
        <BriefcaseBusiness className="mx-auto size-10 text-paec-violet/40" />
        <h1 className="mt-3 text-lg font-bold text-foreground">Position not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This position may have been deleted.
        </p>
        <Link
          to="/admin/careers"
          className="mt-5 inline-flex h-10 items-center rounded-full bg-paec-violet px-5 text-sm font-semibold text-white hover:bg-paec-violet-dark"
        >
          Back to Careers
        </Link>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Applicants', value: stats.total, icon: Users },
    { label: 'Applied', value: stats.applied, icon: FileText },
    { label: 'For Interview', value: stats.forInterview, icon: BriefcaseBusiness },
    { label: 'Completed', value: stats.completed, icon: BriefcaseBusiness },
  ]

  return (
    <div className="space-y-5">
      {/* Header — same pattern as Activity detail */}
      <div>
        <Link
          to="/admin/careers"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-paec-violet"
        >
          <ChevronLeft className="size-4" />
          Back to Careers
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-foreground lg:text-2xl">
                {position.title}
              </h1>
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                  position.status === 'published'
                    ? 'bg-paec-violet text-white'
                    : 'bg-amber-100 text-amber-700',
                )}
              >
                {position.status}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
              {position.department ? <span>{position.department}</span> : null}
              {position.location ? <span>· {position.location}</span> : null}
              <span>
                · {WORK_SETUP_LABELS[position.work_setup] ?? position.work_setup}
              </span>
              <span>
                · {EMPLOYMENT_TYPE_LABELS[position.employment_type] ?? position.employment_type}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {position.status === 'published' ? (
              <Link
                to="/careers/$positionId"
                params={{ positionId: position.uuid }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-paec-violet hover:bg-violet-50 sm:text-sm"
              >
                <ExternalLink className="size-3.5" />
                View Public Page
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white hover:bg-paec-violet/90 sm:text-sm"
            >
              <Edit className="size-3.5" />
              Edit Position
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 sm:text-sm"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {card.label}
                </p>
                <Icon className="size-4 text-paec-violet" />
              </div>
              <p className="mt-1.5 text-2xl font-bold text-foreground tabular-nums">
                {card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'information', label: 'Position Information', icon: BriefcaseBusiness },
            { id: 'applications', label: 'Applications', icon: Users },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm',
                isActive
                  ? 'bg-paec-orange text-white shadow-sm shadow-paec-orange/20'
                  : 'border border-violet-100 bg-white text-muted-foreground hover:bg-violet-50 hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
              {tab.id === 'applications' ? (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums',
                    isActive ? 'bg-white text-paec-orange' : 'bg-violet-100 text-paec-violet',
                  )}
                >
                  {applications.length}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Position information */}
      {activeTab === 'information' ? (
      <section className={cardClassName}>
        <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">
          Position Information
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField icon={Building2} label="Department" value={position.department || '—'} />
          <DetailField icon={MapPin} label="Location" value={position.location || '—'} />
          <DetailField
            icon={Laptop}
            label="Work Setup"
            value={WORK_SETUP_LABELS[position.work_setup] ?? position.work_setup ?? '—'}
          />
          <DetailField
            icon={Clock}
            label="Job Type"
            value={EMPLOYMENT_TYPE_LABELS[position.employment_type] ?? position.employment_type}
          />
          <DetailField
            icon={BriefcaseBusiness}
            label="Status"
            value={position.status === 'published' ? 'Published' : 'Draft'}
          />
          <DetailField
            icon={CalendarDays}
            label="Date Created"
            value={formatDate(position.created_at)}
          />
        </div>

        <div className="mt-7 space-y-8 border-t border-violet-50 pt-6">
          <RichSection title="Job Description" html={position.description ?? ''} accent="bg-paec-violet" />
          <RichSection title="Requirements / Qualifications" html={position.requirements ?? ''} accent="bg-paec-orange" />
          {!htmlToPlainText(position.description) && !htmlToPlainText(position.requirements) ? (
            <p className="text-sm text-muted-foreground">
              No description or requirements yet. Click Edit Position to add them.
            </p>
          ) : null}
        </div>
      </section>
      ) : null}

      {/* Applicants */}
      {activeTab === 'applications' ? (
      <section className={cardClassName}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide text-foreground uppercase">
            <Users className="size-4 text-paec-violet" />
            Applicants
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-paec-violet tabular-nums">
              {filteredApplications.length}
            </span>
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applicants..."
                className="h-9 w-full rounded-lg border border-violet-100 bg-white pr-3 pl-9 text-sm focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none sm:w-56"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-violet-100 bg-white px-2 text-sm focus:border-paec-violet focus:outline-none"
            >
              <option value="">All statuses</option>
              {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-violet-50/80">
              <tr className="border-b border-violet-100 text-[10px] tracking-wider text-muted-foreground uppercase">
                {['Applicant', 'Contact', 'Salary Expectation', 'Resume', 'Applied', 'Status', 'Actions'].map(
                  (col) => (
                    <th key={col} className="px-3 py-2 font-semibold">
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loadingApplications ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    Loading applicants...
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 size-6 text-paec-violet/40" />
                    {applications.length === 0
                      ? 'No one has applied for this position yet.'
                      : 'No applicants match your search.'}
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr key={application.uuid} className="border-b border-violet-50 hover:bg-violet-50/30">
                    <td className="px-3 py-2.5 text-xs font-medium text-foreground">
                      {application.full_name}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      <span className="block">{application.email}</span>
                      {application.phone ? <span className="block">{application.phone}</span> : null}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-foreground">
                      {application.salary_expectation || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {application.resume_url ? (
                        <a
                          href={application.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-44 items-center gap-1.5 rounded-md border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-paec-violet hover:bg-violet-50"
                          title={application.resume_file_name ?? 'View resume'}
                        >
                          <FileText className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {application.resume_file_name ?? 'View Resume'}
                          </span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">No resume</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDate(application.created_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        title="Open the applicant to change status"
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap',
                          APPLICATION_STATUS_STYLES[application.status],
                        )}
                      >
                        {APPLICATION_STATUS_LABELS[application.status] ??
                          application.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setViewApplication(application)}
                        className="inline-flex items-center gap-1 rounded-md border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-paec-violet hover:bg-violet-50"
                      >
                        <Eye className="size-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {viewApplication ? (
        <ApplicantDetailsModal
          application={viewApplication}
          positionTitle={position.title}
          onClose={() => setViewApplication(null)}
          onStatusChanged={(updated) => {
            setViewApplication(updated)
            setApplications((prev) =>
              prev.map((item) => (item.uuid === updated.uuid ? updated : item)),
            )
          }}
        />
      ) : null}

      <CareerPositionModal
        open={editOpen}
        position={position}
        onClose={() => setEditOpen(false)}
        onSuccess={() => void loadPosition()}
        onSave={handleSave}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Delete Position"
        message={`Delete "${position.title}"? This cannot be undone.`}
        confirmLabel="Delete Position"
        variant="danger"
        loading={deleting}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}