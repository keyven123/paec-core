import type { LucideIcon } from 'lucide-react'

type AccountPlaceholderSectionProps = {
  title: string
  highlight: string
  description: string
  icon: LucideIcon
}

export function AccountPlaceholderSection({
  title,
  highlight,
  description,
  icon: Icon,
}: AccountPlaceholderSectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        {title} <span className="text-paec-violet">{highlight}</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="mt-8 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-violet-100 bg-white px-6 py-16 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-50">
          <Icon className="size-8 text-paec-violet/40" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Nothing here yet</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          This section will be available once the backend is connected.
        </p>
      </div>
    </div>
  )
}
