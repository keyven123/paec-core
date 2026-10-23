import { Info, Plus, Send, X } from 'lucide-react'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'

import {
  isPaecFunActivity,
  TICKET_KIND_OPTIONS,
  VISIT_POLICY_OPTIONS,
  type EventTicketFormState,
  type TicketKind,
  type VisitPolicy,
} from '@/lib/eventTicketForm'
import { cn } from '@/lib/utils'
import type { AdminEvent } from '@/services/adminEventService'

const inputClassName =
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none'

const inputErrorClassName = 'border-red-300 focus:border-red-400 focus:ring-red-200'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

function FieldLabel({
  htmlFor,
  label,
  required,
  optional,
}: {
  htmlFor?: string
  label: string
  required?: boolean
  optional?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-foreground">
      {label}
      {required ? <span className="text-red-500"> *</span> : null}
      {optional ? (
        <span className="font-normal text-muted-foreground"> (optional)</span>
      ) : null}
    </label>
  )
}

export function InfoTip({ text }: { text: string }) {
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePosition = () => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const tooltipWidth = 260
    const margin = 12
    const top = Math.max(margin, rect.top - margin)
    let left = rect.right + 8
    if (left + tooltipWidth + margin > window.innerWidth) {
      left = Math.max(margin, rect.left - tooltipWidth - 8)
    }
    setPos({ top, left })
  }

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onScroll = () => updatePosition()
    const onResize = () => updatePosition()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      const el = anchorRef.current
      const target = event.target as Node | null
      if (!el || !target) return
      const tooltipEl = document.getElementById('paec-ticket-infotip')
      if (el.contains(target)) return
      if (tooltipEl?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="inline-flex items-center text-muted-foreground hover:text-paec-violet"
        aria-label="Info"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen((value) => !value)
        }}
      >
        <Info className="size-3.5" />
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              id="paec-ticket-infotip"
              role="tooltip"
              className="fixed z-[200] w-[260px] rounded-lg border border-violet-100 bg-white px-3 py-2 text-[11px] leading-4 text-foreground shadow-lg"
              style={{ top: pos.top, left: pos.left }}
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export type AdminActivityTicketFormFieldsProps = {
  idPrefix: string
  hideScheduleFields?: boolean
  isEdit?: boolean
  formData: EventTicketFormState
  setFormData: Dispatch<SetStateAction<EventTicketFormState>>
  validationErrors: Record<string, string | string[] | undefined>
  event: AdminEvent | null
  formatDate: (dateString: string) => string
  formatPrice: (price: string) => string
  formatTime: (timeString: string | null | undefined) => string
}

export function AdminActivityTicketFormFields({
  idPrefix,
  hideScheduleFields = false,
  isEdit = false,
  formData,
  setFormData,
  validationErrors,
  event,
  formatDate,
  formatPrice,
  formatTime,
}: AdminActivityTicketFormFieldsProps) {
  const fieldError = (key: string) => {
    const value = validationErrors[key]
    if (!value) return undefined
    return Array.isArray(value) ? value[0] : value
  }

  const schedules = event?.schedules ?? []
  const scheduleTimes =
    schedules.find((schedule) => schedule.uuid === formData.schedule_uuid)
      ?.schedule_times ?? []

  return (
    <div className="max-h-[60vh] space-y-4 overflow-y-auto py-1 pr-1">
      {!hideScheduleFields ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${idPrefix}-schedule`} label="Schedule" required />
            <select
              id={`${idPrefix}-schedule`}
              value={formData.schedule_uuid}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  schedule_uuid: event.target.value,
                  schedule_time_uuid: '',
                })
              }
              className={cn(
                inputClassName,
                fieldError('schedule_uuid') && inputErrorClassName,
              )}
            >
              <option value="">Select a schedule</option>
              {schedules.map((schedule) => (
                <option key={schedule.uuid} value={schedule.uuid}>
                  {formatDate(schedule.date_from ?? '')} -{' '}
                  {formatDate(schedule.date_to ?? '')}
                </option>
              ))}
            </select>
            <FieldError message={fieldError('schedule_uuid')} />
          </div>
          <div>
            <FieldLabel
              htmlFor={`${idPrefix}-schedule-time`}
              label="Schedule Time"
              required
            />
            <select
              id={`${idPrefix}-schedule-time`}
              value={formData.schedule_time_uuid}
              disabled={!formData.schedule_uuid}
              onChange={(event) =>
                setFormData({ ...formData, schedule_time_uuid: event.target.value })
              }
              className={cn(
                inputClassName,
                fieldError('schedule_time_uuid') && inputErrorClassName,
                !formData.schedule_uuid && 'opacity-60',
              )}
            >
              <option value="">Select a time slot</option>
              {scheduleTimes.map((time) => (
                <option key={time.uuid} value={time.uuid}>
                  {formatTime(time.time_start)} - {formatTime(time.time_end)}
                </option>
              ))}
            </select>
            <FieldError message={fieldError('schedule_time_uuid')} />
          </div>
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-1 block text-xs font-medium text-foreground">
          Ticket Type <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TICKET_KIND_OPTIONS.map((option) => {
            const selected = formData.ticket_kind === option.value
            return (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors',
                  selected
                    ? 'border-paec-violet bg-violet-50/70 ring-1 ring-paec-violet/30'
                    : 'border-violet-100 bg-white hover:border-violet-200',
                )}
              >
                <input
                  type="radio"
                  name={`${idPrefix}-ticket-kind`}
                  value={option.value}
                  checked={selected}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      ticket_kind: option.value as TicketKind,
                    })
                  }
                  className="mt-0.5 size-4 shrink-0 accent-paec-violet"
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
        <FieldError message={fieldError('ticket_kind')} />
      </fieldset>

      <div>
        <FieldLabel htmlFor={`${idPrefix}-name`} label="Name" required />
        <input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(event) =>
            setFormData({ ...formData, name: event.target.value })
          }
          className={cn(inputClassName, fieldError('name') && inputErrorClassName)}
        />
        <FieldError message={fieldError('name')} />
      </div>

      <div>
        <FieldLabel htmlFor={`${idPrefix}-description`} label="Description" />
        <textarea
          id={`${idPrefix}-description`}
          rows={3}
          value={formData.description}
          onChange={(event) =>
            setFormData({ ...formData, description: event.target.value })
          }
          className={cn(
            inputClassName,
            'min-h-20 py-2',
            fieldError('description') && inputErrorClassName,
          )}
        />
        <FieldError message={fieldError('description')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${idPrefix}-price`} label="Price" required />
          <input
            id={`${idPrefix}-price`}
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(event) =>
              setFormData({ ...formData, price: event.target.value })
            }
            className={cn(inputClassName, fieldError('price') && inputErrorClassName)}
          />
          <FieldError message={fieldError('price')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor={`${idPrefix}-is-unlimited`} label="Unlimited Ticket" />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                id={`${idPrefix}-is-unlimited`}
                type="checkbox"
                checked={formData.is_unlimited}
                onChange={(event) => {
                  const isUnlimited = event.target.checked
                  setFormData({
                    ...formData,
                    is_unlimited: isUnlimited,
                    max_ticket: isUnlimited ? '999999999' : '',
                  })
                }}
                className="size-4 rounded border-violet-200 accent-paec-violet"
              />
              <span>Yes</span>
            </label>
          </div>
          {!formData.is_unlimited ? (
            <div>
              <FieldLabel htmlFor={`${idPrefix}-max-ticket`} label="Max Tickets per day" />
              <input
                id={`${idPrefix}-max-ticket`}
                type="number"
                min="0"
                value={formData.max_ticket}
                onChange={(event) =>
                  setFormData({ ...formData, max_ticket: event.target.value })
                }
                className={cn(
                  inputClassName,
                  fieldError('max_ticket') && inputErrorClassName,
                )}
              />
              <FieldError message={fieldError('max_ticket')} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel
            htmlFor={`${idPrefix}-available-from`}
            label="Visit Available From"
            optional
          />
          <div className="flex gap-2">
            <input
              id={`${idPrefix}-available-from`}
              type="datetime-local"
              value={formData.available_from}
              onChange={(event) =>
                setFormData({ ...formData, available_from: event.target.value })
              }
              className={cn(
                inputClassName,
                'flex-1',
                fieldError('available_from') && inputErrorClassName,
              )}
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, available_from: '' })}
              disabled={!formData.available_from}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-violet-200 text-muted-foreground hover:bg-violet-50 disabled:opacity-40"
              title="Clear"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Limits which Date of Visit customers can choose. Leave empty for any
            date.
          </p>
          <FieldError message={fieldError('available_from')} />
        </div>
        <div>
          <FieldLabel
            htmlFor={`${idPrefix}-available-to`}
            label="Visit Available To"
            optional
          />
          <div className="flex gap-2">
            <input
              id={`${idPrefix}-available-to`}
              type="datetime-local"
              value={formData.available_to}
              onChange={(event) =>
                setFormData({ ...formData, available_to: event.target.value })
              }
              className={cn(
                inputClassName,
                'flex-1',
                fieldError('available_to') && inputErrorClassName,
              )}
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, available_to: '' })}
              disabled={!formData.available_to}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-violet-200 text-muted-foreground hover:bg-violet-50 disabled:opacity-40"
              title="Clear"
            >
              <X className="size-4" />
            </button>
          </div>
          <FieldError message={fieldError('available_to')} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel
            htmlFor={`${idPrefix}-display-order`}
            label="Display Order"
            required
          />
          <input
            id={`${idPrefix}-display-order`}
            type="number"
            min="1"
            value={formData.display_order}
            onChange={(event) =>
              setFormData({
                ...formData,
                display_order: Number.parseInt(event.target.value, 10) || 1,
              })
            }
            className={cn(
              inputClassName,
              fieldError('display_order') && inputErrorClassName,
            )}
          />
          <FieldError message={fieldError('display_order')} />
        </div>
        {isEdit ? (
          <div>
            <FieldLabel htmlFor={`${idPrefix}-status`} label="Status" />
            <select
              id={`${idPrefix}-status`}
              value={formData.status}
              onChange={(event) =>
                setFormData({ ...formData, status: event.target.value })
              }
              className={inputClassName}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        ) : null}
      </div>

      {isPaecFunActivity(event) ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${idPrefix}-visit-policy`} label="Visit Policy" />
            <div className="flex items-center gap-2">
              <select
                id={`${idPrefix}-visit-policy`}
                value={formData.visit_policy}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    visit_policy: event.target.value as VisitPolicy | '',
                  })
                }
                className={cn(inputClassName, 'flex-1')}
              >
                <option value="">Select visit policy</option>
                {VISIT_POLICY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formData.visit_policy ? (
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, visit_policy: '', validity_days: 0 })
                  }
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-violet-200 text-muted-foreground hover:bg-violet-50"
                  title="Clear visit policy"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            {formData.visit_policy === 'priority' ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Customers choose their preferred event date.
              </p>
            ) : null}
            {formData.visit_policy === 'flexible' ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Upon purchase, a fixed validity date is assigned.
              </p>
            ) : null}
          </div>
          {formData.visit_policy === 'flexible' ? (
            <div>
              <FieldLabel
                htmlFor={`${idPrefix}-validity-days`}
                label="Number of Days"
                required
              />
              <input
                id={`${idPrefix}-validity-days`}
                type="number"
                min="1"
                value={formData.validity_days || ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    validity_days: Number.parseInt(event.target.value, 10) || 0,
                  })
                }
                placeholder="e.g. 7"
                className={cn(
                  inputClassName,
                  fieldError('validity_days') && inputErrorClassName,
                )}
              />
              <FieldError message={fieldError('validity_days')} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.feature_on_flash_sale}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  feature_on_flash_sale: event.target.checked,
                  ...(event.target.checked
                    ? {}
                    : { flash_sale_from: '', flash_sale_to: '' }),
                })
              }
              className="size-4 rounded border-violet-200 accent-paec-violet"
            />
            <span className="flex items-center gap-1">
              Flash to Featured
              <InfoTip text="Show this ticket as a flash sale on the homepage. Use Flash Sale From / To for the purchase countdown window. Visit Available From / To still control which Date of Visit customers may pick." />
            </span>
          </label>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.ticket_limit_per_user !== null}
              onChange={(event) => {
                const enabled = event.target.checked
                setFormData({
                  ...formData,
                  ticket_limit_per_user: enabled
                    ? (formData.ticket_limit_per_user ?? 1)
                    : null,
                })
              }}
              className="size-4 rounded border-violet-200 accent-paec-violet"
            />
            <span className="flex items-center gap-1">
              Limit Ticket per User
              <InfoTip text="This is the maximum number of tickets a user can buy for this ticket type." />
            </span>
          </label>
          <FieldError message={fieldError('ticket_limit_per_user')} />
        </div>
      </div>

      {formData.feature_on_flash_sale ? (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-orange-200 bg-orange-50/40 p-4 sm:grid-cols-2">
          <div>
            <FieldLabel
              htmlFor={`${idPrefix}-flash-sale-from`}
              label="Flash Sale From"
              required
            />
            <div className="flex gap-2">
              <input
                id={`${idPrefix}-flash-sale-from`}
                type="datetime-local"
                value={formData.flash_sale_from}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    flash_sale_from: event.target.value,
                  })
                }
                className={cn(
                  inputClassName,
                  'flex-1',
                  fieldError('flash_sale_from') && inputErrorClassName,
                )}
              />
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, flash_sale_from: '' })
                }
                disabled={!formData.flash_sale_from}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-violet-200 text-muted-foreground hover:bg-violet-50 disabled:opacity-40"
                title="Clear"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              When the flash sale starts (purchase + homepage countdown).
            </p>
            <FieldError message={fieldError('flash_sale_from')} />
          </div>
          <div>
            <FieldLabel
              htmlFor={`${idPrefix}-flash-sale-to`}
              label="Flash Sale To"
              required
            />
            <div className="flex gap-2">
              <input
                id={`${idPrefix}-flash-sale-to`}
                type="datetime-local"
                value={formData.flash_sale_to}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    flash_sale_to: event.target.value,
                  })
                }
                className={cn(
                  inputClassName,
                  'flex-1',
                  fieldError('flash_sale_to') && inputErrorClassName,
                )}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, flash_sale_to: '' })}
                disabled={!formData.flash_sale_to}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-violet-200 text-muted-foreground hover:bg-violet-50 disabled:opacity-40"
                title="Clear"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              When the flash sale ends. Visit dates stay controlled by Visit
              Available From / To.
            </p>
            <FieldError message={fieldError('flash_sale_to')} />
          </div>
        </div>
      ) : null}

      {formData.ticket_limit_per_user !== null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel
              htmlFor={`${idPrefix}-ticket-limit-per-user`}
              label="Limit"
              required
            />
            <input
              id={`${idPrefix}-ticket-limit-per-user`}
              type="number"
              min="1"
              value={formData.ticket_limit_per_user}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10)
                setFormData({
                  ...formData,
                  ticket_limit_per_user: Number.isFinite(value)
                    ? Math.max(1, value)
                    : 1,
                })
              }}
              className={cn(
                inputClassName,
                fieldError('ticket_limit_per_user') && inputErrorClassName,
              )}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.is_bundle}
              disabled={event?.event_config === 'seat_selection'}
              onChange={(event) => {
                const isBundle = event.target.checked
                setFormData({
                  ...formData,
                  is_bundle: isBundle,
                  bundle_quantity: isBundle ? formData.bundle_quantity : '',
                  coupons: formData.coupons.map((coupon) => ({
                    ...coupon,
                    once_only: isBundle ? !!coupon.once_only : false,
                  })),
                })
              }}
              className="size-4 rounded border-violet-200 accent-paec-violet disabled:opacity-50"
            />
            <span className="flex items-center gap-1">
              Bundle Tickets
              <InfoTip text="Lets you create a bundled ticket. Example: buying this ticket gives 10 tickets." />
            </span>
          </label>
          <FieldError message={fieldError('is_bundle')} />
        </div>
        {formData.is_bundle ? (
          <div>
            <FieldLabel
              htmlFor={`${idPrefix}-bundle-quantity`}
              label="Quantity"
              required
            />
            <input
              id={`${idPrefix}-bundle-quantity`}
              type="number"
              min="1"
              value={formData.bundle_quantity}
              onChange={(event) =>
                setFormData({ ...formData, bundle_quantity: event.target.value })
              }
              className={cn(
                inputClassName,
                fieldError('bundle_quantity') && inputErrorClassName,
              )}
            />
            <FieldError message={fieldError('bundle_quantity')} />
          </div>
        ) : null}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.is_sponsor}
            onChange={(event) =>
              setFormData({ ...formData, is_sponsor: event.target.checked })
            }
            className="size-4 rounded border-violet-200 accent-paec-violet"
          />
          <span className="flex items-center gap-1">
            Sponsor
            <InfoTip text="Marks this as a sponsor ticket. The Send Sponsor button appears on this ticket in Manage Tickets, and complimentary sponsor e-tickets can be emailed from there." />
          </span>
        </label>
        {formData.is_sponsor ? (
          <div className="mt-3 flex gap-2.5 rounded-xl border border-orange-200 bg-orange-50 p-3.5 text-xs leading-relaxed text-orange-900 sm:text-sm">
            <Send className="mt-0.5 size-4 shrink-0 text-paec-orange" />
            <p>
              Sponsor sending is enabled for this ticket. To customize the{' '}
              <strong>Terms and Conditions</strong> printed on the sponsor
              e-ticket design, tick <strong>Terms and Conditions</strong>{' '}
              below and write your text — it replaces the default sponsor
              terms. Leave it unticked to use the standard sponsor wording.
            </p>
          </div>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={formData.with_operations}
          onChange={(event) =>
            setFormData({
              ...formData,
              with_operations: event.target.checked,
              ...(event.target.checked
                ? {}
                : {
                    operation_days: 'any' as const,
                    operation_custom_days: [
                      'mon',
                      'tue',
                      'wed',
                      'thu',
                      'fri',
                      'sat',
                      'sun',
                    ] as const,
                    operation_hours_from: '',
                    operation_hours_to: '',
                  }),
            })
          }
          className="size-4 rounded border-violet-200 accent-paec-violet"
        />
        <span className="flex items-center gap-1">
          Operations
          <InfoTip text="Limit this ticket to specific days of the week, and set operation hours so customers can pick a visit time." />
        </span>
      </label>

      {formData.with_operations ? (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-violet-100 bg-violet-50/30 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel
              htmlFor={`${idPrefix}-operation-days`}
              label="Available days"
            />
            <select
              id={`${idPrefix}-operation-days`}
              value={formData.operation_days}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  operation_days: event.target.value as
                    | 'any'
                    | 'weekdays'
                    | 'weekends'
                    | 'custom',
                  ...(event.target.value === 'custom' &&
                  formData.operation_custom_days.length === 0
                    ? {
                        operation_custom_days: [
                          'mon',
                          'tue',
                          'wed',
                          'thu',
                          'fri',
                          'sat',
                          'sun',
                        ],
                      }
                    : {}),
                })
              }
              className={inputClassName}
            >
              <option value="any">Any day</option>
              <option value="weekdays">Weekdays only (Mon–Fri)</option>
              <option value="weekends">Weekends only (Sat–Sun)</option>
              <option value="custom">Custom</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Customers can only book a Date of Visit on these days.
            </p>
            {formData.operation_days === 'custom' ? (
              <div className="mt-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      ['mon', 'Monday'],
                      ['tue', 'Tuesday'],
                      ['wed', 'Wednesday'],
                      ['thu', 'Thursday'],
                      ['fri', 'Friday'],
                      ['sat', 'Saturday'],
                      ['sun', 'Sunday'],
                    ] as const
                  ).map(([key, label]) => {
                    const checked = formData.operation_custom_days.includes(key)
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 rounded-lg border border-violet-100 bg-white px-2.5 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              operation_custom_days: checked
                                ? formData.operation_custom_days.filter(
                                    (day) => day !== key,
                                  )
                                : [...formData.operation_custom_days, key],
                            })
                          }
                          className="size-4 rounded border-violet-200 accent-paec-violet"
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
                <FieldError message={fieldError('operation_custom_days')} />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Unchecked days are not available for this ticket.
                </p>
              </div>
            ) : null}
          </div>
          <div>
            <FieldLabel
              htmlFor={`${idPrefix}-operation-hours-from`}
              label="Operation hours from"
              optional
            />
            <input
              id={`${idPrefix}-operation-hours-from`}
              type="time"
              value={formData.operation_hours_from}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  operation_hours_from: event.target.value,
                })
              }
              className={cn(
                inputClassName,
                fieldError('operation_hours_from') && inputErrorClassName,
              )}
            />
            <FieldError message={fieldError('operation_hours_from')} />
          </div>
          <div>
            <FieldLabel
              htmlFor={`${idPrefix}-operation-hours-to`}
              label="Operation hours to"
              optional
            />
            <input
              id={`${idPrefix}-operation-hours-to`}
              type="time"
              value={formData.operation_hours_to}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  operation_hours_to: event.target.value,
                })
              }
              className={cn(
                inputClassName,
                fieldError('operation_hours_to') && inputErrorClassName,
              )}
            />
            <FieldError message={fieldError('operation_hours_to')} />
            <p className="mt-1 text-xs text-muted-foreground">
              When set, customers choose a visit time within this window.
            </p>
          </div>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={formData.with_discount}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              with_discount: event.target.checked,
              discount_type: event.target.checked ? current.discount_type : '',
              discount_value: event.target.checked ? current.discount_value : '',
            }))
          }
          className="size-4 rounded border-violet-200 accent-paec-violet"
        />
        <span className="flex items-center gap-1">
          With Discount
          <InfoTip text="Adds a discount to display for this ticket." />
        </span>
      </label>

      {formData.with_discount ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel
              htmlFor={`${idPrefix}-discount-type`}
              label="Discount Type"
              required
            />
            <select
              id={`${idPrefix}-discount-type`}
              value={formData.discount_type}
              onChange={(event) =>
                setFormData({ ...formData, discount_type: event.target.value })
              }
              className={cn(
                inputClassName,
                fieldError('discount_type') && inputErrorClassName,
              )}
            >
              <option value="">Select discount type</option>
              <option value="percentage">Percentage</option>
              <option value="amount">Amount</option>
            </select>
            <FieldError message={fieldError('discount_type')} />
          </div>
          <div>
            <FieldLabel
              htmlFor={`${idPrefix}-discount-value`}
              label="Discount Value"
              required
            />
            <input
              id={`${idPrefix}-discount-value`}
              type="number"
              min="0"
              step="0.01"
              max={
                formData.discount_type === 'percentage'
                  ? '100'
                  : formData.price || undefined
              }
              value={formData.discount_value}
              onChange={(event) =>
                setFormData({ ...formData, discount_value: event.target.value })
              }
              placeholder={
                formData.discount_type === 'percentage' ? '0-100' : '0'
              }
              className={cn(
                inputClassName,
                fieldError('discount_value') && inputErrorClassName,
              )}
            />
            {formData.discount_type === 'percentage' ? (
              <p className="mt-1 text-xs text-muted-foreground">0–100%</p>
            ) : null}
            {formData.discount_type === 'amount' && formData.price ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Max: {formatPrice(formData.price)}
              </p>
            ) : null}
            <FieldError message={fieldError('discount_value')} />
          </div>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={formData.with_coupon}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              with_coupon: event.target.checked,
              coupons:
                event.target.checked && current.coupons.length === 0
                  ? [{ name: '', once_only: false }]
                  : current.coupons,
            }))
          }
          className="size-4 rounded border-violet-200 accent-paec-violet"
        />
        <span className="flex items-center gap-1">
          Attach coupons
          <InfoTip text="Adds coupons to this ticket (e.g., Lunch, Certificate, etc.)." />
        </span>
      </label>

      {formData.with_coupon ? (
        <div className="space-y-2">
          {formData.coupons.map((coupon, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <input
                value={coupon.name}
                onChange={(event) => {
                  const next = [...formData.coupons]
                  next[index] = { ...next[index], name: event.target.value }
                  setFormData({ ...formData, coupons: next })
                }}
                placeholder="Coupon name"
                className={cn(inputClassName, 'min-w-0 flex-1')}
              />
              {formData.is_bundle ? (
                <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={!!coupon.once_only}
                    onChange={(event) => {
                      const next = [...formData.coupons]
                      next[index] = {
                        ...next[index],
                        once_only: event.target.checked,
                      }
                      setFormData({ ...formData, coupons: next })
                    }}
                    className="size-4 rounded border-violet-200 accent-paec-violet"
                  />
                  Once only
                  <InfoTip text="If checked, only 1 coupon will be given to the bundled ticket. If unchecked, tickets will have 1 coupon each." />
                </label>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    coupons: formData.coupons.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
                className="inline-flex size-10 items-center justify-center rounded-lg border border-violet-200 text-muted-foreground hover:bg-violet-50"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                coupons: [...formData.coupons, { name: '', once_only: false }],
              })
            }
            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold hover:bg-violet-50"
          >
            <Plus className="size-3.5" />
            Add coupon
          </button>
          <FieldError message={fieldError('coupons')} />
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={formData.with_terms_and_conditions}
          onChange={(event) =>
            setFormData({
              ...formData,
              with_terms_and_conditions: event.target.checked,
              terms_and_conditions: event.target.checked
                ? formData.terms_and_conditions
                : '',
            })
          }
          className="size-4 rounded border-violet-200 accent-paec-violet"
        />
        <span className="flex items-center gap-1">
          Terms and Conditions
          <InfoTip text="Printed on the ticket the customer downloads and receives by email. For Gift Certificate tickets it appears in the Terms and Conditions panel. For Sponsor tickets, this text replaces the default terms on the sponsor e-ticket design." />
        </span>
      </label>

      {formData.with_terms_and_conditions ? (
        <div>
          <FieldLabel
            htmlFor={`${idPrefix}-terms-and-conditions`}
            label="Terms and Conditions"
            required
          />
          <textarea
            id={`${idPrefix}-terms-and-conditions`}
            rows={5}
            maxLength={5000}
            value={formData.terms_and_conditions}
            onChange={(event) =>
              setFormData({
                ...formData,
                terms_and_conditions: event.target.value,
              })
            }
            placeholder={
              'e.g. Present the QR code at the entrance for admission.\nTickets are non-transferable unless approved by the organizer.\nLost or duplicated tickets may be voided.'
            }
            className={cn(
              inputClassName,
              'min-h-28 resize-y py-2 leading-relaxed',
              fieldError('terms_and_conditions') && inputErrorClassName,
            )}
          />
          <div className="mt-1 flex items-start justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Shown on the downloaded and emailed ticket — including the
              sponsor e-ticket design when Sponsor is enabled. One condition
              per line works best.
            </p>
            <p className="shrink-0 text-xs text-muted-foreground">
              {formData.terms_and_conditions.length}/5000
            </p>
          </div>
          <FieldError message={fieldError('terms_and_conditions')} />
        </div>
      ) : null}
    </div>
  )
}
