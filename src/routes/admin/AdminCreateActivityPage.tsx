import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CreateActivityStepper } from '@/components/admin/create-activity/CreateActivityStepper'
import { StepBasics } from '@/components/admin/create-activity/steps/StepBasics'
import { StepImages } from '@/components/admin/create-activity/steps/StepImages'
import { StepManageTickets } from '@/components/admin/create-activity/steps/StepManageTickets'
import { StepPreview } from '@/components/admin/create-activity/steps/StepPreview'
import { StepSummary } from '@/components/admin/create-activity/steps/StepSummary'
import { getApiErrorMessage } from '@/lib/api'
import {
  buildCreateActivityFormData,
  validateCreateActivityTickets,
} from '@/lib/createActivity'
import { adminEventService } from '@/services/adminEventService'
import { categoryService } from '@/services/categoryService'
import {
  createActivitySteps,
  initialCreateActivityForm,
  type CreateActivityForm,
} from '@/types/createActivity'

export function AdminCreateActivityPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<CreateActivityForm>(initialCreateActivityForm)
  const [categories, setCategories] = useState<{ uuid: string; name: string }[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const categoryList = await categoryService.listCategories()
      setCategories(categoryList)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load create form data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const currentStepMeta = createActivitySteps[step - 1]

  const updateForm = (updates: Partial<CreateActivityForm>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const validateStep = () => {
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
    if (step === 3) {
      const ticketError = validateCreateActivityTickets(form)
      if (ticketError) {
        toast.error(ticketError)
        return false
      }
    }
    return true
  }

  const validateBeforeSubmit = () => {
    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.contactEmail.trim() ||
      !form.categoryUuid ||
      !form.city.trim()
    ) {
      toast.error('Please fill in all required fields.')
      setStep(1)
      return false
    }
    const ticketError = validateCreateActivityTickets(form)
    if (ticketError) {
      toast.error(ticketError)
      setStep(3)
      return false
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, 5))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleCancel = () => navigate({ to: '/admin/activities' })

  const submitActivity = async (publish: boolean) => {
    if (!validateBeforeSubmit()) return

    setSaving(true)
    try {
      const formData = buildCreateActivityFormData(form, { publish: false })
      const response = await adminEventService.createEvent(formData)

      if (publish) {
        await adminEventService.publishEvent(response.data.uuid)
        toast.success('Activity published successfully!')
      } else {
        toast.success('Activity saved as draft.')
      }

      navigate({ to: '/admin/activities' })
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          publish ? 'Failed to publish activity.' : 'Failed to save draft.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = () => {
    void submitActivity(false)
  }

  const handlePublish = () => {
    void submitActivity(true)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 border-b border-violet-100 pb-3">
        <Link
          to="/admin/activities"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back to activities
        </Link>

        <div>
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            Create New Fun Activity
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Step {step} of 5 — {currentStepMeta.subtitle}
          </p>
        </div>

        <CreateActivityStepper currentStep={step} />
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
          <StepManageTickets form={form} onChange={updateForm} />
        )}
        {step === 4 && (
          <StepSummary form={form} onEditStep={(s) => setStep(s)} />
        )}
        {step === 5 && <StepPreview form={form} />}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-violet-100 bg-white pt-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-violet-50 disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
          )}

          {step >= 4 && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-violet-50 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:opacity-50"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish Activity'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
