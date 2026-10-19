import { fieldClassName, labelClassName, sectionClassName } from '../formStyles'
import type { CreateActivityForm } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'
import { ACTIVITY_CATEGORY_OPTIONS } from '@/lib/activityCategories'

type StepBasicsProps = {
  form: CreateActivityForm | EditActivityForm
  onChange: (updates: Partial<CreateActivityForm | EditActivityForm>) => void
  categories?: Array<{ uuid: string; name: string }>
  useCategoryUuid?: boolean
}

const activityCategories = ACTIVITY_CATEGORY_OPTIONS

export function StepBasics({
  form,
  onChange,
  categories: apiCategories,
  useCategoryUuid = false,
}: StepBasicsProps) {
  const editForm = form as EditActivityForm

  return (
    <div className="space-y-4">
      <section className={sectionClassName}>
        <h2 className="text-base font-semibold text-foreground">
          Attraction Details
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClassName}>
              Fun Activity Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Enter fun activity name"
              className={`${fieldClassName} mt-1.5`}
            />
          </div>

          <div>
            <label className={labelClassName}>
              Activity Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Describe the fun activity. Use blank lines between paragraphs — they show the same way on the storefront."
              rows={10}
              className={`${fieldClassName} mt-1.5 resize-y whitespace-pre-wrap`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => onChange({ contactEmail: e.target.value })}
                placeholder="contact@example.com"
                className={`${fieldClassName} mt-1.5`}
              />
            </div>
            <div>
              <label className={labelClassName}>Contact Number</label>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => onChange({ contactNumber: e.target.value })}
                placeholder="e.g. +63 928 297 5671"
                className={`${fieldClassName} mt-1.5`}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Shown on this activity’s storefront page and featured banner.
              </p>
            </div>
          </div>

          <div>
            <label className={labelClassName}>
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={useCategoryUuid ? editForm.categoryUuid : form.category}
              onChange={(e) => {
                if (useCategoryUuid) {
                  const selected = apiCategories?.find(
                    (cat) => cat.uuid === e.target.value,
                  )
                  onChange({
                    categoryUuid: e.target.value,
                    category: selected?.name ?? '',
                  })
                } else {
                  onChange({ category: e.target.value })
                }
              }}
              className={`${fieldClassName} mt-1.5`}
            >
              <option value="">Select Category</option>
              {(useCategoryUuid
                ? (apiCategories ?? [])
                : activityCategories
              ).map((cat) => (
                <option
                  key={'uuid' in cat ? cat.uuid : cat.id}
                  value={'uuid' in cat ? cat.uuid : cat.label}
                >
                  {'name' in cat ? cat.name : cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName}>
              Schedule <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                  form.scheduleMode === 'daily'
                    ? 'border-paec-violet bg-violet-50/70 ring-1 ring-paec-violet/20'
                    : 'border-violet-100 bg-white hover:border-violet-200'
                }`}
              >
                <input
                  type="radio"
                  name={`${useCategoryUuid ? 'edit' : 'create'}-schedule-mode`}
                  checked={form.scheduleMode === 'daily'}
                  onChange={() =>
                    onChange({
                      scheduleMode: 'daily',
                      eventDate: '',
                      eventTimeStart: '',
                      eventTimeEnd: '',
                    })
                  }
                  className="mt-0.5 size-4 accent-paec-violet"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    Daily
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Ongoing activity. Customers pick any visit date.
                  </span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                  form.scheduleMode === 'specific_date'
                    ? 'border-paec-violet bg-violet-50/70 ring-1 ring-paec-violet/20'
                    : 'border-violet-100 bg-white hover:border-violet-200'
                }`}
              >
                <input
                  type="radio"
                  name={`${useCategoryUuid ? 'edit' : 'create'}-schedule-mode`}
                  checked={form.scheduleMode === 'specific_date'}
                  onChange={() => onChange({ scheduleMode: 'specific_date' })}
                  className="mt-0.5 size-4 accent-paec-violet"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    Specific date
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Single event on one date with a set time.
                  </span>
                </span>
              </label>
            </div>

            {form.scheduleMode === 'specific_date' ? (
              <div className="mt-3 grid gap-4 rounded-xl border border-violet-100 bg-violet-50/30 p-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className={labelClassName}>
                    Event date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => onChange({ eventDate: e.target.value })}
                    className={`${fieldClassName} mt-1.5`}
                  />
                </div>
                <div>
                  <label className={labelClassName}>
                    Start time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.eventTimeStart}
                    onChange={(e) =>
                      onChange({ eventTimeStart: e.target.value })
                    }
                    className={`${fieldClassName} mt-1.5`}
                  />
                </div>
                <div>
                  <label className={labelClassName}>
                    End time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.eventTimeEnd}
                    onChange={(e) => onChange({ eventTimeEnd: e.target.value })}
                    className={`${fieldClassName} mt-1.5`}
                  />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-3">
                  This creates one schedule only — customers book this date and
                  time window.
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => onChange({ city: e.target.value })}
                placeholder="e.g. Taguig, Pasay City"
                className={`${fieldClassName} mt-1.5`}
              />
            </div>
            <div>
              <label className={labelClassName}>Activity Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => onChange({ address: e.target.value })}
                placeholder="Street, district, landmark"
                className={`${fieldClassName} mt-1.5`}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
