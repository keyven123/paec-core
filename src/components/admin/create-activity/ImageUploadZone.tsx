import { Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

type ImageUploadZoneProps = {
  label: string
  hint: string
  multiple?: boolean
  maxSize?: string
  files: File[]
  onChange: (files: File[]) => void
  className?: string
}

export function ImageUploadZone({
  label,
  hint,
  multiple = false,
  maxSize = 'Max 10MB',
  files,
  onChange,
  className,
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  )

  useEffect(
    () => () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    },
    [previewUrls],
  )

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const next = multiple
      ? [...files, ...Array.from(fileList)].slice(0, 10)
      : [fileList[0]]
    onChange(next)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index))
  }

  return (
    <div className={className}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-2 rounded-lg border border-paec-orange/30 bg-orange-50/50 px-3 py-2 text-[11px] leading-relaxed text-paec-orange sm:text-xs">
        {hint}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 px-4 py-8 transition-colors hover:border-paec-violet/40 hover:bg-violet-50/60"
      >
        <Upload className="mb-2 size-6 text-muted-foreground" />
        <p className="text-center text-xs text-muted-foreground">
          Drag and drop or click to upload
          {multiple ? ' multiple files' : ''}
        </p>
        <p className="mt-1 text-center text-[10px] text-muted-foreground/70">
          PNG, JPG, JPEG · {maxSize}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
          className="mt-3 rounded-lg bg-paec-violet px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-paec-violet-dark"
        >
          {multiple ? 'Choose Files' : 'Choose File'}
        </button>
        {files.length > 0 ? (
          <p className="mt-2 text-xs font-medium text-paec-violet">
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </p>
        ) : null}
      </div>

      {files.length > 0 ? (
        <div
          className={
            multiple
              ? 'mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3'
              : 'mt-3'
          }
        >
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="relative">
              <img
                src={previewUrls[index]}
                alt={file.name}
                className="h-32 w-full rounded-lg border border-violet-100 object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3.5" />
              </button>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/jfif"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
