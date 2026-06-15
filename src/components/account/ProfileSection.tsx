import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmModal } from '@/components/ui/confirm-modal'
import type { User } from '@/data/mockUser'
import { getApiErrorMessage } from '@/lib/api'
import { clearStoredUser } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { userService } from '@/services/userService'

type ProfileSectionProps = {
  user: User
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await userService.deleteAccount()
      clearStoredUser()
      toast.success('Your account has been deleted.')
      void navigate({ to: '/' })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not delete your account.'))
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        My <span className="text-paec-violet">profile</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account details and preferences.
      </p>

      <div className="mt-8 rounded-2xl border border-violet-100 bg-white p-6">
        <div className="flex items-center gap-4 border-b border-violet-50 pb-6">
          <div className="flex size-16 items-center justify-center rounded-full bg-paec-orange text-lg font-bold text-white">
            {user.initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" defaultValue={user.name} />
            <Field label="Email" defaultValue={user.email} type="email" />
            <Field label="Phone" placeholder="+63 9XX XXX XXXX" />
            <Field label="City" placeholder="Metro Manila" />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-paec-violet px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark"
          >
            Save changes
          </button>
        </form>
      </div>

      <section className="mt-6 rounded-2xl border border-red-200 bg-red-50/40 p-6">
        <h2 className="text-base font-semibold text-red-700">Delete account</h2>
        <p className="mt-2 text-sm text-red-700/80">
          Permanently remove your account and all associated data. This action
          cannot be undone.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-red-700/80">
          <li>You will not be able to sign in again</li>
          <li>Your tickets and transaction history will be removed</li>
        </ul>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          disabled={deleting}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
          Delete account
        </button>
      </section>

      <ConfirmModal
        open={deleteOpen}
        title="Delete account?"
        message="This will permanently delete your PAEC account. You will lose access to all tickets, transactions, and profile data. This cannot be reversed."
        confirmLabel={deleting ? 'Deleting…' : 'Delete account'}
        cancelLabel="Cancel"
        loading={deleting}
        variant="danger"
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={() => void handleDeleteAccount()}
      />
    </div>
  )
}

type FieldProps = {
  label: string
  defaultValue?: string
  placeholder?: string
  type?: string
}

function Field({ label, defaultValue, placeholder, type = 'text' }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn(
          'h-11 w-full rounded-xl border border-violet-100 bg-violet-50/30 px-4 text-sm',
          'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
        )}
      />
    </div>
  )
}
