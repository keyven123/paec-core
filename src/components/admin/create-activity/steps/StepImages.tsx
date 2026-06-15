import type { CreateActivityForm } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'

import { ImageUploadZone } from '../ImageUploadZone'
import { sectionClassName } from '../formStyles'

type StepImagesProps = {
  form: CreateActivityForm | EditActivityForm
  onChange: (updates: Partial<CreateActivityForm | EditActivityForm>) => void
}

function ExistingImagePreview({
  label,
  url,
}: {
  label: string
  url: string
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <img
        src={url}
        alt={label}
        className="h-32 w-full rounded-lg border border-violet-100 object-cover"
      />
    </div>
  )
}

export function StepImages({ form, onChange }: StepImagesProps) {
  const editForm = form as EditActivityForm
  return (
    <section className={sectionClassName}>
      <h2 className="text-base font-semibold text-foreground">Activity Images</h2>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        These visuals appear in the customer app and activity microsite.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          {editForm.existingPortraitImage && !form.portraitImage ? (
            <ExistingImagePreview
              label="Current Portrait Image"
              url={editForm.existingPortraitImage.url}
            />
          ) : null}
          {form.portraitImage ? (
            <p className="mb-2 text-xs font-medium text-paec-violet">
              New portrait image selected — save to replace the current image.
            </p>
          ) : null}
          <ImageUploadZone
            label="Portrait Image"
            hint="Recommended: 4:5 ratio (e.g. 1080 × 1350px). Shown on mobile cards, rails and the hero poster."
            files={form.portraitImage ? [form.portraitImage] : []}
            onChange={(files) => onChange({ portraitImage: files[0] ?? null })}
            className={editForm.existingPortraitImage && !form.portraitImage ? 'mt-3' : undefined}
          />
        </div>
        <div>
          {editForm.existingFeaturedImage && !form.featuredImage ? (
            <ExistingImagePreview
              label="Current Featured Image"
              url={editForm.existingFeaturedImage.url}
            />
          ) : null}
          {form.featuredImage ? (
            <p className="mb-2 text-xs font-medium text-paec-violet">
              New featured image selected — save to replace the current image.
            </p>
          ) : null}
          <ImageUploadZone
            label="Featured (Landscape) Image"
            hint="Recommended: 940 × 788px. Used for the desktop hero banner and activity cards."
            files={form.featuredImage ? [form.featuredImage] : []}
            onChange={(files) => onChange({ featuredImage: files[0] ?? null })}
            className={editForm.existingFeaturedImage && !form.featuredImage ? 'mt-3' : undefined}
          />
        </div>
      </div>

      {editForm.existingShowcaseImages?.length ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Current Showcase Images</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {editForm.existingShowcaseImages.map((image) => (
              <img
                key={image.uuid}
                src={image.url}
                alt="Showcase"
                className="h-24 w-full rounded-lg border border-violet-100 object-cover"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <ImageUploadZone
          label="Activity Showcase (Multiple)"
          hint="Recommended: 940 × 788px. Displayed in the activity gallery grid."
          multiple
          maxSize="Max 5MB each, up to 10 images"
          files={form.showcaseImages}
          onChange={(files) => onChange({ showcaseImages: files })}
        />
      </div>
    </section>
  )
}
