import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export type SelectOption = {
  value: string
  label: string
}

type ThemedSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
}

export function ThemedSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
}: ThemedSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-11 w-full items-center rounded-xl border border-violet-100 bg-white px-3 text-left text-sm transition-colors',
          'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
          open && 'border-paec-violet ring-2 ring-paec-violet/20',
        )}
      >
        <span
          className={cn(
            'flex-1 truncate pr-2',
            selected ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-violet-100 bg-white py-1 shadow-lg">
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                  isSelected
                    ? 'bg-paec-violet font-medium text-white'
                    : 'text-foreground hover:bg-violet-50',
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="size-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
