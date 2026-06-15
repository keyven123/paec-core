import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api'
import { slugifyRoleCode as slugify } from '@/lib/rolePermissionUtils'
import { cn } from '@/lib/utils'
import type { CmsPage, CmsPagePayload } from '@/services/cmsService'

type CmsPageModalProps = {
  open: boolean
  page?: CmsPage | null
  onClose: () => void
  onSuccess: () => void
  onSave: (payload: CmsPagePayload, uuid?: string) => Promise<void>
}

const fieldClassName = cn(
  'w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

const labelClassName = 'text-xs font-medium text-foreground'

export function CmsPageModal({
  open,
  page,
  onClose,
  onSuccess,
  onSave,
}: CmsPageModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<CmsPagePayload>({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    show_in_footer: false,
    footer_column: null,
    sort_order: 0,
  })

  useEffect(() => {
    if (!open) return
    setErrors({})
    setSlugTouched(false)
    if (page) {
      setForm({
        title: page.title,
        slug: page.slug,
        content: page.content ?? '',
        status: page.status,
        show_in_footer: page.show_in_footer,
        footer_column: page.footer_column ?? null,
        sort_order: page.sort_order ?? 0,
      })
    } else {
      setForm({
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        show_in_footer: false,
        footer_column: null,
        sort_order: 0,
      })
    }
  }, [open, page])

  useEffect(() => {
    if (!slugTouched && form.title.trim()) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.title) }))
    }
  }, [form.title, slugTouched])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      await onSave(form, page?.uuid)
      toast.success(page ? 'Page updated successfully.' : 'Page created successfully.')
      onSuccess()
      onClose()
    } catch (err) {
      const apiErrors = getApiValidationErrors(err)
      if (Object.keys(apiErrors).length > 0) {
        const flat: Record<string, string> = {}
        for (const [key, value] of Object.entries(apiErrors)) {
          flat[key] = Array.isArray(value) ? value[0] : value
        }
        setErrors(flat)
      } else {
        toast.error(getApiErrorMessage(err, 'Failed to save page.'))
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

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl">
        <div className="shrink-0 border-b border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">
            {page ? 'Edit Page' : 'Create Page'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Information pages appear at /pages/your-slug on the marketplace.
          </p>
        </div>

        <form
          id="cms-page-form"
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="About Us"
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              />
              {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title}</p> : null}
            </div>
            <div>
              <label className={labelClassName}>
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }}
                placeholder="about-us"
                className={cn(fieldClassName, 'mt-1.5 h-10 font-mono text-xs')}
                disabled={submitting}
              />
              {errors.slug ? <p className="mt-1 text-xs text-red-600">{errors.slug}</p> : null}
            </div>
          </div>

          <div>
            <label className={labelClassName}>Content</label>
            <textarea
              value={form.content ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={10}
              placeholder="Page content (HTML supported)"
              className={cn(fieldClassName, 'mt-1.5 py-2')}
              disabled={submitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClassName}>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as CmsPagePayload['status'],
                  }))
                }
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className={labelClassName}>Sort Order</label>
              <input
                type="number"
                min={0}
                value={form.sort_order ?? 0}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))
                }
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.show_in_footer ?? false}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, show_in_footer: e.target.checked }))
                  }
                  disabled={submitting}
                  className="size-4 rounded border-violet-200 text-paec-violet"
                />
                Show in footer
              </label>
            </div>
          </div>

          {form.show_in_footer ? (
            <div>
              <label className={labelClassName}>Footer Column</label>
              <select
                value={form.footer_column ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    footer_column: (e.target.value || null) as CmsPagePayload['footer_column'],
                  }))
                }
                className={cn(fieldClassName, 'mt-1.5 h-10')}
                disabled={submitting}
              >
                <option value="">None</option>
                <option value="explore">Location / Explore</option>
                <option value="support">Support</option>
              </select>
            </div>
          ) : null}
        </form>

        <div className="flex shrink-0 justify-end gap-2 border-t border-violet-100 px-6 py-4">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold text-foreground hover:bg-violet-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="cms-page-form"
            disabled={submitting}
            className="rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white hover:bg-paec-violet/90 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : page ? 'Update Page' : 'Create Page'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function FooterLinksEditor({
  title,
  links,
  onChange,
  disabled,
}: {
  title: string
  links: Array<{ label: string; href: string }>
  onChange: (links: Array<{ label: string; href: string }>) => void
  disabled?: boolean
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...links, { label: '', href: '' }])}
          className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1 text-xs font-semibold text-paec-violet hover:bg-violet-50 disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          Add Link
        </button>
      </div>
      <div className="space-y-2">
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No links yet.</p>
        ) : (
          links.map((link, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={link.label}
                onChange={(e) => {
                  const next = [...links]
                  next[index] = { ...next[index], label: e.target.value }
                  onChange(next)
                }}
                placeholder="Label"
                disabled={disabled}
                className={cn(fieldClassName, 'h-9')}
              />
              <input
                type="text"
                value={link.href}
                onChange={(e) => {
                  const next = [...links]
                  next[index] = { ...next[index], href: e.target.value }
                  onChange(next)
                }}
                placeholder="/pages/about-us or https://..."
                disabled={disabled}
                className={cn(fieldClassName, 'h-9')}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(links.filter((_, i) => i !== index))}
                className="flex size-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                aria-label="Remove link"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
