import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type RowAction = {
  label: string
  icon: LucideIcon
  onSelect: () => void
  danger?: boolean
}

const MENU_WIDTH = 160

export function RowActionsMenu({
  actions,
  label = 'Actions',
}: {
  actions: Array<RowAction>
  label?: string
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  )

  useEffect(() => {
    if (!position) return

    const close = () => setPosition(null)
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return
      }
      close()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [position])

  const toggle = () => {
    if (position) {
      setPosition(null)
      return
    }
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuHeight = actions.length * 36 + 8
    const opensUp = rect.bottom + menuHeight + 8 > window.innerHeight
    setPosition({
      top: opensUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    })
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          toggle()
        }}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground',
          position && 'bg-violet-50 text-foreground',
        )}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={position !== null}
      >
        <MoreVertical className="size-4" />
      </button>

      {position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
              className="fixed z-[90] rounded-xl border border-violet-100 bg-white p-1 shadow-lg shadow-violet-900/10"
              onClick={(event) => event.stopPropagation()}
            >
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setPosition(null)
                      action.onSelect()
                    }}
                    className={cn(
                      'flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm font-medium transition-colors',
                      action.danger
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-foreground hover:bg-violet-50',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {action.label}
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
