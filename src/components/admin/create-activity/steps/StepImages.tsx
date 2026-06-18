import type { CreateActivityForm } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'

import { ActivityImageField } from '../ActivityImageField'
import { ShowcaseImagesField } from '../ShowcaseImagesField'
import { sectionClassName } from '../formStyles'

type StepImagesProps = {
  form: CreateActivityForm | EditActivityForm
  onChange: (updates: Partial<CreateActivityForm | EditActivityForm>) => void
}

export function StepImages({ form, onChange }: StepImagesProps) {
  const editForm = form as EditActivityForm

  return (
    <section className={sectionClassName}>
      <h2 className="text-base font-semibold text-foreground">Activity Images</h2>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        Upload your visuals and preview how they appear in the customer app. Use
        Preview to view the full image before saving.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ActivityImageField
          label="Portrait Image"
          hint="Recommended: 4:5 ratio (e.g. 1080 × 1350px). Shown on mobile cards, rails and the hero poster."
          file={form.portraitImage}
          existingUrl={editForm.existingPortraitImage?.url}
          onFileChange={(file) => onChange({ portraitImage: file })}
          variant="portrait"
        />

        <ActivityImageField
          label="Featured (Landscape) Image"
          hint="Recommended: 940 × 788px. Used for the desktop hero banner and activity cards."
          file={form.featuredImage}
          existingUrl={editForm.existingFeaturedImage?.url}
          onFileChange={(file) => onChange({ featuredImage: file })}
          variant="landscape"
        />
      </div>

      <div className="mt-5 border-t border-violet-100 pt-5">
        <ShowcaseImagesField
          label="Activity Showcase (Multiple)"
          hint="Recommended: 940 × 788px. Displayed in the activity gallery grid."
          files={form.showcaseImages}
          existingImages={editForm.existingShowcaseImages}
          onChange={(files) => onChange({ showcaseImages: files })}
        />
      </div>
    </section>
  )
}
