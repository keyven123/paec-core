import { X } from 'lucide-react'
import { useEffect } from 'react'

type ImageLightboxProps = {
  src: string
  alt: string
  open: boolean
  onClose: () => void
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${alt}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Close preview"
      >
        <X className="size-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-full object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  )
}
