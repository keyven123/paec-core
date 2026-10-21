import {
  Bold,
  Heading3,
  Italic,
  List,
  ListOrdered,
  RemoveFormatting,
  Underline,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'
import {
  isHtmlContent,
  plainTextToHtml,
  sanitizeRichHtml,
} from '@/lib/richText'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minHeightClassName?: string
}

function toEditableHtml(value: string): string {
  if (!value) return ''
  return isHtmlContent(value) ? sanitizeRichHtml(value) : plainTextToHtml(value)
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled,
  minHeightClassName = 'min-h-36',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const focusedRef = useRef(false)

  // Sync external value (e.g. opening Edit) without clobbering typing.
  useEffect(() => {
    const el = editorRef.current
    if (!el || focusedRef.current) return
    const next = toEditableHtml(value)
    if (el.innerHTML !== next) el.innerHTML = next
  }, [value])

  const emit = () => {
    const el = editorRef.current
    if (!el) return
    const text = (el.textContent ?? '').trim()
    onChange(text ? el.innerHTML : '')
  }

  const runCommand = (command: string, arg?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    emit()
  }

  const toggleHeading = () => {
    const block = document.queryCommandValue('formatBlock')
    runCommand('formatBlock', block === 'h3' ? 'p' : 'h3')
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    const cleaned = html
      ? sanitizeRichHtml(html)
      : plainTextToHtml(text)
    if (cleaned) {
      document.execCommand('insertHTML', false, cleaned)
      emit()
    }
  }

  const toolbarButtons: Array<{
    label: string
    icon: typeof Bold
    action: () => void
  }> = [
    { label: 'Heading', icon: Heading3, action: toggleHeading },
    { label: 'Bold', icon: Bold, action: () => runCommand('bold') },
    { label: 'Italic', icon: Italic, action: () => runCommand('italic') },
    { label: 'Underline', icon: Underline, action: () => runCommand('underline') },
    { label: 'Bullet list', icon: List, action: () => runCommand('insertUnorderedList') },
    { label: 'Numbered list', icon: ListOrdered, action: () => runCommand('insertOrderedList') },
    { label: 'Clear formatting', icon: RemoveFormatting, action: () => runCommand('removeFormat') },
  ]

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-violet-100 bg-white transition-colors',
        'focus-within:border-paec-violet focus-within:ring-2 focus-within:ring-paec-violet/20',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-violet-100 bg-violet-50/60 px-2 py-1.5">
        {toolbarButtons.map((btn) => {
          const Icon = btn.icon
          return (
            <button
              key={btn.label}
              type="button"
              title={btn.label}
              aria-label={btn.label}
              onMouseDown={(e) => {
                e.preventDefault()
                btn.action()
              }}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white hover:text-paec-violet"
            >
              <Icon className="size-4" />
            </button>
          )
        })}
        <span className="ml-auto hidden text-[11px] text-muted-foreground sm:block">
          Paste formatted text — headings, bold &amp; bullets are kept
        </span>
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder}
          onInput={emit}
          onPaste={handlePaste}
          onFocus={() => {
            focusedRef.current = true
          }}
          onBlur={() => {
            focusedRef.current = false
            const el = editorRef.current
            if (el) {
              const next = toEditableHtml(el.innerHTML)
              if (el.innerHTML !== next) el.innerHTML = next
              emit()
            }
          }}
          className={cn(
            'rich-text-content rich-text-editor w-full px-3 py-2.5 text-sm text-foreground outline-none',
            minHeightClassName,
          )}
        />
      </div>
    </div>
  )
}
