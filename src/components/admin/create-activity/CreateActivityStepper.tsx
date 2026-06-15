import { Check } from 'lucide-react'

import { createActivitySteps } from '@/types/createActivity'
import { cn } from '@/lib/utils'

type StepItem = {
  id: number
  label: string
  subtitle: string
}

type CreateActivityStepperProps = {
  currentStep: number
  steps?: readonly StepItem[]
}

export function CreateActivityStepper({
  currentStep,
  steps = createActivitySteps,
}: CreateActivityStepperProps) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="flex min-w-[100px] flex-1 items-start">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isCompleted && 'bg-paec-violet text-white',
                  isActive && 'bg-paec-orange text-white',
                  !isCompleted && !isActive && 'bg-violet-100 text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="size-4" /> : step.id}
              </div>
              <p
                className={cn(
                  'mt-1.5 text-center text-[11px] font-semibold sm:text-xs',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              <p className="hidden text-center text-[10px] text-muted-foreground sm:block">
                {step.subtitle}
              </p>
            </div>

            {!isLast && (
              <div
                className={cn(
                  'mx-1 mt-4 h-0.5 min-w-[12px] flex-1',
                  isCompleted ? 'bg-paec-violet' : 'bg-violet-100',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
