import type { CreateActivityForm } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'

import { AttendeeFieldsSection } from '../AttendeeFieldsSection'

type StepAttendeeTrackingProps = {
  form: CreateActivityForm | EditActivityForm
  onChange: (updates: Partial<CreateActivityForm | EditActivityForm>) => void
}

export function StepAttendeeTracking({
  form,
  onChange,
}: StepAttendeeTrackingProps) {
  return (
    <div className="space-y-4">
      <AttendeeFieldsSection form={form} onChange={onChange} />
    </div>
  )
}
