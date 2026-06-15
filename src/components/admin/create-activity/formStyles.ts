import { cn } from '@/lib/utils'

export const fieldClassName = cn(
  'w-full rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

export const labelClassName = 'text-sm font-medium text-foreground'

export const sectionClassName =
  'rounded-xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5'
