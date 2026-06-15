import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

import { cn } from '@/lib/utils'

type ConfirmModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  variant?: 'danger' | 'default'
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'default',
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, loading, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
        aria-label="Close modal"
        disabled={loading}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl"
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full',
                variant === 'danger'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-violet-100 text-paec-violet',
              )}
            >
              <AlertTriangle className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id="confirm-modal-title"
                className="text-lg font-bold text-foreground"
              >
                {title}
              </h2>
              <p
                id="confirm-modal-message"
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-violet-100 bg-violet-50/40 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-paec-violet hover:bg-paec-violet-dark',
            )}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
