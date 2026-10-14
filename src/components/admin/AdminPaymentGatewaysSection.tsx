import { ChevronDown, KeyRound, Loader2, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type {
  PaymentGateway,
  PaymentGatewayEnvironment,
  PaymentGatewayProvider,
  PaymentGatewayStatus,
} from '@/services/paymentGatewayService'
import {
  EnvironmentBadge,
  ProviderChip,
} from '@/components/admin/PaymentGatewayBadges'
import { PaymentGatewayFormModal } from '@/components/admin/PaymentGatewayFormModal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  PAYMENT_GATEWAY_PROVIDERS,
  getProviderMeta,
  paymentGatewayService,
} from '@/services/paymentGatewayService'

type Filters = {
  search: string
  provider: 'all' | PaymentGatewayProvider
  environment: 'all' | PaymentGatewayEnvironment | 'unverified'
  status: 'all' | PaymentGatewayStatus
}

const emptyFilters: Filters = {
  search: '',
  provider: 'all',
  environment: 'all',
  status: 'all',
}

const providerOptions: Array<{ value: Filters['provider']; label: string }> = [
  { value: 'all', label: 'All Providers' },
  ...PAYMENT_GATEWAY_PROVIDERS.map((meta) => ({
    value: meta.value,
    label: meta.label,
  })),
]

const environmentOptions: Array<{
  value: Filters['environment']
  label: string
}> = [
  { value: 'all', label: 'All Environments' },
  { value: 'testing', label: 'Testing' },
  { value: 'production', label: 'Production' },
  { value: 'unverified', label: 'Unverified' },
]

const statusOptions: Array<{ value: Filters['status']; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function FilterSelect<TValue extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: TValue
  options: Array<{ value: TValue; label: string }>
  onChange: (value: TValue) => void
  label: string
}) {
  return (
    <div className="relative w-full lg:w-40">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TValue)}
        className={cn(inputClassName, 'appearance-none pl-3')}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

const inputClassName = cn(
  'h-9 w-full rounded-lg border border-violet-100 bg-white pr-3 pl-9 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

function actionButtonClassName(variant: 'view' | 'delete') {
  return cn(
    'rounded-md border bg-white px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'view' &&
      'border-violet-200 text-paec-violet hover:border-paec-violet hover:bg-violet-50',
    variant === 'delete' &&
      'border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50',
  )
}

function StatusBadge({ status }: { status: PaymentGatewayStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
        status === 'active' && 'bg-emerald-100 text-emerald-700',
        status === 'inactive' && 'bg-red-100 text-red-600',
      )}
    >
      {status}
    </span>
  )
}

function KeyPreview({ value }: { value: string | null }) {
  return (
    <code className="inline-block max-w-[220px] truncate rounded-md bg-violet-50 px-2 py-0.5 align-middle font-mono text-[11px] text-foreground">
      {value ?? '—'}
    </code>
  )
}

function PaybizWallet({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-[11px] text-muted-foreground">N/A</span>
  }

  return (
    <code className="inline-block max-w-[220px] truncate rounded-md bg-orange-50 px-2 py-0.5 align-middle font-mono text-[11px] text-orange-700">
      {value}
    </code>
  )
}

function formatUpdatedAt(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AdminPaymentGatewaysSection() {
  const [gateways, setGateways] = useState<Array<PaymentGateway>>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PaymentGateway | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PaymentGateway | null>(null)
  const [filterInput, setFilterInput] = useState<Filters>(emptyFilters)
  const [filters, setFilters] = useState<Filters>(emptyFilters)

  const fetchGateways = useCallback(async () => {
    setLoading(true)
    try {
      const response = await paymentGatewayService.getPaymentGateways({
        q: filters.search.trim() || undefined,
        provider: filters.provider === 'all' ? undefined : filters.provider,
        environment:
          filters.environment === 'all' ? undefined : filters.environment,
        status: filters.status === 'all' ? undefined : filters.status,
        per_page: 100,
      })
      setGateways(response.data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load payment gateways.'))
      setGateways([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void fetchGateways()
  }, [fetchGateways])

  const updateFilterInput = <TKey extends keyof Filters>(
    key: TKey,
    value: Filters[TKey],
  ) => setFilterInput((prev) => ({ ...prev, [key]: value }))

  const applyFilters = () => setFilters(filterInput)

  const clearFilters = () => {
    setFilterInput(emptyFilters)
    setFilters(emptyFilters)
  }

  const openAdd = () => {
    setEditTarget(null)
    setFormOpen(true)
  }

  const openEdit = (gateway: PaymentGateway) => {
    setEditTarget(gateway)
    setFormOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      await paymentGatewayService.deletePaymentGateway(deleteTarget.uuid)
      toast.success('Payment gateway deleted.')
      setDeleteTarget(null)
      await fetchGateways()
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Failed to delete payment gateway.'),
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 md:h-full">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            Payment Gateway
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage payment gateway keys and secrets
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark sm:gap-2 sm:px-4 sm:text-sm"
        >
          <Plus className="size-3.5 sm:size-4" />
          <span className="sm:hidden">Add Payment</span>
          <span className="hidden sm:inline">Add Payment Gateway</span>
        </button>
      </div>

      <div className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={filterInput.search}
            onChange={(e) => updateFilterInput('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Payment name or ID..."
            className={inputClassName}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
          <FilterSelect
            label="Provider"
            value={filterInput.provider}
            options={providerOptions}
            onChange={(value) => updateFilterInput('provider', value)}
          />
          <FilterSelect
            label="Environment"
            value={filterInput.environment}
            options={environmentOptions}
            onChange={(value) => updateFilterInput('environment', value)}
          />
          <div className="col-span-2 sm:col-span-1">
            <FilterSelect
              label="Status"
              value={filterInput.status}
              options={statusOptions}
              onChange={(value) => updateFilterInput('status', value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-paec-violet px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark sm:text-sm"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-violet-50 sm:text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm md:min-h-0 md:flex-1">
        <div className="md:hidden">
          {loading ? (
            <LoadingState />
          ) : gateways.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            <ul className="divide-y divide-violet-50">
              {gateways.map((gateway) => (
                <PaymentGatewayCard
                  key={gateway.uuid}
                  gateway={gateway}
                  onEdit={() => openEdit(gateway)}
                  onDelete={() => setDeleteTarget(gateway)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="hidden min-h-0 flex-1 overflow-auto md:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-violet-50/95 backdrop-blur-sm">
              <tr className="border-b border-violet-100">
                {[
                  'Payment',
                  'Environment',
                  'Payment ID',
                  'Public Key',
                  'Paybiz Code / Wallet ID',
                  'Last Updated',
                  'Status',
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
                  <td colSpan={8}>
                    <LoadingState />
                  </td>
                </tr>
              ) : gateways.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState onAdd={openAdd} />
                  </td>
                </tr>
              ) : (
                gateways.map((gateway) => (
                  <PaymentGatewayRow
                    key={gateway.uuid}
                    gateway={gateway}
                    onEdit={() => openEdit(gateway)}
                    onDelete={() => setDeleteTarget(gateway)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentGatewayFormModal
        open={formOpen}
        gateway={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={() => void fetchGateways()}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete payment gateway"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? Its saved keys will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="px-4 py-12 text-center">
      <Loader2 className="mx-auto mb-2 size-6 animate-spin text-paec-violet" />
      <p className="text-sm text-muted-foreground">Loading payment gateways…</p>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="px-4 py-12 text-center">
      <KeyRound className="mx-auto mb-2 size-8 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">
        No payment gateways found
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 text-xs font-semibold text-paec-violet hover:underline"
      >
        Add your first payment gateway
      </button>
    </div>
  )
}

function PaymentGatewayCard({
  gateway,
  onEdit,
  onDelete,
}: {
  gateway: PaymentGateway
  onEdit: () => void
  onDelete: () => void
}) {
  const meta = getProviderMeta(gateway.provider)

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <ProviderChip provider={gateway.provider} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-bold text-foreground">
              {gateway.name}
            </p>
            <StatusBadge status={gateway.status} />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {meta.label} ·{' '}
            <span className="font-mono">ID: {gateway.gateway_id}</span>
          </p>
          <EnvironmentBadge
            environment={gateway.environment}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="mt-3 space-y-2 rounded-lg bg-violet-50/50 p-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground uppercase">
            {meta.publicKeyLabel}
          </p>
          <KeyPreview value={gateway.public_key_preview} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground uppercase">
            Paybiz Code / Wallet ID
          </p>
          <PaybizWallet value={gateway.paybiz_wallet_id} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground uppercase">Updated</p>
          <p className="text-foreground">
            {formatUpdatedAt(gateway.updated_at)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className={cn(actionButtonClassName('view'), 'h-9 text-xs')}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={cn(actionButtonClassName('delete'), 'h-9 text-xs')}
        >
          Delete
        </button>
      </div>
    </li>
  )
}

function PaymentGatewayRow({
  gateway,
  onEdit,
  onDelete,
}: {
  gateway: PaymentGateway
  onEdit: () => void
  onDelete: () => void
}) {
  const providerLabel = getProviderMeta(gateway.provider).label

  return (
    <tr className="border-b border-violet-50 transition-colors last:border-0 hover:bg-violet-50/30">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <ProviderChip provider={gateway.provider} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">{gateway.name}</p>
            {providerLabel !== gateway.name ? (
              <p className="text-[10px] text-muted-foreground">
                {providerLabel}
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <EnvironmentBadge environment={gateway.environment} />
      </td>
      <td className="px-3 py-2.5 font-mono text-xs text-foreground">
        {gateway.gateway_id}
      </td>
      <td className="px-3 py-2.5">
        <KeyPreview value={gateway.public_key_preview} />
      </td>
      <td className="px-3 py-2.5">
        <PaybizWallet value={gateway.paybiz_wallet_id} />
      </td>
      <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
        {formatUpdatedAt(gateway.updated_at)}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={gateway.status} />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className={actionButtonClassName('view')}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={actionButtonClassName('delete')}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
