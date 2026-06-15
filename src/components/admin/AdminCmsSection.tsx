import { FileText, LayoutTemplate, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CmsPageModal, FooterLinksEditor } from '@/components/admin/CmsPageModal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  cmsService,
  DEFAULT_FOOTER_SETTINGS,
  normalizeFooterSettings,
  type CmsFooterSettings,
  type CmsPage,
  type CmsPagePayload,
} from '@/services/cmsService'

type CmsTab = 'pages' | 'footer'

const tabs: { id: CmsTab; label: string; icon: typeof FileText }[] = [
  { id: 'pages', label: 'Information Pages', icon: FileText },
  { id: 'footer', label: 'Footer Settings', icon: LayoutTemplate },
]

const fieldClassName = cn(
  'h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
)

export function AdminCmsSection() {
  const [activeTab, setActiveTab] = useState<CmsTab>('pages')
  const [pages, setPages] = useState<CmsPage[]>([])
  const [loadingPages, setLoadingPages] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editPage, setEditPage] = useState<CmsPage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [footer, setFooter] = useState<CmsFooterSettings>(DEFAULT_FOOTER_SETTINGS)
  const [loadingFooter, setLoadingFooter] = useState(true)
  const [savingFooter, setSavingFooter] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search])

  const loadPages = useCallback(async () => {
    setLoadingPages(true)
    try {
      const response = await cmsService.listPages({
        q: debouncedSearch || undefined,
        per_page: 50,
      })
      setPages(response.data ?? [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load pages.'))
      setPages([])
    } finally {
      setLoadingPages(false)
    }
  }, [debouncedSearch])

  const loadFooter = useCallback(async () => {
    setLoadingFooter(true)
    try {
      const data = await cmsService.getFooterSettings()
      setFooter(data)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load footer settings.'))
      setFooter(DEFAULT_FOOTER_SETTINGS)
    } finally {
      setLoadingFooter(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'pages') void loadPages()
  }, [activeTab, loadPages])

  useEffect(() => {
    if (activeTab === 'footer') void loadFooter()
  }, [activeTab, loadFooter])

  const handleSavePage = async (payload: CmsPagePayload, uuid?: string) => {
    if (uuid) {
      await cmsService.updatePage(uuid, payload)
    } else {
      await cmsService.createPage(payload)
    }
  }

  const handleDeletePage = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await cmsService.deletePage(deleteTarget.uuid)
      toast.success('Page deleted successfully.')
      setDeleteTarget(null)
      void loadPages()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete page.'))
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingFooter(true)
    try {
      const normalized = normalizeFooterSettings(footer)
      const updated = await cmsService.updateFooterSettings(normalized)
      setFooter(updated)
      toast.success('Footer settings saved. Refresh the marketplace to see changes.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save footer settings.'))
    } finally {
      setSavingFooter(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground lg:text-2xl">Content Management</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Manage marketplace information pages and footer content.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm',
                isActive
                  ? 'bg-paec-orange text-white shadow-sm shadow-paec-orange/20'
                  : 'border border-violet-100 bg-white text-muted-foreground hover:bg-violet-50 hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'pages' ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pages..."
                className={cn(fieldClassName, 'pl-9')}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setEditPage(null)
                setModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-paec-violet px-3 py-2 text-xs font-semibold text-white hover:bg-paec-violet/90 sm:text-sm"
            >
              <Plus className="size-3.5" />
              New Page
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-violet-50/80">
                <tr className="border-b border-violet-100 text-[10px] tracking-wider text-muted-foreground uppercase">
                  {['Title', 'Slug', 'Status', 'Footer', 'Actions'].map((col) => (
                    <th key={col} className="px-3 py-2 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingPages ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                      Loading pages...
                    </td>
                  </tr>
                ) : pages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                      No pages found.
                    </td>
                  </tr>
                ) : (
                  pages.map((page) => (
                    <tr key={page.uuid} className="border-b border-violet-50 hover:bg-violet-50/30">
                      <td className="px-3 py-2.5 text-xs font-medium text-foreground">
                        {page.title}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                        /pages/{page.slug}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                            page.status === 'published'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700',
                          )}
                        >
                          {page.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {page.show_in_footer
                          ? page.footer_column ?? 'Yes'
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditPage(page)
                              setModalOpen(true)
                            }}
                            className="rounded-md border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-paec-violet hover:bg-violet-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(page)}
                            className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSaveFooter(e)} className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-6">
          {loadingFooter ? (
            <p className="text-sm text-muted-foreground">Loading footer settings...</p>
          ) : (
            <>
              <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Company Info</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground">Description</label>
                    <textarea
                      value={footer.company_description}
                      onChange={(e) =>
                        setFooter((prev) => ({ ...prev, company_description: e.target.value }))
                      }
                      rows={3}
                      className={cn(fieldClassName, 'mt-1.5 h-auto py-2')}
                      disabled={savingFooter}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Copyright</label>
                      <input
                        type="text"
                        value={footer.copyright}
                        onChange={(e) =>
                          setFooter((prev) => ({ ...prev, copyright: e.target.value }))
                        }
                        className={cn(fieldClassName, 'mt-1.5')}
                        disabled={savingFooter}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Contact Us</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      value={footer.contact_email}
                      onChange={(e) =>
                        setFooter((prev) => ({ ...prev, contact_email: e.target.value }))
                      }
                      className={cn(fieldClassName, 'mt-1.5')}
                      disabled={savingFooter}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Phone</label>
                    <input
                      type="text"
                      value={footer.contact_phone}
                      onChange={(e) =>
                        setFooter((prev) => ({ ...prev, contact_phone: e.target.value }))
                      }
                      className={cn(fieldClassName, 'mt-1.5')}
                      disabled={savingFooter}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Address</label>
                    <input
                      type="text"
                      value={footer.contact_address}
                      onChange={(e) =>
                        setFooter((prev) => ({ ...prev, contact_address: e.target.value }))
                      }
                      className={cn(fieldClassName, 'mt-1.5')}
                      disabled={savingFooter}
                    />
                  </div>
                </div>
              </div>

              <FooterLinksEditor
                title="Location Links"
                links={footer.explore_links}
                onChange={(explore_links) => setFooter((prev) => ({ ...prev, explore_links }))}
                disabled={savingFooter}
              />

              <FooterLinksEditor
                title="Support Links"
                links={footer.support_links}
                onChange={(support_links) => setFooter((prev) => ({ ...prev, support_links }))}
                disabled={savingFooter}
              />

              <p className="text-xs text-muted-foreground">
                The &quot;Powered by Ticketoc&quot; section is fixed and cannot be edited from CMS.
                Empty link URLs are saved as &quot;#&quot;. Click Save below after making changes.
              </p>

              <div className="sticky bottom-0 -mx-1 flex justify-end border-t border-violet-100 bg-violet-50/90 px-1 py-3 backdrop-blur-sm">
                <button
                  type="submit"
                  disabled={savingFooter}
                  className="rounded-lg bg-paec-violet px-4 py-2 text-sm font-semibold text-white hover:bg-paec-violet/90 disabled:opacity-50"
                >
                  {savingFooter ? 'Saving...' : 'Save Footer Settings'}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      <CmsPageModal
        open={modalOpen}
        page={editPage}
        onClose={() => setModalOpen(false)}
        onSuccess={() => void loadPages()}
        onSave={handleSavePage}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Page"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete Page"
        variant="danger"
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void handleDeletePage()}
      />
    </div>
  )
}
