import { Plus, Trash2 } from 'lucide-react'

import { AttendeeFieldsSection } from '@/components/admin/create-activity/AttendeeFieldsSection'
import { VISIT_POLICY_OPTIONS } from '@/lib/eventTicketForm'
import type { CreateActivityForm, CreateActivityTicket } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'

import { fieldClassName, labelClassName, sectionClassName } from '../formStyles'

type StepManageTicketsProps = {
  form: CreateActivityForm | EditActivityForm
  onChange: (updates: Partial<CreateActivityForm | EditActivityForm>) => void
}

function createEmptyTicket(): CreateActivityTicket {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    price: '',
    maxTicket: '500',
    isUnlimited: false,
    visitPolicy: 'priority',
    validityDays: 7,
  }
}

export function StepManageTickets({ form, onChange }: StepManageTicketsProps) {
  const tickets = form.tickets

  const updateTickets = (nextTickets: CreateActivityTicket[]) => {
    onChange({ tickets: nextTickets })
  }

  const updateTicket = (id: string, updates: Partial<CreateActivityTicket>) => {
    updateTickets(
      tickets.map((ticket) =>
        ticket.id === id ? { ...ticket, ...updates } : ticket,
      ),
    )
  }

  const addTicket = () => {
    updateTickets([...tickets, createEmptyTicket()])
  }

  const removeTicket = (id: string) => {
    if (tickets.length <= 1) return
    updateTickets(tickets.filter((ticket) => ticket.id !== id))
  }

  return (
    <div className="space-y-4">
      <section className={sectionClassName}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Manage Tickets
            </h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Add ticket types for this activity. They will be created when you
              publish the activity.
            </p>
          </div>
          <button
            type="button"
            onClick={addTicket}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-paec-orange px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-paec-orange-light"
          >
            <Plus className="size-3.5" />
            Add Ticket
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {tickets.map((ticket, index) => (
            <article
              key={ticket.id}
              className="rounded-xl border border-violet-100 bg-violet-50/20 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Ticket {index + 1}
                </h3>
                {tickets.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeTicket(ticket.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClassName}>
                    Ticket Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ticket.name}
                    onChange={(e) =>
                      updateTicket(ticket.id, { name: e.target.value })
                    }
                    placeholder="e.g. General Admission"
                    className={`${fieldClassName} mt-1.5`}
                  />
                </div>

                <div>
                  <label className={labelClassName}>
                    Price (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ticket.price}
                    onChange={(e) =>
                      updateTicket(ticket.id, { price: e.target.value })
                    }
                    placeholder="599"
                    className={`${fieldClassName} mt-1.5`}
                  />
                </div>

                <div>
                  <label className={labelClassName}>Visit Policy</label>
                  <select
                    value={ticket.visitPolicy}
                    onChange={(e) =>
                      updateTicket(ticket.id, {
                        visitPolicy: e.target.value as CreateActivityTicket['visitPolicy'],
                      })
                    }
                    className={`${fieldClassName} mt-1.5`}
                  >
                    {VISIT_POLICY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {ticket.visitPolicy === 'flexible' ? (
                  <div>
                    <label className={labelClassName}>
                      Validity Days <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ticket.validityDays || ''}
                      onChange={(e) =>
                        updateTicket(ticket.id, {
                          validityDays:
                            Number.parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className={`${fieldClassName} mt-1.5`}
                    />
                  </div>
                ) : null}

                <div>
                  <label className="mt-6 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ticket.isUnlimited}
                      onChange={(e) =>
                        updateTicket(ticket.id, {
                          isUnlimited: e.target.checked,
                          maxTicket: e.target.checked ? '999999999' : '500',
                        })
                      }
                      className="size-4 rounded border-violet-200 accent-paec-violet"
                    />
                    Unlimited tickets
                  </label>
                </div>

                {!ticket.isUnlimited ? (
                  <div>
                    <label className={labelClassName}>Max Tickets per day</label>
                    <input
                      type="number"
                      min="1"
                      value={ticket.maxTicket}
                      onChange={(e) =>
                        updateTicket(ticket.id, { maxTicket: e.target.value })
                      }
                      className={`${fieldClassName} mt-1.5`}
                    />
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <label className={labelClassName}>Description</label>
                  <textarea
                    value={ticket.description}
                    onChange={(e) =>
                      updateTicket(ticket.id, { description: e.target.value })
                    }
                    rows={2}
                    placeholder="Optional ticket description"
                    className={`${fieldClassName} mt-1.5 resize-none`}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <AttendeeFieldsSection form={form} onChange={onChange} />
    </div>
  )
}
