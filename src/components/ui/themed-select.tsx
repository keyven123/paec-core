import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type ThemedSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
}

type MenuPosition = {
  top: number
  left: number
  width: number
  maxHeight: number
  openUp: boolean
}

export function ThemedSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
}: ThemedSelectProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selected = options.find((option) => option.value === value)

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return

    const gap = 8
    const estimatedHeight = Math.min(options.length * 42 + 8, 240)
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow
    const maxHeight = Math.max(
      120,
      Math.min(240, openUp ? spaceAbove : spaceBelow),
    )

    setPosition({
      top: openUp ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUp,
    })
  }

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    updatePosition()
  }, [open, options.length])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        menuRef.current?.contains(target) ||
        containerRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const handleReposition = () => updatePosition()

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open, options.length])

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
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

      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              style={{
                top: position.openUp ? undefined : position.top,
                bottom: position.openUp
                  ? window.innerHeight - position.top
                  : undefined,
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
              className="fixed z-[90] overflow-y-auto rounded-xl border border-violet-100 bg-white py-1 shadow-lg shadow-violet-900/10"
            >
              {options.map((option) => {
                const isSelected = option.value === value
                const optionDisabled = Boolean(option.disabled)

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={optionDisabled}
                    onClick={() => {
                      if (optionDisabled) return
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                      optionDisabled
                        ? 'cursor-not-allowed text-muted-foreground opacity-60'
                        : isSelected
                          ? 'bg-paec-violet font-medium text-white'
                          : 'text-foreground hover:bg-violet-50',
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && !optionDisabled ? (
                      <Check className="size-4 shrink-0" />
                    ) : null}
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
