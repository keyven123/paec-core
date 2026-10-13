import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { OrganizationOption } from '@/services/organizationService'
import type { VenueListingStatus } from '@/services/venueListingService'
import type {
  VenueForm,
  VenueFormErrors,
} from '@/components/admin/event-management/venueWizard'
import {
  StepBasics,
  StepImages,
  StepLocation,
  StepPackages,
  StepSetups,
  StepSummary,
} from '@/components/admin/event-management/VenueWizardSteps'
import {
  EMPTY_VENUE_FORM,
  SUMMARY_STEP,
  VENUE_WIZARD_STEPS,
  buildPayload,
  changedErrorKeys,
  formFromListing,
  stepForField,
  validateStep,
} from '@/components/admin/event-management/venueWizard'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { cn } from '@/lib/utils'
import { organizationService } from '@/services/organizationService'
import { venueListingService } from '@/services/venueListingService'

const VALIDATED_STEPS = [0, 2, 3, 4]

function normalizeErrorKey(key: string) {
  const root = key.split('.')[0]
  return ['packages', 'setups', 'specs'].includes(root) ? root : key
}

export function AdminVenueFormSection({ venueId }: { venueId?: string }) {
  const navigate = useNavigate()
  const isEdit = Boolean(venueId)
  const topRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState<VenueForm>(EMPTY_VENUE_FORM)
  const [errors, setErrors] = useState<VenueFormErrors>({})
  const [step, setStep] = useState(0)
  const [organizations, setOrganizations] = useState<Array<OrganizationOption>>([])
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState<VenueListingStatus | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [orgs, listing] = await Promise.all([
          organizationService.listOptions().catch(() => []),
          venueId ? venueListingService.get(venueId) : Promise.resolve(null),
        ])
        if (cancelled) return
        setOrganizations(orgs)
        if (listing) {
          setForm(formFromListing(listing))
        } else if (orgs.length > 0) {
          setForm((current) => ({ ...current, organization_uuid: orgs[0].uuid }))
        }
      } catch (err) {
        if (!cancelled) setLoadError(getApiErrorMessage(err, 'Failed to load venue.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [venueId])

  const previousForm = useRef(form)
  useEffect(() => {
    const previous = previousForm.current
    previousForm.current = form
    setErrors((current) => {
      const changed = changedErrorKeys(current, previous, form)
      if (changed.length === 0) return current
      return Object.fromEntries(Object.entries(current).filter(([key]) => !changed.includes(key)))
    })
  }, [form])

  const goTo = (target: number) => {
    setStep(target)
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const checkStep = (index: number) => {
    const stepErrors = validateStep(index, form)
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = () => {
    if (!checkStep(step)) {
      toast.error('Please fix the highlighted fields.')
      return
    }
    goTo(Math.min(step + 1, SUMMARY_STEP))
  }

  const handleStepClick = (target: number) => {
    if (target <= step) {
      setErrors({})
      goTo(target)
      return
    }
    for (let index = step; index < target; index++) {
      if (!checkStep(index)) {
        if (index !== step) goTo(index)
        toast.error('Complete this step before moving on.')
        return
      }
    }
    goTo(target)
  }

  const handleSave = async (status: VenueListingStatus) => {
    for (const index of VALIDATED_STEPS) {
      if (!checkStep(index)) {
        goTo(index)
        toast.error('Please complete the required fields.')
        return
      }
    }
    if (organizations.length > 1 && !form.organization_uuid) {
      setErrors({ organization_uuid: 'Please select an organization.' })
      return
    }

    setSaving(status)
    try {
      const payload = { ...buildPayload(form), status }
      const saved = venueId
        ? await venueListingService.update(venueId, payload)
        : await venueListingService.create(payload)
      toast.success(
        isEdit
          ? 'Venue updated.'
          : status === 'published'
            ? 'Venue published.'
            : 'Venue saved as draft.',
      )
      void navigate({
        to: '/admin/event-management/$venueId',
        params: { venueId: saved.uuid },
      })
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      const keys = Object.keys(apiErrors)
      if (keys.length > 0) {
        setErrors(
          Object.fromEntries(
            Object.entries(apiErrors).map(([key, messages]) => [
              normalizeErrorKey(key),
              Array.isArray(messages) ? messages[0] : messages,
            ]),
          ),
        )
        goTo(Math.min(...keys.map(stepForField)))
      }
      toast.error(getApiErrorMessage(err, 'Failed to save venue.'))
    } finally {
      setSaving(null)
    }
  }

  const handleUploadingChange = useCallback((value: boolean) => setUploading(value), [])

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading venue...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
        {loadError}
        <div className="mt-3">
          <Link to="/admin/event-management" className="font-semibold underline">
            Back to Event Management
          </Link>
        </div>
      </div>
    )
  }

  const backLink = venueId
    ? ({ to: '/admin/event-management/$venueId', params: { venueId } } as const)
    : ({ to: '/admin/event-management' } as const)
  const isSummary = step === SUMMARY_STEP
  const busy = saving !== null || uploading
  const stepProps = { form, errors, setForm }

  return (
    <div ref={topRef} className="flex w-full scroll-mt-4 flex-col gap-5 pb-24 md:pb-6">
      <div className="flex items-start gap-2">
        <Link
          {...backLink}
          className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-paec-violet"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            {isEdit ? 'Edit Venue' : 'Create Venue'}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {isEdit
              ? 'Update venue details and publish settings'
              : 'Add a new venue to the marketplace'}
          </p>
        </div>
      </div>

      <WizardStepper current={step} onStepClick={handleStepClick} />

      <form onSubmit={(e) => e.preventDefault()}>
        {step === 0 ? <StepBasics {...stepProps} /> : null}
        {step === 1 ? (
          <StepImages {...stepProps} onUploadingChange={handleUploadingChange} />
        ) : null}
        {step === 2 ? <StepLocation {...stepProps} /> : null}
        {step === 3 ? <StepSetups {...stepProps} /> : null}
        {step === 4 ? <StepPackages {...stepProps} /> : null}
        {isSummary ? (
          <StepSummary
            {...stepProps}
            isEdit={isEdit}
            organizations={organizations}
            onEditStep={(target) => goTo(target)}
          />
        ) : null}
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-2 border-t border-violet-100 bg-white/95 px-4 py-3 backdrop-blur md:static md:border-violet-100 md:bg-transparent md:px-0 md:pt-5 md:pb-0 md:backdrop-blur-none">
        <Link
          {...backLink}
          className="hidden h-10 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground sm:inline-flex"
        >
          Cancel
        </Link>
        <div className="flex flex-1 justify-end gap-2 sm:flex-none">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => {
                setErrors({})
                goTo(step - 1)
              }}
              disabled={saving !== null}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-violet-200 bg-white px-3 text-sm font-semibold text-foreground transition-colors hover:bg-violet-50 disabled:opacity-50 sm:px-4"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
          ) : null}

          {!isSummary ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={uploading}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-paec-violet px-5 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:opacity-50 sm:flex-none"
            >
              {uploading ? 'Uploading…' : 'Next'}
              {uploading ? null : <ChevronRight className="size-4" />}
            </button>
          ) : isEdit ? (
            <button
              type="button"
              onClick={() => void handleSave(form.status)}
              disabled={busy}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-paec-violet px-5 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:opacity-50 sm:flex-none"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save changes
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handleSave('draft')}
                disabled={busy}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-3 text-sm font-semibold text-foreground transition-colors hover:bg-violet-50 disabled:opacity-50 sm:px-4"
              >
                {saving === 'draft' ? <Loader2 className="size-4 animate-spin" /> : null}
                Save as draft
              </button>
              <button
                type="button"
                onClick={() => void handleSave('published')}
                disabled={busy}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-paec-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-paec-orange-light disabled:opacity-50 sm:flex-none sm:px-5"
              >
                {saving === 'published' ? <Loader2 className="size-4 animate-spin" /> : null}
                Publish venue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function WizardStepper({
  current,
  onStepClick,
}: {
  current: number
  onStepClick: (step: number) => void
}) {
  const active = VENUE_WIZARD_STEPS[current]
  const progress = ((current + 1) / VENUE_WIZARD_STEPS.length) * 100

  return (
    <>
      <div className="rounded-xl border border-violet-100 bg-white p-3 shadow-sm md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wider text-paec-violet uppercase">
              Step {current + 1} of {VENUE_WIZARD_STEPS.length}
            </p>
            <p className="truncate text-sm font-bold text-foreground">
              {active.title}
              <span className="font-normal text-muted-foreground"> · {active.description}</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            {VENUE_WIZARD_STEPS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onStepClick(index)}
                className={cn(
                  'size-2 rounded-full transition-colors',
                  index === current
                    ? 'bg-paec-violet'
                    : index < current
                      ? 'bg-paec-violet/40'
                      : 'bg-violet-100',
                )}
                aria-label={`Go to ${item.title}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-violet-100">
          <div
            className="h-full rounded-full bg-paec-violet transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="hidden items-center md:flex">
        {VENUE_WIZARD_STEPS.map((item, index) => {
          const isActive = index === current
          const isDone = index < current
          return (
            <li key={item.title} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                className="group flex items-center gap-2.5 text-left"
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                    isActive
                      ? 'border-paec-violet bg-paec-violet text-white shadow-sm shadow-paec-violet/30'
                      : isDone
                        ? 'border-paec-violet bg-violet-50 text-paec-violet'
                        : 'border-violet-100 bg-white text-muted-foreground group-hover:border-violet-300',
                  )}
                >
                  {isDone ? <Check className="size-4" /> : index + 1}
                </span>
                <span className="hidden lg:block">
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      isActive || isDone ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="block text-[11px] whitespace-nowrap text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </button>
              {index < VENUE_WIZARD_STEPS.length - 1 ? (
                <span
                  className={cn(
                    'mx-3 h-0.5 flex-1 rounded-full',
                    isDone ? 'bg-paec-violet' : 'bg-violet-100',
                  )}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </>
  )
}
