import { Link } from '@tanstack/react-router'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  userManagementService,
  type CustomerUser,
} from '@/services/userManagementService'

type AdminUserDetailSectionProps = {
  userUuid: string
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getUserInitials(user: CustomerUser): string {
  const first = user.first_name?.[0] ?? ''
  const last = user.last_name?.[0] ?? ''
  return (first + last).toUpperCase() || '?'
}

function displayValue(value?: string | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
        normalized === 'active' && 'bg-emerald-100 text-emerald-700',
        normalized === 'inactive' && 'bg-red-100 text-red-600',
        normalized !== 'active' &&
          normalized !== 'inactive' &&
          'bg-violet-100 text-paec-violet',
      )}
    >
      {status}
    </span>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function AdminUserDetailSection({ userUuid }: AdminUserDetailSectionProps) {
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const userData = await userManagementService.getCustomer(userUuid)
      setUser(userData)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load user details.'))
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [userUuid])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading user details...</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex h-full flex-col gap-4">
        <Link
          to="/admin/usermanagement"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-violet-50"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'User not found.'}
        </div>
      </div>
    )
  }

  const addressParts = [
    user.address_line_1,
    user.address_line_2,
    [user.city, user.region].filter(Boolean).join(', '),
    user.postal_code,
    user.country,
  ].filter((part) => part?.trim())

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pb-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/admin/usermanagement"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-violet-50"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground lg:text-2xl">
              User Details
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              View customer profile information.
            </p>
          </div>
        </div>

        <Link
          to="/admin/usermanagement/$userUuid/stats"
          params={{ userUuid: user.uuid }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet/90"
        >
          <BarChart3 className="size-3.5" />
          View Statistics
        </Link>
      </div>

      <section className="shrink-0 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {user.image?.url ? (
            <img
              src={user.image.url}
              alt={user.full_name}
              className="size-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-paec-violet text-lg font-bold text-white">
              {getUserInitials(user)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{user.full_name}</h2>
              <StatusBadge status={user.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
            {user.role?.name ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Role: {user.role.name}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <DetailSection title="Personal Information">
        <DetailField label="First Name" value={displayValue(user.first_name)} />
        <DetailField label="Middle Name" value={displayValue(user.middle_name)} />
        <DetailField label="Last Name" value={displayValue(user.last_name)} />
        <DetailField label="Email" value={displayValue(user.email)} />
        <DetailField label="Phone" value={displayValue(user.phone_number)} />
        <DetailField label="Birth Date" value={formatDate(user.birth_date)} />
      </DetailSection>

      <DetailSection title="Address">
        <DetailField label="Address Line 1" value={displayValue(user.address_line_1)} />
        <DetailField label="Address Line 2" value={displayValue(user.address_line_2)} />
        <DetailField label="City" value={displayValue(user.city)} />
        <DetailField label="Region" value={displayValue(user.region)} />
        <DetailField label="Postal Code" value={displayValue(user.postal_code)} />
        <DetailField label="Country" value={displayValue(user.country)} />
        {addressParts.length === 0 ? (
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">No address on file.</p>
          </div>
        ) : null}
      </DetailSection>

      <DetailSection title="Account Information">
        <DetailField
          label="Marketing Consent"
          value={
            user.marketing_consent === undefined
              ? '—'
              : user.marketing_consent
                ? 'Yes'
                : 'No'
          }
        />
        <DetailField
          label="Marketing Consent Date"
          value={formatDateTime(user.marketing_consent_date)}
        />
        <DetailField
          label="Terms Accepted At"
          value={formatDateTime(user.terms_accepted_at)}
        />
        <DetailField label="Member Since" value={formatDateTime(user.created_at)} />
        <DetailField label="Last Updated" value={formatDateTime(user.updated_at)} />
      </DetailSection>
    </div>
  )
}
