import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, FileText } from 'lucide-react'
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
        <section className="relative overflow-hidden bg-[#0f0a1a]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e]/90 via-[#1a0b2e]/70 to-[#0f0a1a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(124,58,237,0.18),_transparent_55%)]" />

          <div className="relative mx-auto max-w-4xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-20 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to home
            </Link>
            <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-paec-orange uppercase">
              <FileText className="size-3.5" />
              PAEC
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {loading ? 'Loading…' : error || !page ? 'Page not found' : page.title}
            </h1>
          </div>
        </section>

        <div className="relative mx-auto -mt-10 max-w-4xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          {loading ? (
            <div className="space-y-3 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="h-4 w-3/4 animate-pulse rounded bg-violet-100" />
              <div className="h-4 w-full animate-pulse rounded bg-violet-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-violet-100" />
            </div>
          ) : error || !page ? (
            <div className="rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">
                The page you are looking for does not exist or is not published.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex h-10 items-center rounded-full bg-paec-violet px-5 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark"
              >
                Browse activities
              </Link>
            </div>
          ) : (
            <article className="rounded-2xl border border-violet-100 bg-white p-5 shadow-lg shadow-violet-900/5 sm:p-8">
              <div
                className="prose prose-violet max-w-none text-foreground prose-p:text-muted-foreground"
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
