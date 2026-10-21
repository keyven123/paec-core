import { BriefcaseBusiness, Eye, Plus, Search, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { ApplicantDetailsModal } from '@/components/admin/ApplicantDetailsModal'
import { CareerPositionModal } from '@/components/admin/CareerPositionModal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
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

type CareersTab = 'positions' | 'applications'

function formatDate(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const fieldClassName = cn(
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

export function AdminCareersSection() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CareersTab>('positions')
  const [positions, setPositions] = useState<CareerPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<CareerApplication[]>([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [appStatusFilter, setAppStatusFilter] = useState('')
  const [viewApplication, setViewApplication] = useState<CareerApplication | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editPosition, setEditPosition] = useState<CareerPosition | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CareerPosition | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search])

  const loadPositions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await careerService.listPositions({
        q: debouncedSearch || undefined,
        status: statusFilter || undefined,
        per_page: 50,
      })
      setPositions(response.data ?? [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load positions.'))
      setPositions([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    void loadPositions()
  }, [loadPositions])

  const loadApplications = useCallback(async () => {
    setLoadingApplications(true)
    try {
      const response = await careerService.listApplications({
        q: debouncedSearch || undefined,
        status: appStatusFilter || undefined,
        per_page: 50,
      })
      setApplications(response.data ?? [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load applications.'))
      setApplications([])
    } finally {
      setLoadingApplications(false)
    }
  }, [debouncedSearch, appStatusFilter])

  useEffect(() => {
    if (activeTab === 'applications') void loadApplications()
  }, [activeTab, loadApplications])

  const handleSave = async (payload: CareerPositionPayload, uuid?: string) => {
    if (uuid) {
      await careerService.updatePosition(uuid, payload)
    } else {
      await careerService.createPosition(payload)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await careerService.deletePosition(deleteTarget.uuid)
      toast.success('Position deleted successfully.')
      setDeleteTarget(null)
      void loadPositions()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete position.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground lg:text-2xl">Careers</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Add available positions. Published positions are posted on the public
          /careers page where signed-in users can apply.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'positions', label: 'Positions', icon: BriefcaseBusiness },
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
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'positions'
                  ? 'Search positions...'
                  : 'Search applicants or positions...'
              }
              className={cn(fieldClassName, 'pl-9')}
            />
          </div>
          {activeTab === 'positions' ? (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(fieldClassName, 'sm:w-44')}
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          ) : (
            <select
              value={appStatusFilter}
              onChange={(e) => setAppStatusFilter(e.target.value)}
              className={cn(fieldClassName, 'sm:w-44')}
            >
              <option value="">All statuses</option>
              {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
        {activeTab === 'positions' ? (
          <button
            type="button"
            onClick={() => {
              setEditPosition(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white hover:bg-paec-violet/90 sm:text-sm"
          >
            <Plus className="size-3.5" />
            New Position
          </button>
        ) : null}
      </div>

      {activeTab === 'applications' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="overflow-x-auto rounded-xl border border-violet-100 bg-white shadow-sm">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-violet-50/80">
                <tr className="border-b border-violet-100 text-[10px] tracking-wider text-muted-foreground uppercase">
                  {['Applicant', 'Position', 'Contact', 'Applied', 'Status', 'Actions'].map(
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
                    <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                      Loading applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 size-6 text-paec-violet/40" />
                      No applications yet. Signed-in users apply from the public
                      /careers pages.
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr
                      key={application.uuid}
                      className="border-b border-violet-50 hover:bg-violet-50/30"
                    >
                      <td className="px-3 py-2.5 text-xs font-medium text-foreground">
                        {application.full_name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {application.position?.title ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        <span className="block">{application.email}</span>
                        {application.phone ? (
                          <span className="block">{application.phone}</span>
                        ) : null}
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
        </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="overflow-x-auto rounded-xl border border-violet-100 bg-white shadow-sm">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="bg-violet-50/80">
              <tr className="border-b border-violet-100 text-[10px] tracking-wider text-muted-foreground uppercase">
                {['Position', 'Department', 'Location', 'Work Setup', 'Type', 'Applicants', 'Status', 'Actions'].map(
                  (col) => (
                    <th key={col} className="px-3 py-2 font-semibold">
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">
                    Loading positions...
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">
                    <BriefcaseBusiness className="mx-auto mb-2 size-6 text-paec-violet/40" />
                    No positions yet. Click &quot;New Position&quot; to post one on
                    /careers.
                  </td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr
                    key={position.uuid}
                    onClick={() =>
                      navigate({
                        to: '/admin/careers/$positionId',
                        params: { positionId: position.uuid },
                      })
                    }
                    className="cursor-pointer border-b border-violet-50 hover:bg-violet-50/50"
                    title="View position details and applicants"
                  >
                    <td className="px-3 py-2.5 text-xs font-semibold text-paec-violet underline-offset-2 hover:underline">
                      {position.title}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {position.department || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {position.location || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {WORK_SETUP_LABELS[position.work_setup] ?? position.work_setup ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {EMPLOYMENT_TYPE_LABELS[position.employment_type] ??
                        position.employment_type}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-paec-violet tabular-nums">
                        <Users className="size-3" />
                        {position.applications_count ?? 0}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                          position.status === 'published'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {position.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate({
                              to: '/admin/careers/$positionId',
                              params: { positionId: position.uuid },
                            })
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-paec-violet hover:bg-violet-50"
                        >
                          <Eye className="size-3" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditPosition(position)
                            setModalOpen(true)
                          }}
                          className="rounded-md border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-paec-violet hover:bg-violet-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(position)
                          }}
                          className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {viewApplication ? (
        <ApplicantDetailsModal
          application={viewApplication}
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
        open={modalOpen}
        position={editPosition}
        onClose={() => setModalOpen(false)}
        onSuccess={() => void loadPositions()}
        onSave={handleSave}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Position"
        message={
          deleteTarget ? `Delete "${deleteTarget.title}"? This cannot be undone.` : ''
        }
        confirmLabel="Delete Position"
        variant="danger"
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
