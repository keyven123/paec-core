import { Link } from '@tanstack/react-router'
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  Search,
  Ticket,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { ActivityStatus, AdminActivity } from '@/data/mockAdminActivities'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { activityService } from '@/services/activityService'

type StatusFilter = 'all' | ActivityStatus

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'pending', label: 'Pending' },
  { value: 'draft', label: 'Draft' },
]

function buildStatCards(stats: {
  published: number
  pending: number
  revenue: number
  ticketsSold: number
}) {
  return [
    {
      label: 'Published Fun Activities',
      value: stats.published,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      iconClass: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Total Revenue',
      value: `₱${stats.revenue.toFixed(2)}`,
      icon: Banknote,
      iconClass: 'bg-orange-100 text-paec-orange',
    },
    {
      label: 'Tickets Sold',
      value: stats.ticketsSold,
      icon: Ticket,
      iconClass: 'bg-violet-100 text-paec-violet',
    },
  ]
}

function StatusBadge({ status }: { status: ActivityStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
        status === 'published' && 'bg-paec-violet text-white',
        status === 'pending' && 'bg-amber-100 text-amber-700',
        status === 'draft' && 'bg-violet-100 text-muted-foreground',
      )}
    >
      {status}
    </span>
  )
}

export function AdminActivitiesSection() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [stats, setStats] = useState({
    published: 0,
    pending: 0,
    revenue: 0,
    ticketsSold: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    id: string
    type: 'publish' | 'delete'
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminActivity | null>(null)

  const loadActivities = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [activityList, funStats] = await Promise.all([
        activityService.listAmusements(),
        activityService.getFunStats(),
      ])

      setActivities(activityList)
      setStats({
        published: funStats.total_published,
        pending: funStats.total_pending,
        revenue: funStats.total_transaction_amount,
        ticketsSold: funStats.total_tickets_sold,
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load activities.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  const handlePublish = useCallback(
    async (activity: AdminActivity) => {
      setPendingAction({ id: activity.id, type: 'publish' })

      try {
        await activityService.publish(activity.id)
        setActivities((current) =>
          current.map((item) =>
            item.id === activity.id
              ? { ...item, status: 'published' as const }
              : item,
          ),
        )
        const funStats = await activityService.getFunStats()
        setStats({
          published: funStats.total_published,
          pending: funStats.total_pending,
          revenue: funStats.total_transaction_amount,
          ticketsSold: funStats.total_tickets_sold,
        })
        toast.success(`"${activity.title}" has been published.`)
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to publish activity.'))
      } finally {
        setPendingAction(null)
      }
    },
    [],
  )

  const handleDeleteRequest = useCallback((activity: AdminActivity) => {
    setDeleteTarget(activity)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return

    const activity = deleteTarget
    setPendingAction({ id: activity.id, type: 'delete' })

    try {
      await activityService.delete(activity.id)
      setActivities((current) =>
        current.filter((item) => item.id !== activity.id),
      )
      const funStats = await activityService.getFunStats()
      setStats({
        published: funStats.total_published,
        pending: funStats.total_pending,
        revenue: funStats.total_transaction_amount,
        ticketsSold: funStats.total_tickets_sold,
      })
      toast.success(`"${activity.title}" has been deleted.`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete activity.'))
    } finally {
      setPendingAction(null)
    }
  }, [deleteTarget])

  const statCards = buildStatCards(stats)

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase()

    return activities.filter((activity) => {
      const matchesSearch =
        !query ||
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query)

      const matchesStatus =
        status === 'all' || activity.status === status

      return matchesSearch && matchesStatus
    })
  }, [activities, search, status])

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            Activity Management
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage Fun and Amusement activities
          </p>
        </div>

        <Link
          to="/admin/activities/create"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark sm:gap-2 sm:px-4 sm:text-sm"
        >
          <Plus className="size-3.5 sm:size-4" />
          Create Activity
        </Link>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-xl border border-violet-100 bg-white p-3 shadow-sm"
            >
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  stat.iconClass,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  {stat.label}
                </p>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fun activities..."
            className={inputClassName}
          />
        </div>

        <div className="relative w-full sm:w-40">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className={cn(inputClassName, 'appearance-none px-3 pl-3')}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-violet-50/95 backdrop-blur-sm">
              <tr className="border-b border-violet-100">
                {[
                  'Activity',
                  'Status',
                  'Date',
                  'Actions',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Loading activities...
                    </p>
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      No activities found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    pendingAction={pendingAction}
                    onPublish={handlePublish}
                    onDelete={handleDeleteRequest}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete activity"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={
          deleteTarget !== null &&
          pendingAction?.id === deleteTarget.id &&
          pendingAction.type === 'delete'
        }
        onClose={() => {
          if (pendingAction?.type === 'delete') return
          setDeleteTarget(null)
        }}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  )
}

type ActivityRowProps = {
  activity: AdminActivity
  pendingAction: { id: string; type: 'publish' | 'delete' } | null
  onPublish: (activity: AdminActivity) => void
  onDelete: (activity: AdminActivity) => void
}

function ActivityRow({
  activity,
  pendingAction,
  onPublish,
  onDelete,
}: ActivityRowProps) {
  const isPublishing =
    pendingAction?.id === activity.id && pendingAction.type === 'publish'
  const isDeleting =
    pendingAction?.id === activity.id && pendingAction.type === 'delete'
  const isBusy = isPublishing || isDeleting

  return (
    <tr className="border-b border-violet-50 transition-colors last:border-0 hover:bg-violet-50/30">
      <td className="max-w-[200px] px-3 py-2">
        <p className="truncate text-xs font-semibold text-foreground">
          {activity.title}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {activity.description}
        </p>
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={activity.status} />
      </td>
      <td className="px-3 py-2 text-xs whitespace-nowrap text-foreground">
        {activity.date}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            to="/admin/activities/$activityId"
            params={{ activityId: activity.id }}
            className={actionButtonClassName('view')}
            aria-disabled={isBusy}
            onClick={(e) => {
              if (isBusy) e.preventDefault()
            }}
          >
            View
          </Link>
          {activity.status !== 'published' ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onPublish(activity)}
              className={actionButtonClassName('publish')}
            >
              {isPublishing ? 'Publishing…' : 'Publish'}
            </button>
          ) : null}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onDelete(activity)}
            className={actionButtonClassName('delete')}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  )
}

function actionButtonClassName(variant: 'view' | 'publish' | 'delete') {
  return cn(
    'rounded-md border bg-white px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'view' &&
      'border-violet-200 text-paec-violet hover:border-paec-violet hover:bg-violet-50',
    variant === 'publish' &&
      'border-emerald-200 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50',
    variant === 'delete' &&
      'border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50',
  )
}

const inputClassName = cn(
  'h-9 w-full rounded-lg border border-violet-100 bg-white pr-3 pl-9 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)
