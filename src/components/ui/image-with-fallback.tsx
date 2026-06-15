import { ImageIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

type ImageWithFallbackProps = {
  src: string
  alt: string
  className?: string
  fallbackClassName?: string
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false)

  if (!src?.trim() || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-paec-violet/30 to-paec-orange/20',
          fallbackClassName ?? className,
        )}
      >
        <ImageIcon className="size-8 text-white/40" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
