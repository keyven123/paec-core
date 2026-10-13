import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function inputClass(error?: string) {
  return cn(
    'h-10 w-full rounded-lg border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:outline-none',
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-violet-100 focus:border-paec-violet focus:ring-paec-violet/20',
  )
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground sm:text-lg">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className="text-xs font-semibold text-foreground">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
      {error ? (
        <span className="mt-1 block text-[11px] text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}

export function TagPicker({
  options,
  selected,
  onToggle,
  addLabel,
}: {
  options: ReadonlyArray<string>
  selected: Array<string>
  onToggle: (value: string) => void
  addLabel: string
}) {
  const [custom, setCustom] = useState('')
  const extras = selected.filter((value) => !options.includes(value))

  const addCustom = () => {
    const value = custom.trim()
    if (value && !selected.includes(value)) onToggle(value)
    setCustom('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {[...options, ...extras].map((option) => {
          const active = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                active
                  ? 'border-paec-violet bg-paec-violet text-white'
                  : 'border-violet-100 bg-white text-foreground hover:border-violet-300 hover:bg-violet-50',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
          placeholder={addLabel}
          maxLength={60}
          className={cn(inputClass(), 'h-9 text-xs sm:max-w-xs')}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="shrink-0 rounded-lg border border-violet-200 px-3 text-xs font-semibold text-paec-violet transition-colors hover:bg-violet-50 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export function ImageTile({
  url,
  label,
  onRemove,
  badge,
  className,
}: {
  url: string
  label: string
  onRemove: () => void
  badge?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-violet-100 bg-violet-50',
        className,
      )}
    >
      <img src={url} alt={label} className="size-full object-cover" />
      {badge ? (
        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 inline-flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-600"
        aria-label={`Remove ${label.toLowerCase()}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export function UploadTile({
  label,
  hint,
  uploading,
  multiple,
  onSelect,
  className,
}: {
  label: string
  hint?: string
  uploading: boolean
  multiple?: boolean
  onSelect: (files: Array<File>) => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        onSelect(Array.from(e.dataTransfer.files))
      }}
      disabled={uploading}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 text-center text-xs font-semibold text-paec-violet transition-colors disabled:cursor-wait',
        dragging
          ? 'border-paec-violet bg-violet-50'
          : 'border-violet-200 bg-violet-50/40 hover:border-paec-violet hover:bg-violet-50',
        className,
      )}
    >
      {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
      {uploading ? 'Uploading…' : label}
      {hint && !uploading ? (
        <span className="text-[11px] font-normal text-muted-foreground">{hint}</span>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          onSelect(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
    </button>
  )
}
