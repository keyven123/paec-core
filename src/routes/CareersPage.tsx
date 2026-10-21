import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { CareerApplyButton } from '@/components/careers/CareerApplyButton'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { htmlToPlainText } from '@/lib/richText'
import { cn } from '@/lib/utils'
import {
  careerService,
  EMPLOYMENT_TYPE_LABELS,
  WORK_SETUP_LABELS,
  type CareerPosition,
} from '@/services/careerService'

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const isActive = value !== ''
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border py-2 pr-2.5 pl-3.5 text-xs font-semibold transition-colors sm:text-sm',
        isActive
          ? 'border-paec-violet bg-violet-50 text-paec-violet'
          : 'border-violet-200 bg-white text-foreground hover:border-paec-violet hover:text-paec-violet',
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span className="relative inline-flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="max-w-32 cursor-pointer appearance-none truncate bg-transparent pr-5 text-xs font-semibold outline-none sm:text-sm"
        >
          {options.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 size-4 shrink-0" />
      </span>
    </label>
  )
}

function PositionCard({ position }: { position: CareerPosition }) {
  const excerpt = htmlToPlainText(position.description)

  return (
    <article className="rounded-2xl border border-violet-100 bg-white p-5 shadow-lg shadow-violet-900/5 transition-shadow hover:shadow-xl hover:shadow-violet-900/10 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground">
            <Link
              to="/careers/$positionId"
              params={{ positionId: position.uuid }}
              className="transition-colors hover:text-paec-violet"
            >
              {position.title}
            </Link>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:text-sm">
            {position.department ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4 text-paec-violet" />
                {position.department}
              </span>
            ) : null}
            {position.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-paec-violet" />
                {position.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-paec-violet" />
              {EMPLOYMENT_TYPE_LABELS[position.employment_type] ??
                position.employment_type}
            </span>
            {position.work_setup ? (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-paec-violet">
                {WORK_SETUP_LABELS[position.work_setup] ?? position.work_setup}
              </span>
            ) : null}
          </div>
        </div>
        <CareerApplyButton position={position} />
      </div>

      {excerpt ? (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {excerpt}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-4 border-t border-violet-50 pt-4">
        <Link
          to="/careers/$positionId"
          params={{ positionId: position.uuid }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-paec-violet transition-colors hover:text-paec-violet-dark"
        >
          View details
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  )
}

type CareerSort = 'relevance' | 'newest' | 'title'

export function CareersPage() {
  const [positions, setPositions] = useState<CareerPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [nearLocation, setNearLocation] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [workSetupFilter, setWorkSetupFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sort, setSort] = useState<CareerSort>('relevance')
  const [view, setView] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    let cancelled = false

    careerService
      .listPublic()
      .then((data) => {
        if (!cancelled) setPositions(data)
      })
      .catch(() => {
        if (!cancelled) setPositions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const locations = useMemo(
    () =>
      [...new Set(positions.map((p) => p.location?.trim()).filter(Boolean) as string[])].sort(),
    [positions],
  )
  const departments = useMemo(
    () =>
      [...new Set(positions.map((p) => p.department?.trim()).filter(Boolean) as string[])].sort(),
    [positions],
  )

  const filteredPositions = useMemo(() => {
    const term = keyword.trim().toLowerCase()
    const near = nearLocation.trim().toLowerCase()

    const filtered = positions.filter((position) => {
      if (term) {
        const haystack = [
          position.title,
          position.department ?? '',
          position.location ?? '',
          WORK_SETUP_LABELS[position.work_setup] ?? '',
          htmlToPlainText(position.description),
          htmlToPlainText(position.requirements),
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (near && !(position.location ?? '').toLowerCase().includes(near)) {
        return false
      }
      if (locationFilter && position.location !== locationFilter) return false
      if (workSetupFilter && position.work_setup !== workSetupFilter) return false
      if (departmentFilter && position.department !== departmentFilter) return false
      if (typeFilter && position.employment_type !== typeFilter) return false
      return true
    })

    if (sort === 'title') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title))
    }
    if (sort === 'newest') {
      return [...filtered].sort((a, b) =>
        (b.created_at ?? '').localeCompare(a.created_at ?? ''),
      )
    }
    return filtered
  }, [positions, keyword, nearLocation, locationFilter, workSetupFilter, departmentFilter, typeFilter, sort])

  const hasActiveFilters = Boolean(
    keyword || nearLocation || locationFilter || workSetupFilter || departmentFilter || typeFilter,
  )

  const clearFilters = () => {
    setKeyword('')
    setNearLocation('')
    setLocationFilter('')
    setWorkSetupFilter('')
    setDepartmentFilter('')
    setTypeFilter('')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#0f0a1a]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e]/90 via-[#1a0b2e]/70 to-[#0f0a1a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(124,58,237,0.18),_transparent_55%)]" />

          <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12 sm:pb-24 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to home
            </Link>
            <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-paec-orange uppercase">
              <BriefcaseBusiness className="size-3.5" />
              PAEC
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Careers
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Join our team. Search our open positions below and apply today.
            </p>
          </div>
        </section>

        <div className="relative mx-auto -mt-12 max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          {/* Search bar — FIND | NEAR LOCATION, PAEC theme */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-xl shadow-violet-900/10 md:flex-row md:items-stretch"
          >
            <label className="flex flex-1 flex-col justify-center px-5 py-3">
              <span className="text-[11px] font-bold tracking-wider text-paec-violet uppercase">
                Find
              </span>
              <span className="mt-0.5 flex items-center gap-2">
                <Search className="size-4 shrink-0 text-muted-foreground md:hidden" />
                <input
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title, department, or keyword"
                  className="h-7 w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground sm:text-base"
                />
                {keyword ? (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    aria-label="Clear keyword"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </span>
            </label>

            <div className="hidden w-px bg-violet-100 md:block" />
            <div className="h-px bg-violet-100 md:hidden" />

            <label className="flex flex-1 flex-col justify-center px-5 py-3">
              <span className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-paec-violet uppercase">
                Near Location
                <ChevronDown className="size-3.5" />
              </span>
              <span className="mt-0.5 flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-muted-foreground md:hidden" />
                <input
                  type="search"
                  value={nearLocation}
                  onChange={(e) => setNearLocation(e.target.value)}
                  placeholder="City or location"
                  className="h-7 w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground sm:text-base"
                />
                {nearLocation ? (
                  <button
                    type="button"
                    onClick={() => setNearLocation('')}
                    aria-label="Clear location"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </span>
            </label>

            <button
              type="submit"
              aria-label="Search jobs"
              className="flex items-center justify-center gap-2 bg-paec-violet px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark md:w-28 md:py-0"
            >
              <Search className="size-5" />
              <span className="md:hidden">Search Jobs</span>
            </button>
          </form>

          {/* Filter bar */}
          <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full bg-paec-violet px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-paec-violet/20 sm:text-sm">
              Jobs
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-paec-violet tabular-nums">
                {filteredPositions.length}
              </span>
            </span>

            <span className="hidden h-6 w-px bg-violet-200 sm:block" />

            <FilterSelect
              label="Locations"
              value={locationFilter}
              onChange={setLocationFilter}
              options={[
                { value: '', label: 'All' },
                ...locations.map((loc) => ({ value: loc, label: loc })),
              ]}
            />
            <FilterSelect
              label="Workplace"
              value={workSetupFilter}
              onChange={setWorkSetupFilter}
              options={[
                { value: '', label: 'All' },
                ...Object.entries(WORK_SETUP_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <FilterSelect
              label="Departments"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={[
                { value: '', label: 'All' },
                ...departments.map((dept) => ({ value: dept, label: dept })),
              ]}
            />
            <FilterSelect
              label="Job Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: '', label: 'All' },
                ...Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full border border-paec-orange/40 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-paec-orange transition-colors hover:bg-orange-100 sm:text-sm"
              >
                <X className="size-3.5" />
                Clear filters
              </button>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground sm:text-sm">
                <span className="hidden sm:inline">Relevance</span>
                <ArrowUpDown className="size-3.5 text-paec-violet" />
                <span className="relative inline-flex items-center">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as CareerSort)}
                    aria-label="Sort jobs"
                    className="cursor-pointer appearance-none bg-transparent pr-5 text-xs font-semibold outline-none sm:text-sm"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest first</option>
                    <option value="title">Title A–Z</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 size-4" />
                </span>
              </label>

              <div className="flex overflow-hidden rounded-lg border border-violet-200 bg-white">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  className={cn(
                    'flex size-9 items-center justify-center transition-colors',
                    view === 'list'
                      ? 'bg-paec-violet text-white'
                      : 'text-muted-foreground hover:text-paec-violet',
                  )}
                >
                  <List className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  className={cn(
                    'flex size-9 items-center justify-center transition-colors',
                    view === 'grid'
                      ? 'bg-paec-violet text-white'
                      : 'text-muted-foreground hover:text-paec-violet',
                  )}
                >
                  <LayoutGrid className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="space-y-3 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm"
                  >
                    <div className="h-5 w-1/2 animate-pulse rounded bg-violet-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-violet-100" />
                  </div>
                ))}
              </div>
            ) : positions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <BriefcaseBusiness className="mx-auto size-10 text-paec-violet/50" />
                <p className="mt-4 text-sm font-semibold text-foreground">
                  No open positions yet
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  There are no job openings right now. Check back soon — new
                  positions will be posted here.
                </p>
              </div>
            ) : filteredPositions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <Search className="mx-auto size-10 text-paec-violet/50" />
                <p className="mt-4 text-sm font-semibold text-foreground">
                  No positions match your search
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Try a different keyword or location, or clear your filters to
                  see all open positions.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex h-10 items-center rounded-full bg-paec-violet px-5 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div
                className={cn(
                  view === 'grid'
                    ? 'grid items-start gap-4 sm:grid-cols-2'
                    : 'space-y-4',
                )}
              >
                {filteredPositions.map((position) => (
                  <PositionCard
                    key={position.uuid}
                    position={position}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
