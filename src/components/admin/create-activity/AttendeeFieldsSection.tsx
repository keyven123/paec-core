import { Plus, X } from 'lucide-react'

import type { AttendeeField, CreateActivityForm } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'

import { fieldClassName, sectionClassName } from './formStyles'

type AttendeeFieldsSectionProps = {
  form: CreateActivityForm | EditActivityForm
  onChange: (updates: Partial<CreateActivityForm | EditActivityForm>) => void
}

export function AttendeeFieldsSection({
  form,
  onChange,
}: AttendeeFieldsSectionProps) {
  const addField = () => {
    const field: AttendeeField = {
      id: crypto.randomUUID(),
      label: '',
      required: false,
    }
    onChange({ attendeeFields: [...form.attendeeFields, field] })
  }

  const updateField = (id: string, updates: Partial<AttendeeField>) => {
    onChange({
      attendeeFields: form.attendeeFields.map((f) =>
        f.id === id ? { ...f, ...updates } : f,
      ),
    })
  }

  const removeField = (id: string) => {
    onChange({
      attendeeFields: form.attendeeFields.filter((f) => f.id !== id),
    })
  }

  return (
    <section className={sectionClassName}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Attendee Information Fields
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Define additional information attendees must provide during
            registration (e.g., company, role, shirt size).
          </p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-paec-violet px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark"
        >
          <Plus className="size-3.5" />
          Add Field
        </button>
      </div>

      {form.attendeeFields.length === 0 ? (
        <div className="mt-4 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No custom fields added yet. Click &apos;Add Field&apos; to get
            started.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {form.attendeeFields.map((field) => (
            <li
              key={field.id}
              className="flex flex-col gap-2 rounded-lg border border-violet-100 bg-violet-50/20 p-3 sm:flex-row sm:items-center"
            >
              <input
                type="text"
                value={field.label}
                onChange={(e) =>
                  updateField(field.id, { label: e.target.value })
                }
                placeholder="Field label"
                className={fieldClassName}
              />
              <label className="flex shrink-0 items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField(field.id, { required: e.target.checked })
                  }
                  className="size-4 rounded border-violet-200 text-paec-violet"
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => removeField(field.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Remove field"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
