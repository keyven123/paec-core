import { Eye, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { ImageLightbox } from './ImageLightbox'
import {
  ImagePreviewFrame,
  type ImagePreviewVariant,
} from './ImagePreviewFrame'

type ActivityImageFieldProps = {
  label: string
  hint: string
  file: File | null
  existingUrl?: string | null
  onFileChange: (file: File | null) => void
  variant: ImagePreviewVariant
  maxSize?: string
}

export function ActivityImageField({
  label,
  hint,
  file,
  existingUrl,
  onFileChange,
  variant,
  maxSize = 'Max 10MB',
}: ActivityImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const objectUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  )

  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    },
    [objectUrl],
  )

  const displayUrl = objectUrl ?? existingUrl ?? null
  const isNewSelection = !!file
  const hasExistingOnly = !!existingUrl && !file

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.[0]) return
    onFileChange(fileList[0])
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onFileChange(null)
  }

  return (
    <div className="flex h-full flex-col">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-2 rounded-lg border border-paec-orange/30 bg-orange-50/50 px-3 py-2 text-[11px] leading-relaxed text-paec-orange sm:text-xs">
        {hint}
      </div>

      {isNewSelection && existingUrl ? (
        <p className="mt-2 text-xs font-medium text-paec-violet">
          New image selected — save to replace the current image.
        </p>
      ) : null}

      {displayUrl ? (
        <div className="mt-3 flex flex-1 flex-col">
          <div className="rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 p-3">
            <ImagePreviewFrame src={displayUrl} alt={label} variant={variant} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-paec-violet/40 hover:bg-violet-50"
            >
              <Eye className="size-3.5 text-paec-violet" />
              Preview
            </button>
            {isNewSelection ? (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                <X className="size-3.5" />
                Remove
              </button>
            ) : hasExistingOnly ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-paec-violet/40 hover:bg-violet-50"
              >
                <Upload className="size-3.5 text-paec-violet" />
                Replace
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                <X className="size-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) =>
            event.key === 'Enter' && inputRef.current?.click()
          }
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            handleFiles(event.dataTransfer.files)
          }}
          className={cn(
            'mt-3 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 px-4 py-10 transition-colors hover:border-paec-violet/40 hover:bg-violet-50/60',
            variant === 'portrait' && 'min-h-[320px]',
            variant === 'landscape' && 'min-h-[260px]',
          )}
        >
          <Upload className="mb-2 size-6 text-muted-foreground" />
          <p className="text-center text-xs text-muted-foreground">
            Drag and drop or click to upload
          </p>
          <p className="mt-1 text-center text-[10px] text-muted-foreground/70">
            PNG, JPG, JPEG · {maxSize}
          </p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              inputRef.current?.click()
            }}
            className="mt-3 rounded-lg bg-paec-violet px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark"
          >
            Choose File
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/jfif"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {displayUrl ? (
        <ImageLightbox
          src={displayUrl}
          alt={label}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </div>
  )
}
