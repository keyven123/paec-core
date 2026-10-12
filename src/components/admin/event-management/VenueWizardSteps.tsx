import {
  Check,
  Clock,
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

import type { OrganizationOption } from '@/services/organizationService'
import type {
  CustomSpecForm,
  PackageForm,
  VenueForm,
  VenueFormErrors,
} from '@/components/admin/event-management/venueWizard'
import type { VenueListingStatus } from '@/services/venueListingService'
import { VenueSetupIcon } from '@/components/admin/event-management/VenueSetupIcon'
import {
  MAX_GALLERY_IMAGES,
  MAX_IMAGE_BYTES,
  SETUP_SPEC_FIELDS,
  crossesMidnight,
  formatTime,
  packagePrice,
  slugify,
} from '@/components/admin/event-management/venueWizard'
import {
  Field,
  ImageTile,
  SectionCard,
  TagPicker,
  UploadTile,
  inputClass,
} from '@/components/admin/event-management/wizardUi'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  VENUE_AMENITY_OPTIONS,
  VENUE_BEST_FOR_OPTIONS,
  VENUE_SETUP_OPTIONS,
  VENUE_STATUS_OPTIONS,
  VENUE_TYPE_OPTIONS,
  formatPeso,
  venueListingService,
} from '@/services/venueListingService'

type StepProps = {
  form: VenueForm
  errors: VenueFormErrors
  setForm: Dispatch<SetStateAction<VenueForm>>
}

function useFieldUpdater(setForm: StepProps['setForm']) {
  return <TKey extends keyof VenueForm>(key: TKey, value: VenueForm[TKey]) =>
    setForm((current) => ({ ...current, [key]: value }))
}

function toggleValue(list: Array<string>, value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function StepBasics({ form, errors, setForm }: StepProps) {
  const update = useFieldUpdater(setForm)

  return (
    <SectionCard
      title="Basic information"
      description="Name your venue and describe what customers can expect."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Venue name" required error={errors.name} className="sm:col-span-2">
          <input
            value={form.name}
            onChange={(e) => {
              const name = e.target.value
              setForm((current) => ({
                ...current,
                name,
                slug: current.slugTouched ? current.slug : slugify(name),
              }))
            }}
            placeholder="e.g. The Grand Function Hall"
            maxLength={255}
            className={inputClass(errors.name)}
          />
        </Field>
        <Field
          label="URL slug"
          required
          error={errors.slug}
          hint={form.slug ? `Page address: /venues/${form.slug}` : 'Generated from the venue name.'}
        >
          <input
            value={form.slug}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                slug: slugify(e.target.value),
                slugTouched: true,
              }))
            }
            placeholder="the-grand-function-hall"
            maxLength={255}
            className={inputClass(errors.slug)}
          />
        </Field>
        <Field label="Venue type" required error={errors.venue_type}>
          <select
            value={form.venue_type}
            onChange={(e) => update('venue_type', e.target.value)}
            className={inputClass(errors.venue_type)}
          >
            {!VENUE_TYPE_OPTIONS.some((option) => option === form.venue_type) ? (
              <option value={form.venue_type}>{form.venue_type}</option>
            ) : null}
            {VENUE_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="About this venue" className="sm:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={6}
            placeholder="Describe the venue, layout options, and what makes it unique..."
            className={cn(inputClass(), 'h-auto py-2.5')}
          />
        </Field>
      </div>
    </SectionCard>
  )
}

export function StepImages({
  form,
  setForm,
  onUploadingChange,
}: StepProps & { onUploadingChange: (uploading: boolean) => void }) {
  const update = useFieldUpdater(setForm)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(0)

  useEffect(() => {
    onUploadingChange(uploadingCover || uploadingGallery > 0)
  }, [uploadingCover, uploadingGallery, onUploadingChange])

  const isValidImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(`"${file.name}" is not an image.`)
      return false
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`"${file.name}" is larger than 2 MB.`)
      return false
    }
    return true
  }

  const handleCover = async (files: Array<File>) => {
    const file = files.find(isValidImage)
    if (!file) return
    setUploadingCover(true)
    try {
      update('cover', await venueListingService.uploadImage(file))
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to upload image.'))
    } finally {
      setUploadingCover(false)
    }
  }

  const handleGallery = async (files: Array<File>) => {
    const remaining = MAX_GALLERY_IMAGES - form.gallery.length - uploadingGallery
    const valid = files.filter(isValidImage)
    if (valid.length > remaining) {
      toast.error(`The gallery holds up to ${MAX_GALLERY_IMAGES} photos.`)
    }
    const selected = valid.slice(0, Math.max(0, remaining))
    if (selected.length === 0) return

    setUploadingGallery((count) => count + selected.length)
    for (const file of selected) {
      try {
        const image = await venueListingService.uploadImage(file)
        setForm((current) => ({ ...current, gallery: [...current.gallery, image] }))
      } catch (err) {
        toast.error(getApiErrorMessage(err, `Failed to upload "${file.name}".`))
      } finally {
        setUploadingGallery((count) => count - 1)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Cover photo"
        description="The main photo shown on venue cards and at the top of the venue page."
      >
        {form.cover ? (
          <ImageTile
            url={form.cover.url}
            label="Cover photo"
            badge="Cover"
            onRemove={() => update('cover', null)}
            className="aspect-[16/9] max-w-xl"
          />
        ) : (
          <UploadTile
            label="Click or drag a photo here"
            hint="JPG, PNG or WebP · up to 2 MB · landscape works best"
            uploading={uploadingCover}
            onSelect={(files) => void handleCover(files)}
            className="aspect-[16/9] max-w-xl"
          />
        )}
      </SectionCard>

      <SectionCard
        title="Gallery"
        description={`Show the venue from different angles. ${form.gallery.length} of ${MAX_GALLERY_IMAGES} photos added.`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {form.gallery.map((image, index) => (
            <ImageTile
              key={image.uuid}
              url={image.url}
              label={`Gallery photo ${index + 1}`}
              onRemove={() =>
                update(
                  'gallery',
                  form.gallery.filter((item) => item.uuid !== image.uuid),
                )
              }
              className="aspect-[4/3]"
            />
          ))}
          {Array.from({ length: uploadingGallery }).map((_, index) => (
            <div
              key={`uploading-${index}`}
              className="flex aspect-[4/3] items-center justify-center rounded-xl border border-violet-100 bg-violet-50/60"
            >
              <Loader2 className="size-5 animate-spin text-paec-violet" />
            </div>
          ))}
          {form.gallery.length + uploadingGallery < MAX_GALLERY_IMAGES ? (
            <UploadTile
              label="Add photos"
              hint="Select several at once"
              multiple
              uploading={false}
              onSelect={(files) => void handleGallery(files)}
              className="aspect-[4/3]"
            />
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}

export function StepLocation({ form, errors, setForm }: StepProps) {
  const update = useFieldUpdater(setForm)

  return (
    <SectionCard
      title="Location & capacity"
      description="Where the venue is and how many guests it fits."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address" className="sm:col-span-2">
          <input
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="e.g. 6750 Ayala Avenue, Legaspi Village"
            maxLength={500}
            className={inputClass()}
          />
        </Field>
        <Field label="City" required error={errors.city}>
          <input
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="e.g. Makati City"
            maxLength={255}
            className={inputClass(errors.city)}
          />
        </Field>
        <Field label="Region / province">
          <input
            value={form.region}
            onChange={(e) => update('region', e.target.value)}
            placeholder="e.g. Metro Manila"
            maxLength={255}
            className={inputClass()}
          />
        </Field>
        <Field label="Floor area">
          <input
            value={form.area}
            onChange={(e) => update('area', e.target.value)}
            placeholder="e.g. 800 sqm"
            maxLength={100}
            className={inputClass()}
          />
        </Field>
        <Field label="Starting price / event (₱)" error={errors.price_per_event}>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={form.price_per_event}
            onChange={(e) => update('price_per_event', e.target.value)}
            placeholder="e.g. 45000"
            className={inputClass(errors.price_per_event)}
          />
        </Field>

        <div className="border-t border-violet-50 pt-4 sm:col-span-2">
          <p className="text-sm font-semibold text-foreground">Guest capacity</p>
          <p className="text-xs text-muted-foreground">
            Shown on the venue page as the minimum and maximum number of guests.
          </p>
        </div>
        <Field label="Minimum guests" error={errors.capacity_min}>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={form.capacity_min}
            onChange={(e) => update('capacity_min', e.target.value)}
            placeholder="e.g. 50"
            className={inputClass(errors.capacity_min)}
          />
        </Field>
        <Field label="Maximum guests" error={errors.capacity_max}>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={form.capacity_max}
            onChange={(e) => update('capacity_max', e.target.value)}
            placeholder="e.g. 500"
            className={inputClass(errors.capacity_max)}
          />
        </Field>
        <Field label="Minimum capacity note">
          <input
            value={form.min_capacity_note}
            onChange={(e) => update('min_capacity_note', e.target.value)}
            placeholder="guests · intimate setups & meetings"
            maxLength={255}
            className={inputClass()}
          />
        </Field>
        <Field label="Maximum capacity note">
          <input
            value={form.max_capacity_note}
            onChange={(e) => update('max_capacity_note', e.target.value)}
            placeholder="guests · full banquet / standing"
            maxLength={255}
            className={inputClass()}
          />
        </Field>
      </div>
    </SectionCard>
  )
}

export function StepSetups({ form, errors, setForm }: StepProps) {
  const toggleSetup = (id: string, defaultCapacity: number) => {
    setForm((current) => ({
      ...current,
      setupIds: toggleValue(current.setupIds, id),
      setupCapacities:
        id in current.setupCapacities
          ? current.setupCapacities
          : { ...current.setupCapacities, [id]: String(defaultCapacity) },
    }))
  }

  const updateCustomSpec = (index: number, patch: Partial<CustomSpecForm>) => {
    setForm((current) => ({
      ...current,
      customSpecs: current.customSpecs.map((spec, i) => (i === index ? { ...spec, ...patch } : spec)),
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Table arrangements & setups"
        description="Select the layouts available at this venue and their maximum capacity."
      >
        {errors.setups ? <p className="mb-3 text-xs text-red-600">{errors.setups}</p> : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {VENUE_SETUP_OPTIONS.map((option) => {
            const selected = form.setupIds.includes(option.id)
            return (
              <div
                key={option.id}
                className={cn(
                  'relative flex flex-col items-center rounded-xl border px-3 py-3 text-center transition-colors',
                  selected
                    ? 'border-paec-violet bg-violet-50/70'
                    : 'border-violet-100 bg-white hover:border-violet-300',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleSetup(option.id, option.capacity)}
                  aria-pressed={selected}
                  className="flex w-full flex-col items-center"
                >
                  {selected ? (
                    <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-paec-violet text-white">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                  <VenueSetupIcon setupId={option.id} className="h-12 w-16" />
                  <span className="mt-2 text-sm font-semibold text-foreground">{option.label}</span>
                </button>
                {selected ? (
                  <label className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    up to
                    <input
                      type="number"
                      min={1}
                      value={form.setupCapacities[option.id] ?? ''}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          setupCapacities: {
                            ...current.setupCapacities,
                            [option.id]: e.target.value,
                          },
                        }))
                      }
                      className="h-7 w-16 rounded-md border border-violet-200 bg-white px-1.5 text-center text-xs font-semibold text-foreground focus:border-paec-violet focus:outline-none"
                      aria-label={`${option.label} capacity`}
                    />
                    pax
                  </label>
                ) : (
                  <span className="mt-1 text-[11px] text-muted-foreground">Tap to add</span>
                )}
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Venue specs"
        description="Technical details customers see on the venue page."
        action={
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                customSpecs: [
                  ...current.customSpecs,
                  { id: `custom-${Date.now()}`, label: '', value: '' },
                ],
              }))
            }
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-paec-violet transition-colors hover:bg-violet-50"
          >
            <Plus className="size-3.5" />
            Custom spec
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {SETUP_SPEC_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <input
                value={form.specValues[field.key] ?? ''}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    specValues: { ...current.specValues, [field.key]: e.target.value },
                  }))
                }
                placeholder={field.placeholder}
                maxLength={120}
                className={inputClass()}
              />
            </Field>
          ))}
        </div>
        {form.customSpecs.length > 0 ? (
          <div className="mt-4 space-y-3 border-t border-violet-50 pt-4">
            {errors.specs ? <p className="text-xs text-red-600">{errors.specs}</p> : null}
            {form.customSpecs.map((spec, index) => (
              <div key={spec.id} className="flex items-end gap-2">
                <Field label="Label" className="flex-1">
                  <input
                    value={spec.label}
                    onChange={(e) => updateCustomSpec(index, { label: e.target.value })}
                    placeholder="e.g. Stage size"
                    maxLength={60}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Value" className="flex-1">
                  <input
                    value={spec.value}
                    onChange={(e) => updateCustomSpec(index, { value: e.target.value })}
                    placeholder="e.g. 12 m × 6 m"
                    maxLength={120}
                    className={inputClass()}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      customSpecs: current.customSpecs.filter((_, i) => i !== index),
                    }))
                  }
                  className="mb-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
                  aria-label="Remove custom spec"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Best for these events"
        description="Choose the event types this venue suits best."
      >
        <TagPicker
          options={VENUE_BEST_FOR_OPTIONS}
          selected={form.best_for}
          onToggle={(value) =>
            setForm((current) => ({ ...current, best_for: toggleValue(current.best_for, value) }))
          }
          addLabel="Add another event type"
        />
      </SectionCard>

      <SectionCard title="Amenities included" description="What comes with the venue.">
        <TagPicker
          options={VENUE_AMENITY_OPTIONS}
          selected={form.amenities}
          onToggle={(value) =>
            setForm((current) => ({ ...current, amenities: toggleValue(current.amenities, value) }))
          }
          addLabel="Add another amenity"
        />
      </SectionCard>
    </div>
  )
}

export function StepPackages({ form, errors, setForm }: StepProps) {
  const updatePackage = (index: number, patch: Partial<PackageForm>) => {
    setForm((current) => ({
      ...current,
      packages: current.packages.map((pkg, i) => (i === index ? { ...pkg, ...patch } : pkg)),
    }))
  }

  const removePackage = (index: number) => {
    setForm((current) => {
      const removedId = current.packages[index].id
      const packages = current.packages.filter((_, i) => i !== index)
      return {
        ...current,
        packages,
        default_package_id:
          current.default_package_id === removedId ? (packages[0]?.id ?? '') : current.default_package_id,
      }
    })
  }

  return (
    <SectionCard
      title="Packages"
      description="Day and time blocks customers can book. The default package is pre-selected for customers."
      action={
        <button
          type="button"
          onClick={() =>
            setForm((current) => ({
              ...current,
              packages: [
                ...current.packages,
                {
                  id: `package-${Date.now()}`,
                  label: '',
                  priceFrom: '',
                  note: '',
                  start_time: '09:00',
                  end_time: '17:00',
                },
              ],
            }))
          }
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-paec-violet transition-colors hover:bg-violet-50"
        >
          <Plus className="size-3.5" />
          Add package
        </button>
      }
    >
      {errors.packages ? <p className="mb-3 text-xs text-red-600">{errors.packages}</p> : null}
      <div className="space-y-3">
        {form.packages.map((pkg, index) => {
          const isDefault = form.default_package_id === pkg.id
          return (
            <div
              key={pkg.id}
              className={cn(
                'rounded-xl border p-3 sm:p-4',
                isDefault ? 'border-paec-violet/40 bg-violet-50/40' : 'border-violet-100',
              )}
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                <Field label="Package name">
                  <input
                    value={pkg.label}
                    onChange={(e) => updatePackage(index, { label: e.target.value })}
                    placeholder="e.g. Full day"
                    maxLength={255}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Price from (₱)">
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={pkg.priceFrom}
                    onChange={(e) => updatePackage(index, { priceFrom: e.target.value })}
                    placeholder={form.price_per_event.trim() || '0.00'}
                    className={inputClass()}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-[150px_150px_minmax(0,1fr)]">
                  <Field label="Start time">
                    <input
                      type="time"
                      value={pkg.start_time}
                      onChange={(e) => updatePackage(index, { start_time: e.target.value })}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="End time">
                    <input
                      type="time"
                      value={pkg.end_time}
                      onChange={(e) => updatePackage(index, { end_time: e.target.value })}
                      className={inputClass()}
                    />
                  </Field>
                  <Field label="Note" className="col-span-2 sm:col-span-1">
                    <input
                      value={pkg.note}
                      onChange={(e) => updatePackage(index, { note: e.target.value })}
                      placeholder="Optional, e.g. final rate varies by date"
                      maxLength={500}
                      className={inputClass()}
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  {pkg.start_time && pkg.end_time
                    ? `${formatTime(pkg.start_time)} – ${formatTime(pkg.end_time)}${
                        crossesMidnight(pkg.start_time, pkg.end_time) ? ' (next day)' : ''
                      }`
                    : 'Set a start and end time'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, default_package_id: pkg.id }))}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
                      isDefault
                        ? 'bg-paec-violet text-white'
                        : 'text-muted-foreground hover:bg-violet-50 hover:text-paec-violet',
                    )}
                  >
                    <Star className={cn('size-3', isDefault && 'fill-current')} />
                    {isDefault ? 'Default' : 'Set as default'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePackage(index)}
                    disabled={form.packages.length === 1}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-3" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

export function StepSummary({
  form,
  errors,
  setForm,
  isEdit,
  organizations,
  onEditStep,
}: StepProps & {
  isEdit: boolean
  organizations: Array<OrganizationOption>
  onEditStep: (step: number) => void
}) {
  const capacity =
    form.capacity_min && form.capacity_max
      ? `${form.capacity_min}–${form.capacity_max} pax`
      : '—'
  const location = [form.address, form.city, form.region].filter(Boolean).join(', ')
  const selectedSetups = VENUE_SETUP_OPTIONS.filter((option) => form.setupIds.includes(option.id))
  const specCount =
    (form.area.trim() ? 1 : 0) +
    Object.values(form.specValues).filter((value) => value.trim()).length +
    form.customSpecs.filter((spec) => spec.label.trim() && spec.value.trim()).length

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <SummaryCard title="Basics" step={0} onEditStep={onEditStep}>
          <div className="flex gap-4">
            <div className="hidden aspect-[4/3] w-36 shrink-0 overflow-hidden rounded-lg bg-violet-50 sm:block">
              {form.cover ? (
                <img src={form.cover.url} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-violet-300">
                  <ImageOff className="size-6" />
                </div>
              )}
            </div>
            <dl className="min-w-0 flex-1 space-y-1.5 text-sm">
              <SummaryRow label="Name" value={form.name || '—'} />
              <SummaryRow label="URL" value={form.slug ? `/venues/${form.slug}` : '—'} />
              <SummaryRow label="Type" value={form.venue_type} />
              <SummaryRow
                label="About"
                value={form.description.trim() ? `${form.description.trim().slice(0, 120)}${form.description.length > 120 ? '…' : ''}` : '—'}
              />
            </dl>
          </div>
        </SummaryCard>

        <SummaryCard title="Images" step={1} onEditStep={onEditStep}>
          <p className="text-sm text-foreground">
            {form.cover ? 'Cover photo added' : 'No cover photo'} · {form.gallery.length} gallery
            photo{form.gallery.length === 1 ? '' : 's'}
          </p>
          {form.gallery.length > 0 ? (
            <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto">
              {form.gallery.map((image) => (
                <img
                  key={image.uuid}
                  src={image.url}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded-md object-cover"
                />
              ))}
            </div>
          ) : null}
        </SummaryCard>

        <SummaryCard title="Location & capacity" step={2} onEditStep={onEditStep}>
          <dl className="space-y-1.5 text-sm">
            <SummaryRow label="Location" value={location || '—'} />
            <SummaryRow label="Floor area" value={form.area || '—'} />
            <SummaryRow label="Capacity" value={capacity} />
            <SummaryRow
              label="From / event"
              value={form.price_per_event ? formatPeso(Number(form.price_per_event)) : '—'}
            />
          </dl>
        </SummaryCard>

        <SummaryCard title="Setups & amenities" step={3} onEditStep={onEditStep}>
          <dl className="space-y-1.5 text-sm">
            <SummaryRow
              label="Setups"
              value={
                selectedSetups.length
                  ? selectedSetups
                      .map((setup) => `${setup.label} (${form.setupCapacities[setup.id] ?? setup.capacity})`)
                      .join(', ')
                  : 'None selected'
              }
            />
            <SummaryRow label="Specs" value={specCount ? `${specCount} added` : 'None added'} />
            <SummaryRow label="Best for" value={form.best_for.join(', ') || 'None selected'} />
            <SummaryRow label="Amenities" value={form.amenities.join(', ') || 'None selected'} />
          </dl>
        </SummaryCard>

        <SummaryCard title="Packages" step={4} onEditStep={onEditStep}>
          <ul className="divide-y divide-violet-50 text-sm">
            {form.packages.map((pkg) => (
              <li key={pkg.id} className="flex items-center justify-between gap-3 py-1.5">
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{pkg.label || 'Untitled'}</span>
                  {pkg.id === form.default_package_id ? (
                    <span className="ml-1.5 rounded-full bg-paec-violet px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Default
                    </span>
                  ) : null}
                  <span className="block text-[11px] text-muted-foreground">
                    {pkg.start_time && pkg.end_time
                      ? `${formatTime(pkg.start_time)} – ${formatTime(pkg.end_time)}`
                      : '—'}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-paec-orange">
                  {formatPeso(packagePrice(pkg, form))}
                </span>
              </li>
            ))}
          </ul>
        </SummaryCard>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-4">
        <SectionCard title="Publishing">
          <div className="space-y-3">
            {organizations.length > 1 ? (
              <Field label="Organization" required error={errors.organization_uuid}>
                <select
                  value={form.organization_uuid}
                  onChange={(e) => setForm((current) => ({ ...current, organization_uuid: e.target.value }))}
                  className={inputClass(errors.organization_uuid)}
                >
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org.uuid} value={org.uuid}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : errors.organization_uuid ? (
              <p className="text-xs text-red-600">{errors.organization_uuid}</p>
            ) : null}
            {isEdit ? (
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, status: e.target.value as VenueListingStatus }))
                  }
                  className={inputClass()}
                >
                  {VENUE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-violet-100 px-3 py-2.5">
              <span>
                <span className="block text-sm font-medium text-foreground">Featured venue</span>
                <span className="block text-[11px] text-muted-foreground">
                  Show this venue first in listings
                </span>
              </span>
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((current) => ({ ...current, is_featured: e.target.checked }))}
                className="size-4 accent-paec-violet"
              />
            </label>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {isEdit
                ? 'Only Published and Approved venues are visible to customers.'
                : 'Publish to make the venue visible to customers now, or save it as a draft to finish later.'}
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  step,
  onEditStep,
  children,
}: {
  title: string
  step: number
  onEditStep: (step: number) => void
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-foreground sm:text-base">{title}</h2>
        <button
          type="button"
          onClick={() => onEditStep(step)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-paec-violet transition-colors hover:bg-violet-50"
        >
          <Pencil className="size-3" />
          Edit
        </button>
      </div>
      {children}
    </section>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium break-words text-foreground">{value}</dd>
    </div>
  )
}
