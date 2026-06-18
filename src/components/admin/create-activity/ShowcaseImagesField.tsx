import { Eye, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ExistingImage } from '@/types/editActivity'

import { ImageLightbox } from './ImageLightbox'
import { ImagePreviewFrame } from './ImagePreviewFrame'

type ShowcaseImagesFieldProps = {
  label: string
  hint: string
  files: File[]
  existingImages?: ExistingImage[]
  onChange: (files: File[]) => void
  maxSize?: string
}

export function ShowcaseImagesField({
  label,
  hint,
  files,
  existingImages = [],
  onChange,
  maxSize = 'Max 5MB each, up to 10 images',
}: ShowcaseImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const newPreviewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  )

  useEffect(
    () => () => {
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    },
    [newPreviewUrls],
  )

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const next = [...files, ...Array.from(fileList)].slice(0, 10)
    onChange(next)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index))
  }

  const hasGallery = existingImages.length > 0 || files.length > 0

  return (
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-2 rounded-lg border border-paec-orange/30 bg-orange-50/50 px-3 py-2 text-[11px] leading-relaxed text-paec-orange sm:text-xs">
        {hint}
      </div>

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
        className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 px-4 py-8 transition-colors hover:border-paec-violet/40 hover:bg-violet-50/60"
      >
        <Upload className="mb-2 size-6 text-muted-foreground" />
        <p className="text-center text-xs text-muted-foreground">
          Drag and drop or click to upload multiple files
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
          className="mt-3 rounded-lg border border-violet-200 bg-white px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-paec-violet/40 hover:bg-violet-50"
        >
          Choose Files
        </button>
        {files.length > 0 ? (
          <p className="mt-2 text-xs font-medium text-paec-violet">
            {files.length} new file{files.length > 1 ? 's' : ''} selected
          </p>
        ) : null}
      </div>

      {hasGallery ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {existingImages.map((image) => (
            <div key={image.uuid} className="flex flex-col">
              <div className="rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 p-2">
                <ImagePreviewFrame
                  src={image.url}
                  alt="Showcase"
                  variant="gallery"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxSrc(image.url)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-violet-50"
                >
                  <Eye className="size-3 text-paec-violet" />
                  Preview
                </button>
              </div>
            </div>
          ))}

          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex flex-col"
            >
              <div className="relative rounded-xl border-2 border-dashed border-paec-violet/30 bg-violet-50/30 p-2">
                <ImagePreviewFrame
                  src={newPreviewUrls[index]}
                  alt={file.name}
                  variant="gallery"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxSrc(newPreviewUrls[index])}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-violet-50"
                >
                  <Eye className="size-3 text-paec-violet" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-100"
                >
                  <X className="size-3" />
                  Remove
                </button>
                <p className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
                  {file.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/jfif"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {lightboxSrc ? (
        <ImageLightbox
          src={lightboxSrc}
          alt="Showcase preview"
          open
          onClose={() => setLightboxSrc(null)}
        />
      ) : null}
    </div>
  )
}
