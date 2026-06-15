import type { CreateActivityForm } from '@/types/createActivity'

import { ActivityMicrositePreview } from '../ActivityMicrositePreview'
import { sectionClassName } from '../formStyles'

type StepPreviewProps = {
  form: CreateActivityForm
}

export function StepPreview({ form }: StepPreviewProps) {
  return (
    <section className={sectionClassName}>
      <h2 className="text-base font-semibold text-foreground">Live Preview</h2>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        A close approximation of how this activity will appear to visitors.
      </p>

      <div className="mt-4">
        <ActivityMicrositePreview form={form} />
      </div>
    </section>
  )
}
