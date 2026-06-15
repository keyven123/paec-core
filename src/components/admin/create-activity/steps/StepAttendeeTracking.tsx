import type { CreateActivityForm } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'

import { AttendeeFieldsSection } from '../AttendeeFieldsSection'
import { fieldClassName, labelClassName, sectionClassName } from '../formStyles'

type StepAttendeeTrackingProps = {
  form: CreateActivityForm | EditActivityForm
  onChange: (updates: Partial<CreateActivityForm | EditActivityForm>) => void
  showMetaPixel?: boolean
}

export function StepAttendeeTracking({
  form,
  onChange,
  showMetaPixel = false,
}: StepAttendeeTrackingProps) {
  const editForm = form as EditActivityForm

  return (
    <div className="space-y-4">
      <AttendeeFieldsSection form={form} onChange={onChange} />

      {showMetaPixel ? (
        <section className={sectionClassName}>
          <h2 className="text-base font-semibold text-foreground">Meta Pixel</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Track conversions and visitor activity with Meta Pixel.
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editForm.enableMetaPixel}
              onChange={(e) =>
                onChange({ enableMetaPixel: e.target.checked } as Partial<EditActivityForm>)
              }
              className="size-4 rounded border-violet-200 accent-paec-violet"
            />
            Enable Meta Pixel tracking
          </label>
          {editForm.enableMetaPixel ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClassName}>
                  Meta Pixel ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.metaPixelId}
                  onChange={(e) =>
                    onChange({ metaPixelId: e.target.value } as Partial<EditActivityForm>)
                  }
                  className={`${fieldClassName} mt-1.5`}
                />
              </div>
              <div>
                <label className={labelClassName}>
                  Access Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.metaPixelAccessToken}
                  onChange={(e) =>
                    onChange({
                      metaPixelAccessToken: e.target.value,
                    } as Partial<EditActivityForm>)
                  }
                  className={`${fieldClassName} mt-1.5`}
                />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
