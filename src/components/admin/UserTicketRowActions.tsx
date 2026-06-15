import { ScanLine, Send, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { adminTicketService } from '@/services/adminTicketService'
import { ticketScannerService } from '@/services/ticketScannerService'
import {
  userManagementService,
  type CustomerUser,
} from '@/services/userManagementService'
import type { UserTicket } from '@/services/userStatsService'

type UserTicketRowActionsProps = {
  ticket: UserTicket
  currentUserUuid: string
  onActionComplete: () => void
}

type ActionType = 'cancel' | 'transfer' | 'scan'

function canPerformActions(ticket: UserTicket): boolean {
  return ticket.status === 'active' && !ticket.used_at
}

const actionButtonClassName = cn(
  'flex size-7 items-center justify-center rounded-md transition-colors',
  'disabled:cursor-not-allowed disabled:opacity-40',
)

export function UserTicketRowActions({
  ticket,
  currentUserUuid,
  onActionComplete,
}: UserTicketRowActionsProps) {
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)
  const [loading, setLoading] = useState(false)

  const actionsEnabled = canPerformActions(ticket)

  const closeAction = () => {
    if (loading) return
    setActiveAction(null)
  }

  return (
    <>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Cancel ticket"
          disabled={!actionsEnabled}
          onClick={() => setActiveAction('cancel')}
          className={cn(actionButtonClassName, 'text-red-600 hover:bg-red-50')}
        >
          <XCircle className="size-3.5" />
        </button>
        <button
          type="button"
          title="Transfer ticket"
          disabled={!actionsEnabled}
          onClick={() => setActiveAction('transfer')}
          className={cn(actionButtonClassName, 'text-paec-violet hover:bg-violet-50')}
        >
          <Send className="size-3.5" />
        </button>
        <button
          type="button"
          title="Manual scan ticket"
          disabled={!actionsEnabled}
          onClick={() => setActiveAction('scan')}
          className={cn(actionButtonClassName, 'text-emerald-600 hover:bg-emerald-50')}
        >
          <ScanLine className="size-3.5" />
        </button>
      </div>

      <CancelTicketModal
        open={activeAction === 'cancel'}
        ticket={ticket}
        loading={loading}
        onClose={closeAction}
        onConfirm={async (remarks) => {
          setLoading(true)
          try {
            await adminTicketService.cancelTicket(ticket.uuid, remarks)
            toast.success('Ticket cancelled successfully.')
            setActiveAction(null)
            onActionComplete()
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to cancel ticket.'))
          } finally {
            setLoading(false)
          }
        }}
      />

      <TransferTicketModal
        open={activeAction === 'transfer'}
        ticket={ticket}
        currentUserUuid={currentUserUuid}
        loading={loading}
        onClose={closeAction}
        onConfirm={async (userUuid) => {
          setLoading(true)
          try {
            await adminTicketService.transferTicket(ticket.uuid, userUuid)
            toast.success('Ticket transferred successfully.')
            setActiveAction(null)
            onActionComplete()
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to transfer ticket.'))
          } finally {
            setLoading(false)
          }
        }}
      />

      <ConfirmModal
        open={activeAction === 'scan'}
        title="Manual Scan Ticket"
        message={`Confirm entry for ticket ${ticket.ticket_number}? This will mark the ticket as used.`}
        confirmLabel="Confirm Scan"
        loading={loading}
        onClose={closeAction}
        onConfirm={async () => {
          setLoading(true)
          try {
            await ticketScannerService.confirmEntry(ticket.uuid)
            toast.success('Ticket scanned successfully.')
            setActiveAction(null)
            onActionComplete()
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to scan ticket.'))
          } finally {
            setLoading(false)
          }
        }}
      />
    </>
  )
}

function CancelTicketModal({
  open,
  ticket,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean
  ticket: UserTicket
  loading: boolean
  onClose: () => void
  onConfirm: (remarks: string) => void
}) {
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    if (!open) setRemarks('')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
        aria-label="Close modal"
        disabled={loading}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl">
        <div className="border-b border-violet-100 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">Cancel Ticket</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cancel ticket {ticket.ticket_number}? This action cannot be undone.
          </p>
        </div>

        <div className="px-6 py-4">
          <label htmlFor="cancel-remarks" className="text-xs font-medium text-foreground">
            Remarks (optional)
          </label>
          <textarea
            id="cancel-remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Reason for cancellation..."
            className={cn(
              'mt-1.5 w-full rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm text-foreground',
              'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
            )}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-violet-100 bg-violet-50/40 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void onConfirm(remarks.trim())}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Please wait…' : 'Cancel Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TransferTicketModal({
  open,
  ticket,
  currentUserUuid,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean
  ticket: UserTicket
  currentUserUuid: string
  loading: boolean
  onClose: () => void
  onConfirm: (userUuid: string) => void
}) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [users, setUsers] = useState<CustomerUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUserUuid, setSelectedUserUuid] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setDebouncedSearch('')
      setUsers([])
      setSelectedUserUuid(null)
      return
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const loadUsers = async () => {
      setUsersLoading(true)
      try {
        const response = await userManagementService.getCustomers({
          q: debouncedSearch.trim() || undefined,
          per_page: 8,
        })
        setUsers(
          (response.data ?? []).filter((user) => user.uuid !== currentUserUuid),
        )
      } catch {
        setUsers([])
      } finally {
        setUsersLoading(false)
      }
    }

    void loadUsers()
  }, [open, debouncedSearch, currentUserUuid])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
        aria-label="Close modal"
        disabled={loading}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl">
        <div className="border-b border-violet-100 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">Transfer Ticket</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Transfer {ticket.ticket_number} to another customer.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <label htmlFor="transfer-search" className="text-xs font-medium text-foreground">
            Search customer
          </label>
          <input
            id="transfer-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className={cn(
              'mt-1.5 h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
              'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
            )}
          />

          <div className="mt-3 space-y-1.5">
            {usersLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Searching...</p>
            ) : users.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No customers found.
              </p>
            ) : (
              users.map((user) => (
                <button
                  key={user.uuid}
                  type="button"
                  onClick={() => setSelectedUserUuid(user.uuid)}
                  className={cn(
                    'flex w-full flex-col rounded-lg border px-3 py-2.5 text-left transition-colors',
                    selectedUserUuid === user.uuid
                      ? 'border-paec-violet bg-violet-50'
                      : 'border-violet-100 hover:bg-violet-50/50',
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{user.full_name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-violet-100 bg-violet-50/40 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedUserUuid) {
                toast.error('Please select a customer to transfer to.')
                return
              }
              void onConfirm(selectedUserUuid)
            }}
            disabled={loading || !selectedUserUuid}
            className="rounded-lg bg-paec-violet px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Please wait…' : 'Transfer Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}
