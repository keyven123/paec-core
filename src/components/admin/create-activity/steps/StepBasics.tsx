import { categories } from '@/data/mockAttractions'
import type { CreateActivityForm } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'

import { fieldClassName, labelClassName, sectionClassName } from '../formStyles'

type StepBasicsProps = {
  form: CreateActivityForm | EditActivityForm
  onChange: (updates: Partial<CreateActivityForm | EditActivityForm>) => void
  categories?: { uuid: string; name: string }[]
  useCategoryUuid?: boolean
}

const activityCategories = categories.filter((c) => c.id !== 'all')

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
              placeholder="Describe the fun activity"
              rows={4}
              className={`${fieldClassName} mt-1.5 resize-none`}
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
                    } as Partial<EditActivityForm>)
                  } else {
                    onChange({ category: e.target.value })
                  }
                }}
                className={`${fieldClassName} mt-1.5`}
              >
                <option value="">Select Category</option>
                {(useCategoryUuid ? apiCategories ?? [] : activityCategories).map(
                  (cat) => (
                    <option
                      key={'uuid' in cat ? cat.uuid : cat.id}
                      value={'uuid' in cat ? cat.uuid : cat.label}
                    >
                      {'name' in cat ? cat.name : cat.label}
                    </option>
                  ),
                )}
              </select>
            </div>
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
