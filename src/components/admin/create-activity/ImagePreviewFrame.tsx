import { cn } from '@/lib/utils'

export type ImagePreviewVariant = 'portrait' | 'landscape' | 'gallery'

type ImagePreviewFrameProps = {
  src: string
  alt: string
  variant?: ImagePreviewVariant
  className?: string
}

const variantClassName: Record<ImagePreviewVariant, string> = {
  portrait: 'mx-auto w-full max-w-[280px]',
  landscape: 'w-full',
  gallery: 'w-full',
}

export function ImagePreviewFrame({
  src,
  alt,
  variant = 'landscape',
  className,
}: ImagePreviewFrameProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-violet-100 bg-gradient-to-br from-violet-50/80 to-slate-50',
        variantClassName[variant],
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        className="mx-auto block max-h-[min(55vh,480px)] w-full object-contain"
      />
    </div>
  )
}
