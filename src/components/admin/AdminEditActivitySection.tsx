import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CreateActivityStepper } from '@/components/admin/create-activity/CreateActivityStepper'
import { StepAttendeeTracking } from '@/components/admin/create-activity/steps/StepAttendeeTracking'
import { StepBasics } from '@/components/admin/create-activity/steps/StepBasics'
import { StepImages } from '@/components/admin/create-activity/steps/StepImages'
import { StepPreview } from '@/components/admin/create-activity/steps/StepPreview'
import { StepSummary } from '@/components/admin/create-activity/steps/StepSummary'
import { getApiErrorMessage } from '@/lib/api'
import {
  buildEditActivityFormData,
  mapEventToEditForm,
} from '@/lib/editActivity'
import { adminEventService } from '@/services/adminEventService'
import { categoryService } from '@/services/categoryService'
import {
  editActivitySteps,
  type EditActivityForm,
} from '@/types/editActivity'

type AdminEditActivitySectionProps = {
  activityId: string
}

export function AdminEditActivitySection({
  activityId,
}: AdminEditActivitySectionProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<EditActivityForm | null>(null)
  const [categories, setCategories] = useState<{ uuid: string; name: string }[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [eventResponse, categoryList] = await Promise.all([
        adminEventService.getEventDetails(activityId),
        categoryService.listCategories(),
      ])
      setForm(mapEventToEditForm(eventResponse.data))
      setCategories(categoryList)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load activity.'))
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const currentStepMeta = editActivitySteps[step - 1]

  const updateForm = (updates: Partial<EditActivityForm>) => {
    setForm((current) => (current ? { ...current, ...updates } : current))
  }

  const validateStep = () => {
    if (!form) return false
    if (step === 1) {
      if (
        !form.name.trim() ||
        !form.description.trim() ||
        !form.contactEmail.trim() ||
        !form.categoryUuid ||
        !form.city.trim()
      ) {
        toast.error('Please fill in all required fields.')
        return false
      }
    }
    if (step === 3 && form.enableMetaPixel) {
      if (!form.metaPixelId.trim() || !form.metaPixelAccessToken.trim()) {
        toast.error('Meta Pixel ID and access token are required.')
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!form) return
    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.contactEmail.trim() ||
      !form.categoryUuid ||
      !form.city.trim()
    ) {
      toast.error('Please fill in all required fields.')
      setStep(1)
      return
    }

    setSaving(true)
    try {
      await adminEventService.updateEvent(
        activityId,
        buildEditActivityFormData(form),
      )
      toast.success('Activity saved successfully.')
      void navigate({
        to: '/admin/activities/$activityId',
        params: { activityId },
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save activity.'))
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep((current) => Math.min(current + 1, 5))
  }

  const handleBack = () => setStep((current) => Math.max(current - 1, 1))

  if (loading || !form) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Loading activity…
      </p>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 border-b border-violet-100 pb-3">
        <Link
          to="/admin/activities/$activityId"
          params={{ activityId }}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back to Activity
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground lg:text-2xl">
              Edit Fun Activity
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Step {step} of 5 — {currentStepMeta.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-paec-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-paec-violet-dark disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Activity'}
          </button>
        </div>

        <CreateActivityStepper currentStep={step} steps={editActivitySteps} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        {step === 1 && (
          <StepBasics
            form={form}
            onChange={updateForm}
            categories={categories}
            useCategoryUuid
          />
        )}
        {step === 2 && <StepImages form={form} onChange={updateForm} />}
        {step === 3 && (
          <StepAttendeeTracking
            form={form}
            onChange={updateForm}
            showMetaPixel
          />
        )}
        {step === 4 && (
          <StepSummary form={form} onEditStep={(nextStep) => setStep(nextStep)} />
        )}
        {step === 5 && <StepPreview form={form} />}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-violet-100 bg-white pt-3">
        <button
          type="button"
          onClick={() =>
            void navigate({
              to: '/admin/activities/$activityId',
              params: { activityId },
            })
          }
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-violet-50"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Activity'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
