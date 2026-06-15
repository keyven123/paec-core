import type { LucideIcon } from 'lucide-react'

type AdminPlaceholderSectionProps = {
  title: string
  description: string
  icon: LucideIcon
}

export function AdminPlaceholderSection({
  title,
  description,
  icon: Icon,
}: AdminPlaceholderSectionProps) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-8 shadow-sm">
      <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-50">
          <Icon className="size-8 text-paec-violet/50" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
