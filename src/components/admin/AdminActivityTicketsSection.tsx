import { Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  Copy,
  Edit,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AdminActivityTicketFormFields } from '@/components/admin/AdminActivityTicketFormFields'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '@/lib/api'
import {
  buildCreateTicketPayload,
  buildUpdateTicketPayload,
  emptyEventTicketForm,
  shouldHideScheduleFields,
  ticketToForm,
  validateEventTicketForm,
  type EventTicketFormState,
} from '@/lib/eventTicketForm'
import { cn } from '@/lib/utils'
import { adminEventService, type AdminEvent } from '@/services/adminEventService'
import {
  adminEventTicketService,
  type AdminEventTicket,
} from '@/services/adminEventTicketService'

type AdminActivityTicketsSectionProps = {
  activityId: string
}

const cardClassName =
  'rounded-xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6'

function formatPrice(value: number | string) {
  const amount = typeof value === 'number' ? value : Number.parseFloat(value)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount)
}

function getDiscountedPrice(ticket: AdminEventTicket) {
  if (!ticket.discount_type || !ticket.discount_value) return null
  const original = Number.parseFloat(ticket.price)
  const discount = Number.parseFloat(ticket.discount_value)
  if (ticket.discount_type === 'percentage') {
    return {
      final: original * (1 - discount / 100),
      label: `(${discount}%)`,
    }
  }
  return {
    final: Math.max(0, original - discount),
    label: `(-${formatPrice(discount)})`,
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(timeString: string | null | undefined) {
  if (!timeString) return '—'
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10))
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function AdminActivityTicketsSection({
  activityId,
}: AdminActivityTicketsSectionProps) {
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [tickets, setTickets] = useState<AdminEventTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<AdminEventTicket | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<AdminEventTicket | null>(
    null,
  )
  const [form, setForm] = useState<EventTicketFormState>(emptyEventTicketForm())
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | string[] | undefined>
  >({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [eventRes, ticketList] = await Promise.all([
        adminEventService.getEventDetails(activityId),
        adminEventTicketService.getEventTickets(activityId),
      ])
      setEvent(eventRes.data)
      setTickets(ticketList)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load tickets.'))
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const openCreate = () => {
    setEditingTicket(null)
    setForm(emptyEventTicketForm())
    setValidationErrors({})
    setFormOpen(true)
  }

  const openEdit = (ticket: AdminEventTicket) => {
    setEditingTicket(ticket)
    setForm(ticketToForm(ticket, event))
    setValidationErrors({})
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    const clientErrors = validateEventTicketForm(
      form,
      event,
      editingTicket !== null,
    )
    if (Object.keys(clientErrors).length > 0) {
      setValidationErrors(clientErrors)
      toast.error('Please fill in the required fields.')
      return
    }

    setSubmitting(true)
    setValidationErrors({})
    try {
      if (editingTicket) {
        await adminEventTicketService.updateTicket(
          editingTicket.uuid,
          buildUpdateTicketPayload(form),
        )
        toast.success('Ticket updated successfully.')
      } else {
        await adminEventTicketService.createTicket(
          buildCreateTicketPayload(activityId, form, event),
        )
        toast.success('Ticket created successfully.')
      }
      setFormOpen(false)
      await loadData()
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      if (Object.keys(apiErrors).length > 0) {
        setValidationErrors(apiErrors)
        toast.error('Please fill in the required fields.')
      } else {
        toast.error(getApiErrorMessage(err, 'Failed to save ticket.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminEventTicketService.deleteTicket(deleteTarget.uuid)
      toast.success('Ticket deleted successfully.')
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete ticket.'))
    } finally {
      setDeleting(false)
    }
  }

  const handleDuplicate = async (ticket: AdminEventTicket) => {
    setDuplicatingId(ticket.uuid)
    try {
      await adminEventTicketService.duplicateTicket(ticket.uuid)
      toast.success('Ticket duplicated successfully.')
      await loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to duplicate ticket.'))
    } finally {
      setDuplicatingId(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 border-b border-violet-100 pb-4">
        <Link
          to="/admin/activities/$activityId"
          params={{ activityId }}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back to Activity
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
              Event Tickets
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage pricing and ticket configurations
              {event ? ` · ${event.event_name}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-paec-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-paec-violet-dark"
          >
            <Plus className="size-4" />
            Add Event Ticket
          </button>
        </div>

      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Loading tickets…
          </p>
        ) : tickets.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No tickets found. Add your first event ticket.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.uuid}
                ticket={ticket}
                duplicating={duplicatingId === ticket.uuid}
                onEdit={() => openEdit(ticket)}
                onDelete={() => setDeleteTarget(ticket)}
                onDuplicate={() => void handleDuplicate(ticket)}
              />
            ))}
          </div>
        )}
      </div>

      {formOpen ? (
        <TicketFormModal
          form={form}
          setForm={setForm}
          event={event}
          isEdit={!!editingTicket}
          submitting={submitting}
          validationErrors={validationErrors}
          onClose={() => {
            if (!submitting) setFormOpen(false)
          }}
          onSubmit={() => void handleSubmit()}
        />
      ) : null}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete ticket"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

function TicketCard({
  ticket,
  duplicating,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  ticket: AdminEventTicket
  duplicating: boolean
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const discount = getDiscountedPrice(ticket)

  return (
    <article className={cn(cardClassName, 'relative flex flex-col')}>
      <button
        type="button"
        onClick={onDuplicate}
        disabled={duplicating}
        className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-violet-50 disabled:opacity-50"
      >
        <Copy className="size-3.5" />
        {duplicating ? 'Duplicating…' : 'Duplicate'}
      </button>

      <div className="pr-24">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">
            {ticket.name}
          </h3>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
              ticket.status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700',
            )}
          >
            {ticket.status}
          </span>
          {ticket.is_bundle ? (
            <span className="rounded-full bg-paec-violet/10 px-2 py-0.5 text-[11px] font-semibold text-paec-violet">
              Bundle
            </span>
          ) : null}
        </div>

        {discount ? (
          <div className="mb-3 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-bold text-paec-orange">
              {formatPrice(discount.final)}
            </span>
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(ticket.price)}
            </span>
            <span className="text-sm font-semibold text-paec-orange">
              {discount.label}
            </span>
          </div>
        ) : (
          <p className="mb-3 text-2xl font-bold text-paec-orange">
            {formatPrice(ticket.price)}
          </p>
        )}

        {ticket.description ? (
          <p className="mb-3 text-sm text-muted-foreground">
            {ticket.description}
          </p>
        ) : null}
      </div>

      <dl className="mb-4 space-y-1.5 text-sm">
        {[
          ['Sold', String(ticket.sold_ticket)],
          ['Code', ticket.code],
          [
            'Max Tickets per day',
            ticket.is_unlimited ? 'Unlimited' : String(ticket.max_ticket),
          ],
          [
            'Bundle',
            ticket.is_bundle
              ? `${ticket.bundle_quantity ?? 0} tickets`
              : 'No',
          ],
          ['Order', String(ticket.display_order)],
          ['Virtual', ticket.is_virtual ? 'Yes' : 'No'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto flex gap-2 border-t border-violet-50 pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold hover:bg-violet-50"
        >
          <Edit className="size-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          <Trash2 className="size-3.5" />
          Delete
        </button>
      </div>
    </article>
  )
}

function TicketFormModal({
  form,
  setForm,
  event,
  isEdit,
  submitting,
  validationErrors,
  onClose,
  onSubmit,
}: {
  form: EventTicketFormState
  setForm: React.Dispatch<React.SetStateAction<EventTicketFormState>>
  event: AdminEvent | null
  isEdit: boolean
  submitting: boolean
  validationErrors: Record<string, string | string[] | undefined>
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-violet-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-violet-100 px-6 py-4">
          <h3 className="text-lg font-bold text-foreground">
            {isEdit ? 'Edit Event Ticket' : 'Add Event Ticket'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-violet-50 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <AdminActivityTicketFormFields
            idPrefix={isEdit ? 'edit-ticket' : 'create-ticket'}
            hideScheduleFields={shouldHideScheduleFields(event)}
            isEdit={isEdit}
            formData={form}
            setFormData={setForm}
            validationErrors={validationErrors}
            event={event}
            formatDate={formatDate}
            formatPrice={(price) => formatPrice(price)}
            formatTime={formatTime}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-violet-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-violet-200 px-4 py-2.5 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-lg bg-paec-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-paec-violet-dark disabled:opacity-50"
          >
            {submitting ? 'Saving…' : isEdit ? 'Update Ticket' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}
