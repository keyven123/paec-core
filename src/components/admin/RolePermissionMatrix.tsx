import { Info } from 'lucide-react'
import { Fragment, useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  ACCESS_ACTIONS,
  groupPermissionsByModule,
  hasAccessLetter,
} from '@/lib/rolePermissionUtils'
import { cn } from '@/lib/utils'
import type { PermissionCatalogItem } from '@/services/permissionCatalogService'

function PermissionDescriptionTip({
  name,
  description,
}: {
  name: string
  description: string
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    setPosition({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    })
  }, [])

  const show = useCallback(() => {
    updatePosition()
    setOpen(true)
  }, [updatePosition])

  const hide = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-100 hover:text-paec-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paec-violet/30"
        aria-label={`About ${name}`}
        aria-describedby={open ? `permission-tip-${name.replace(/\s+/g, '-')}` : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <Info className="size-3" />
      </button>

      {open
        ? createPortal(
            <div
              id={`permission-tip-${name.replace(/\s+/g, '-')}`}
              role="tooltip"
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                transform: 'translate(-50%, -100%)',
                zIndex: 9999,
              }}
              className={cn(
                'w-64 max-w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-violet-100',
                'bg-white px-3 py-2 text-[11px] leading-relaxed text-foreground shadow-lg',
              )}
            >
              {description}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

type RolePermissionMatrixProps = {
  permissions: PermissionCatalogItem[]
  accessMap: Record<string, string>
  onToggle: (permissionCode: string, letter: string, checked: boolean) => void
  disabled?: boolean
  loading?: boolean
  className?: string
  /** When true, matrix fills its parent height and scrolls internally (one scrollbar). */
  constrainedHeight?: boolean
}

export function RolePermissionMatrix({
  permissions,
  accessMap,
  onToggle,
  disabled = false,
  loading = false,
  className,
  constrainedHeight = false,
}: RolePermissionMatrixProps) {
  const moduleGroups = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions],
  )

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Loading permissions...
      </p>
    )
  }

  if (permissions.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No permissions available. Refresh the page or sign in again.
      </p>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-violet-100',
        constrainedHeight && 'flex min-h-0 flex-col',
        className,
      )}
    >
      <div
        className={cn(
          constrainedHeight ? 'min-h-0 flex-1 overflow-auto' : 'overflow-x-auto',
        )}
      >
        <table className="w-max min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-violet-50/95 backdrop-blur-sm">
            <tr className="border-b border-violet-100">
              <th className="sticky left-0 z-20 min-w-[200px] bg-violet-50/95 px-3 py-2 text-[10px] font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase">
                Permission
              </th>
              {ACCESS_ACTIONS.map((action) => (
                <th
                  key={action.letter}
                  className="min-w-[72px] px-2 py-2 text-center text-[10px] font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase"
                >
                  {action.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {moduleGroups.map(({ module, permissions: modulePermissions }) => (
              <Fragment key={module}>
                <tr className="bg-orange-50/60">
                  <td
                    colSpan={ACCESS_ACTIONS.length + 1}
                    className="sticky left-0 px-3 py-1.5 text-[10px] font-bold tracking-wider text-paec-orange uppercase"
                  >
                    {module}
                  </td>
                </tr>
                {modulePermissions.map((permission) => {
                  const available = permission.available_access ?? []
                  const currentAccess = accessMap[permission.code] ?? ''

                  return (
                    <tr
                      key={permission.uuid}
                      className="border-b border-violet-50 transition-colors hover:bg-violet-50/30"
                    >
                      <td className="sticky left-0 min-w-[200px] bg-white px-3 py-2 pl-5">
                        <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                          <span>{permission.name}</span>
                          {permission.description?.trim() ? (
                            <PermissionDescriptionTip
                              name={permission.name}
                              description={permission.description.trim()}
                            />
                          ) : null}
                        </div>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {permission.code}
                        </p>
                      </td>
                      {ACCESS_ACTIONS.map((action) => {
                        const supported = available.includes(action.letter)
                        const checked =
                          supported && hasAccessLetter(currentAccess, action.letter)

                        return (
                          <td key={action.letter} className="min-w-[72px] px-2 py-2 text-center">
                            {supported ? (
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={(e) =>
                                  onToggle(permission.code, action.letter, e.target.checked)
                                }
                                className="size-4 rounded border-violet-200 text-paec-violet focus:ring-paec-violet/20 disabled:opacity-50"
                              />
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
