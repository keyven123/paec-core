import type { AdminTransaction } from '@/services/adminTransactionService'

export function formatCurrency(
  amount: number | string | null | undefined,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  return `₱${(Number.isFinite(num) ? num : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatVisitDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const normalized = dateString.slice(0, 10)
  const [year, month, day] = normalized.split('-').map(Number)
  if (!year || !month || !day) return '—'

  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(time: string | null | undefined): string | null {
  if (!time) return null
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getVisitDate(tx: AdminTransaction): string | null {
  for (const order of tx.transaction_orders ?? []) {
    const visitDate = order.valid_until?.slice(0, 10)
    if (visitDate) return visitDate
  }
  return null
}

export function statusBadgeClass(status: string): string {
  const value = status.toLowerCase()
  if (['confirmed', 'paid', 'active'].includes(value)) {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (value === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }
  if (['cancelled', 'failed', 'expired', 'refunded'].includes(value)) {
    return 'bg-red-100 text-red-700'
  }
  if (['used', 'transferred'].includes(value)) {
    return 'bg-slate-100 text-slate-600'
  }
  return 'bg-violet-100 text-violet-700'
}
