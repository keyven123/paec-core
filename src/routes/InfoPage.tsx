import { Link, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { cmsService, type CmsPage } from '@/services/cmsService'

export function InfoPage() {
  const { slug } = useParams({ strict: false }) as { slug: string }
  const [page, setPage] = useState<CmsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      setLoading(true)
      setError(null)
      try {
        const data = await cmsService.getPublicPage(slug)
        if (!cancelled) setPage(data)
      } catch {
        if (!cancelled) {
          setError('Page not found.')
          setPage(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPage()

    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-sm font-medium text-paec-violet hover:underline"
          >
            ← Back to home
          </Link>

          {loading ? (
            <p className="mt-8 text-sm text-muted-foreground">Loading page...</p>
          ) : error || !page ? (
            <div className="mt-8 rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-sm">
              <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The page you are looking for does not exist or is not published.
              </p>
            </div>
          ) : (
            <article className="mt-8 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm sm:p-8">
              <h1 className="text-3xl font-bold text-foreground">{page.title}</h1>
              <div
                className="prose prose-violet mt-6 max-w-none text-foreground prose-p:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: page.content ?? '' }}
              />
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
