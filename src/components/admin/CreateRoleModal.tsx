import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { isMerchantPartnerSession } from '@/lib/adminAuth'
import { RolePermissionMatrix } from '@/components/admin/RolePermissionMatrix'
import {
  accessMapToGrants,
  permissionsForPaecCatalog,
  slugifyRoleCode,
  toggleAccessLetter,
} from '@/lib/rolePermissionUtils'
import { cn } from '@/lib/utils'
import { type PermissionCatalogItem } from '@/services/permissionCatalogService'
import { roleService } from '@/services/roleService'

type CreateRoleModalProps = {
  open: boolean
  onClose: () => void
  permissions: PermissionCatalogItem[]
  catalogLoading?: boolean
  onSuccess?: (roleUuid: string) => void
}

const fieldClassName = cn(
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const labelClassName = 'text-xs font-medium text-foreground'

export function CreateRoleModal({
  open,
  onClose,
  permissions,
  catalogLoading = false,
  onSuccess,
}: CreateRoleModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [accessMap, setAccessMap] = useState<Record<string, string>>({})

  const resetForm = () => {
    setName('')
    setCode('')
    setCodeTouched(false)
    setAccessMap({})
    setErrors({})
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  useEffect(() => {
    if (!codeTouched && name.trim()) {
      setCode(slugifyRoleCode(name))
    }
  }, [name, codeTouched])

  const formPermissions = useMemo(
    () => permissionsForPaecCatalog(permissions),
    [permissions],
  )

  const handleToggle = (permissionCode: string, letter: string, checked: boolean) => {
    setAccessMap((prev) => ({
      ...prev,
      [permissionCode]: toggleAccessLetter(prev[permissionCode] ?? '', letter, checked),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!name.trim() || !code.trim()) {
      setErrors({
        ...(!name.trim() ? { name: 'Role name is required' } : {}),
        ...(!code.trim() ? { code: 'Role code is required' } : {}),
      })
      return
    }

    setSubmitting(true)
    try {
      const created = await roleService.createRole({
        name: name.trim(),
        code: code.trim(),
        is_admin: !isMerchantPartnerSession(),
        permission_grants: accessMapToGrants(accessMap),
      })
      toast.success('Role created successfully.')
      resetForm()
      onClose()
      onSuccess?.(created.uuid)
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      if (Object.keys(apiErrors).length > 0) {
        const flat: Record<string, string> = {}
        for (const [key, value] of Object.entries(apiErrors)) {
          flat[key] = Array.isArray(value) ? value[0] : value
        }
        setErrors(flat)
      } else {
        toast.error(getApiErrorMessage(err, 'Failed to create role.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
        aria-label="Close modal"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-role-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl"
      >
        <div className="shrink-0 border-b border-violet-100 px-6 py-4 text-center">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <h2 id="create-role-title" className="text-lg font-bold text-foreground">
            Create Role
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define a new admin role and assign platform permissions.
          </p>
        </div>

        <form
          id="create-role-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Content Manager"
                disabled={submitting}
                className={cn(fieldClassName, 'mt-1.5')}
              />
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
            </div>
            <div>
              <label className={labelClassName}>
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCodeTouched(true)
                  setCode(e.target.value)
                }}
                placeholder="e.g. content-manager"
                disabled={submitting}
                className={cn(fieldClassName, 'mt-1.5 font-mono text-xs')}
              />
              {errors.code ? <p className="mt-1 text-xs text-red-600">{errors.code}</p> : null}
            </div>
          </div>

          <RolePermissionMatrix
            permissions={formPermissions}
            accessMap={accessMap}
            onToggle={handleToggle}
            disabled={submitting}
            loading={catalogLoading}
            className="border-0"
          />
          {errors.permission_grants ? (
            <p className="text-xs text-red-600">{errors.permission_grants}</p>
          ) : null}
        </form>

        <div className="flex shrink-0 justify-end gap-2 border-t border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-role-form"
            disabled={submitting || catalogLoading || formPermissions.length === 0}
            className="rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-violet/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  )
}
