import { X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { cn } from '@/lib/utils'
import { roleService, type Role } from '@/services/roleService'
import {
  userManagementService,
  type CreateAdminUserData,
} from '@/services/userManagementService'

type AddUserModalProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const fieldClassName = cn(
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const labelClassName = 'text-xs font-medium text-foreground'

export function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<CreateAdminUserData>({
    role_uuid: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  })

  const resetForm = useCallback(() => {
    setForm({
      role_uuid: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
    })
    setErrors({})
  }, [])

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true)
    try {
      const rolesData = await roleService.getRoles({ is_admin: 1 })
      setRoles(rolesData)
    } catch {
      toast.error('Failed to load roles.')
      setRoles([])
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      resetForm()
      return
    }
    void loadOptions()
  }, [open, loadOptions, resetForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const validation: Record<string, string> = {}
    if (!form.role_uuid) validation.role_uuid = 'Role is required'
    if (!form.email.trim()) validation.email = 'Email is required'
    if (!form.first_name.trim()) validation.first_name = 'First name is required'
    if (!form.last_name.trim()) validation.last_name = 'Last name is required'
    if (!form.password?.trim()) validation.password = 'Password is required'

    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setSubmitting(true)
    try {
      await userManagementService.createAdminUser({
        role_uuid: form.role_uuid,
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
      })
      toast.success('User created successfully.')
      resetForm()
      onClose()
      onSuccess?.()
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      if (Object.keys(apiErrors).length > 0) {
        const flat: Record<string, string> = {}
        for (const [key, value] of Object.entries(apiErrors)) {
          flat[key] = Array.isArray(value) ? value[0] : value
        }
        setErrors(flat)
      } else {
        toast.error(getApiErrorMessage(err, 'Failed to create user.'))
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
        aria-labelledby="add-user-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl"
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
          <h2 id="add-user-title" className="text-lg font-bold text-foreground">
            Add New User
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new admin user account
          </p>
        </div>

        <form
          id="add-user-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role_uuid}
                onChange={(e) => setForm((prev) => ({ ...prev, role_uuid: e.target.value }))}
                disabled={loadingOptions || submitting}
                className={cn(fieldClassName, 'mt-1.5')}
              >
                <option value="">
                  {loadingOptions ? 'Loading roles…' : 'Select a role'}
                </option>
                {roles.map((role) => (
                  <option key={role.uuid} value={role.uuid}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.role_uuid ? (
                <p className="mt-1 text-xs text-red-600">{errors.role_uuid}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClassName}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="admin@paec.com"
                disabled={submitting}
                className={cn(fieldClassName, 'mt-1.5')}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                placeholder="John"
                disabled={submitting}
                className={cn(fieldClassName, 'mt-1.5')}
              />
              {errors.first_name ? (
                <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
              ) : null}
            </div>
            <div>
              <label className={labelClassName}>
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                placeholder="Doe"
                disabled={submitting}
                className={cn(fieldClassName, 'mt-1.5')}
              />
              {errors.last_name ? (
                <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className={labelClassName}>
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.password ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              disabled={submitting}
              className={cn(fieldClassName, 'mt-1.5')}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            ) : null}
          </div>
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
            form="add-user-form"
            disabled={submitting}
            className="rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-paec-violet/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  )
}
