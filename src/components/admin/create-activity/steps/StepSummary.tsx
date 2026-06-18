import { ArrowRight } from 'lucide-react'
import { useEffect, useMemo, type ReactNode } from 'react'

import type { CreateActivityForm } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'

import { ImagePreviewFrame } from '../ImagePreviewFrame'
import { sectionClassName } from '../formStyles'

type StepSummaryProps = {
  form: CreateActivityForm | EditActivityForm
  onEditStep: (step: number) => void
}

function ReviewBlock({
  title,
  step,
  onEdit,
  children,
}: {
  title: string
  step: number
  onEdit: (step: number) => void
  children: ReactNode
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold tracking-wider text-paec-orange uppercase">
          {title}
        </p>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
        >
          Edit
          <ArrowRight className="size-3" />
        </button>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value || '—'}</p>
    </div>
  )
}

function usePreviewSrc(file: File | null, existingUrl?: string | null) {
  const objectUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  )

  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    },
    [objectUrl],
  )

  return objectUrl ?? existingUrl ?? null
}

function ReviewImage({
  label,
  src,
  fileName,
  variant,
}: {
  label: string
  src: string | null
  fileName?: string
  variant: 'portrait' | 'landscape'
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {src ? (
        <>
          <ImagePreviewFrame src={src} alt={label} variant={variant} />
          {fileName ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {fileName}
            </p>
          ) : null}
        </>
      ) : (
        <div className="flex min-h-[80px] items-center justify-center rounded-lg border-2 border-dashed border-violet-200 bg-violet-50/30 text-xs text-muted-foreground">
          None
        </div>
      )}
    </div>
  )
}

function ReviewShowcaseImages({
  newFiles,
  existingUrls,
}: {
  newFiles: File[]
  existingUrls: string[]
}) {
  const objectUrls = useMemo(
    () => newFiles.map((file) => URL.createObjectURL(file)),
    [newFiles],
  )

  useEffect(
    () => () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    },
    [objectUrls],
  )

  const allPreviews = [...existingUrls, ...objectUrls]
  const totalCount = allPreviews.length

  if (totalCount === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] text-muted-foreground">Showcase (0)</p>
        <div className="flex min-h-[80px] items-center justify-center rounded-lg border-2 border-dashed border-violet-200 bg-violet-50/30 text-xs text-muted-foreground">
          None
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-[11px] text-muted-foreground">
        Showcase ({totalCount})
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allPreviews.map((src, index) => (
          <ImagePreviewFrame
            key={`${src}-${index}`}
            src={src}
            alt={`Showcase ${index + 1}`}
            variant="gallery"
          />
        ))}
      </div>
    </div>
  )
}

export function StepSummary({ form, onEditStep }: StepSummaryProps) {
  const editForm = form as EditActivityForm
  const portraitSrc = usePreviewSrc(
    form.portraitImage,
    editForm.existingPortraitImage?.url,
  )
  const featuredSrc = usePreviewSrc(
    form.featuredImage,
    editForm.existingFeaturedImage?.url,
  )
  const existingShowcaseUrls =
    editForm.existingShowcaseImages?.map((image) => image.url) ?? []

  const trackingSummary = editForm.enableMetaPixel
    ? `Meta Pixel enabled · ID: ${editForm.metaPixelId || '—'}`
    : 'Meta Pixel disabled'

  return (
    <div className="space-y-4">
      <section className={sectionClassName}>
        <h2 className="text-base font-semibold text-foreground">
          Review your activity
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Check everything below before publishing. Click{' '}
          <span className="font-medium text-paec-violet">Back</span> on any step
          to make changes.
        </p>

        <ReviewBlock title="Attraction Details" step={1} onEdit={onEditStep}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Activity Name" value={form.name} />
            <Field label="Contact Email" value={form.contactEmail} />
            <Field label="Category" value={form.category} />
            <Field label="City" value={form.city} />
            <Field label="Address" value={form.address} />
            <div className="sm:col-span-2">
              <Field label="Description" value={form.description} />
            </div>
          </div>
        </ReviewBlock>

        <ReviewBlock title="Images" step={2} onEdit={onEditStep}>
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <ReviewImage
                label="Portrait"
                src={portraitSrc}
                fileName={form.portraitImage?.name}
                variant="portrait"
              />
              <ReviewImage
                label="Featured"
                src={featuredSrc}
                fileName={form.featuredImage?.name}
                variant="landscape"
              />
            </div>
            <ReviewShowcaseImages
              newFiles={form.showcaseImages}
              existingUrls={existingShowcaseUrls}
            />
          </div>
        </ReviewBlock>

        <ReviewBlock title="Manage Ticket" step={3} onEdit={onEditStep}>
          <div className="space-y-3">
            {form.tickets.length > 0 ? (
              <ul className="space-y-2">
                {form.tickets.map((ticket, index) => (
                  <li
                    key={ticket.id}
                    className="rounded-lg border border-violet-100 bg-violet-50/20 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {ticket.name.trim() || `Ticket ${index + 1}`}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ₱
                      {Number.parseFloat(ticket.price || '0').toLocaleString(
                        'en-PH',
                        { minimumFractionDigits: 2 },
                      )}{' '}
                      ·{' '}
                      {ticket.isUnlimited
                        ? 'Unlimited'
                        : `Max ${ticket.maxTicket} per day`}{' '}
                      ·{' '}
                      {ticket.visitPolicy === 'flexible'
                        ? `Flexible (${ticket.validityDays} days)`
                        : 'Priority'}
                    </p>
                    {ticket.description.trim() ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticket.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <Field label="Tickets" value="None" />
            )}
            <Field
              label="Attendee Fields"
              value={
                form.attendeeFields.length
                  ? form.attendeeFields.map((field) => field.label).join(', ')
                  : 'None'
              }
            />
            {editForm.enableMetaPixel !== undefined ? (
              <Field label="Tracking" value={trackingSummary} />
            ) : null}
          </div>
        </ReviewBlock>
      </section>
    </div>
  )
}
