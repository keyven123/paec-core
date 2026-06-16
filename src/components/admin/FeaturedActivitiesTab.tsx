import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  GripVertical,
  LayoutGrid,
  MapPin,
  Sparkles,
  Star,
  Ticket,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { getApiErrorMessage } from '@/lib/api'
import { resolveImageUrl } from '@/lib/imageUtils'
import { cn } from '@/lib/utils'
import {
  adminEventService,
  type FeaturedActivityItem,
} from '@/services/adminEventService'

const MARKETPLACE_ROW_LIMIT = 4

function toPrice(value: number | string | null | undefined): number {
  if (value == null) return 0
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function getActivityImage(activity: FeaturedActivityItem): string {
  return (
    resolveImageUrl(activity.featured_image?.url) ||
    resolveImageUrl(activity.portrait_image?.url) ||
    ''
  )
}

function getActivityLocation(activity: FeaturedActivityItem): string {
  return [activity.city, activity.address].filter(Boolean).join(' · ') || 'Philippines'
}

function withUpdatedOrder(items: FeaturedActivityItem[]): FeaturedActivityItem[] {
  const unique = dedupeActivitiesByUuid(items)

  return unique.map((item, index) => ({
    ...item,
    featured_order: index,
    is_featured: true,
  }))
}

function isFeaturedActivity(item: FeaturedActivityItem): boolean {
  return item.is_featured === true
}

function dedupeActivitiesByUuid(
  items: FeaturedActivityItem[],
): FeaturedActivityItem[] {
  const byUuid = new Map<string, FeaturedActivityItem>()

  for (const item of items) {
    const existing = byUuid.get(item.uuid)
    if (!existing) {
      byUuid.set(item.uuid, item)
      continue
    }

    if (isFeaturedActivity(item) && !isFeaturedActivity(existing)) {
      byUuid.set(item.uuid, item)
    }
  }

  return Array.from(byUuid.values())
}

function buildFeaturedList(items: FeaturedActivityItem[]): FeaturedActivityItem[] {
  return dedupeActivitiesByUuid(items)
    .filter((item) => isFeaturedActivity(item))
    .sort((a, b) => (a.featured_order ?? 9999) - (b.featured_order ?? 9999))
}

function buildAvailableList(
  items: FeaturedActivityItem[],
  featured: FeaturedActivityItem[],
): FeaturedActivityItem[] {
  const featuredIds = new Set(featured.map((item) => item.uuid))

  return dedupeActivitiesByUuid(items)
    .filter((item) => !featuredIds.has(item.uuid))
    .sort((a, b) => a.event_name.localeCompare(b.event_name))
}

function getPlacementLabel(index: number): string {
  if (index === 0) return 'Hero spotlight'
  if (index < MARKETPLACE_ROW_LIMIT) return 'Popular row'
  return 'Overflow'
}

function getPlacementTone(index: number): string {
  if (index === 0) return 'bg-amber-100 text-amber-700 ring-amber-200'
  if (index < MARKETPLACE_ROW_LIMIT) return 'bg-paec-violet/10 text-paec-violet ring-violet-200'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

function featuredSignature(items: FeaturedActivityItem[]): string {
  return items.map((item) => item.uuid).join(',')
}

type ActivityCardProps = {
  item: FeaturedActivityItem
  index?: number
  showPlacement?: boolean
  trailing?: ReactNode
}

function ActivityCard({
  item,
  index,
  showPlacement = false,
  trailing,
}: ActivityCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-white p-3 transition-colors hover:border-violet-200 hover:shadow-sm">
      {showPlacement && index !== undefined ? (
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1',
            getPlacementTone(index),
          )}
        >
          {index + 1}
        </div>
      ) : null}

      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-violet-100 bg-violet-50">
        <ImageWithFallback
          src={getActivityImage(item)}
          alt={item.event_name}
          className="size-full object-cover"
          fallbackClassName="size-full"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {item.event_name}
          </p>
          {showPlacement && index !== undefined ? (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
                getPlacementTone(index),
              )}
            >
              {getPlacementLabel(index)}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3 shrink-0 text-paec-orange" />
          <span className="truncate">{getActivityLocation(item)}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-bold text-paec-orange">
            ₱{toPrice(item.price_start).toLocaleString()}
          </span>
          <span className="capitalize text-muted-foreground">{item.status}</span>
        </div>
      </div>

      {trailing}
    </div>
  )
}

type MarketplacePreviewProps = {
  items: FeaturedActivityItem[]
}

function MarketplacePreview({ items }: MarketplacePreviewProps) {
  const rowItems = items.slice(0, MARKETPLACE_ROW_LIMIT)
  const spotlight = rowItems[0]

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-[#0f0a1a] shadow-lg">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-4 text-paec-orange" />
          <div>
            <p className="text-xs font-semibold text-white">Marketplace Preview</p>
            <p className="text-[11px] text-white/50">
              How featured activities appear on the homepage
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {spotlight ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.06]">
            <div className="grid gap-3 p-3 sm:grid-cols-[1fr_140px]">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-paec-orange/20 px-2 py-0.5 text-[10px] font-semibold text-paec-orange">
                  <Sparkles className="size-3" />
                  Hero spotlight
                </span>
                <p className="mt-2 text-sm font-semibold text-white">{spotlight.event_name}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-white/60">
                  <MapPin className="size-3 text-paec-orange" />
                  {getActivityLocation(spotlight)}
                </p>
                <p className="mt-2 text-xs font-bold text-paec-orange">
                  From ₱{toPrice(spotlight.price_start).toLocaleString()}
                </p>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5">
                <ImageWithFallback
                  src={getActivityImage(spotlight)}
                  alt={spotlight.event_name}
                  className="size-full object-cover"
                  fallbackClassName="size-full"
                />
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-paec-orange px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="size-3" />
                  Featured
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">
                Featured
              </span>
              <h3 className="text-sm font-semibold text-white">Popular Attractions</h3>
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-paec-orange">
              View all
              <ArrowRight className="size-3" />
            </span>
          </div>

          {rowItems.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/50">
              Move activities to the featured panel to preview the marketplace row.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rowItems.map((item, index) => (
                <div
                  key={item.uuid}
                  className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 p-2"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-paec-violet/80 text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-md">
                    <ImageWithFallback
                      src={getActivityImage(item)}
                      alt={item.event_name}
                      className="size-full object-cover"
                      fallbackClassName="size-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[11px] leading-snug font-medium text-white">
                      {item.event_name}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-paec-orange">
                      ₱{toPrice(item.price_start).toLocaleString()}
                    </p>
                  </div>
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-paec-violet/80 text-white">
                    <Ticket className="size-2.5" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type DragPayload = {
  source: 'available' | 'featured'
  index: number
}

export function FeaturedActivitiesTab() {
  const [allActivities, setAllActivities] = useState<FeaturedActivityItem[]>([])
  const [featured, setFeatured] = useState<FeaturedActivityItem[]>([])
  const [savedFeatured, setSavedFeatured] = useState<FeaturedActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null)
  const [dropTarget, setDropTarget] = useState<'available' | 'featured' | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const available = useMemo(
    () => buildAvailableList(allActivities, featured),
    [allActivities, featured],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const all = dedupeActivitiesByUuid(
        await adminEventService.listActivitiesForFeaturing(),
      )
      const featuredList = buildFeaturedList(all)
      const orderedFeatured = withUpdatedOrder(featuredList)

      setAllActivities(all)
      setFeatured(orderedFeatured)
      setSavedFeatured(orderedFeatured)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load activities.'))
      setAllActivities([])
      setFeatured([])
      setSavedFeatured([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredAvailable = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return available
    return available.filter((item) =>
      item.event_name.toLowerCase().includes(query),
    )
  }, [available, search])

  const isDirty = useMemo(
    () => featuredSignature(featured) !== featuredSignature(savedFeatured),
    [featured, savedFeatured],
  )

  const addToFeatured = (item: FeaturedActivityItem, atIndex?: number) => {
    setFeatured((current) => {
      if (current.some((row) => row.uuid === item.uuid)) {
        return current
      }

      const next = [...current]
      const insertAt =
        atIndex === undefined
          ? next.length
          : Math.max(0, Math.min(atIndex, next.length))
      next.splice(insertAt, 0, { ...item, is_featured: true })
      return withUpdatedOrder(next)
    })
  }

  const removeFromFeatured = (item: FeaturedActivityItem) => {
    setFeatured((current) =>
      withUpdatedOrder(current.filter((row) => row.uuid !== item.uuid)),
    )
  }

  const moveFeatured = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= featured.length || fromIndex === toIndex) return
    setFeatured((current) => {
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return withUpdatedOrder(next)
    })
  }

  const clearDragState = () => {
    setDragPayload(null)
    setDropTarget(null)
    setDropIndex(null)
  }

  const handleDropOnFeatured = (targetIndex: number | null) => {
    if (!dragPayload) return

    if (dragPayload.source === 'available') {
      const item = available[dragPayload.index]
      if (!item) return
      addToFeatured(item, targetIndex ?? featured.length)
    } else {
      const insertAt = targetIndex ?? featured.length - 1
      moveFeatured(dragPayload.index, insertAt)
    }

    clearDragState()
  }

  const handleDropOnAvailable = () => {
    if (!dragPayload || dragPayload.source !== 'featured') return
    const item = featured[dragPayload.index]
    if (!item) return
    removeFromFeatured(item)
    clearDragState()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = featured.map((item, index) => ({
        uuid: item.uuid,
        featured_order: index,
      }))
      await adminEventService.arrangeFeaturedActivities(payload)
      const next = withUpdatedOrder(featured)
      setFeatured(next)
      setSavedFeatured(next)
      toast.success('Featured activities saved to marketplace.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save featured activities.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-amber-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm">
              <Star className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                Marketplace Featured Activities
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
                Drag activities to the featured panel, or use the arrow button
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium">
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
              #1 Hero spotlight
            </span>
            <span className="rounded-full bg-paec-violet/10 px-2.5 py-1 text-paec-violet">
              #2–4 Popular row
            </span>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,0.85fr)]">
        <div className="flex min-h-0 flex-col rounded-xl border border-violet-100 bg-white shadow-sm">
          <div className="border-b border-violet-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">All activities</p>
                <p className="text-[11px] text-muted-foreground">
                  Drag to featured panel or drop back here to remove
                </p>
              </div>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-paec-violet">
                {available.length}
              </span>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities..."
              className="mt-3 h-9 w-full rounded-lg border border-violet-100 bg-violet-50/40 px-3 text-sm outline-none focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20"
            />
          </div>

          <div
            className={cn(
              'min-h-0 flex-1 space-y-2 overflow-y-auto p-4 transition-colors',
              dropTarget === 'available' &&
                dragPayload?.source === 'featured' &&
                'bg-violet-50/80 ring-2 ring-inset ring-paec-violet/30',
            )}
            onDragOver={(e) => {
              if (dragPayload?.source === 'featured') {
                e.preventDefault()
                setDropTarget('available')
              }
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault()
              handleDropOnAvailable()
            }}
          >
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl border border-violet-100 bg-violet-50/60"
                  />
                ))}
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div
                className={cn(
                  'rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-10 text-center',
                  dropTarget === 'available' &&
                    dragPayload?.source === 'featured' &&
                    'border-paec-violet bg-violet-100/50',
                )}
              >
                <p className="text-sm font-medium text-foreground">
                  {available.length === 0
                    ? 'All activities are featured'
                    : 'No activities match your search'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {available.length === 0
                    ? 'Drag from the featured panel to move activities back here.'
                    : 'Try a different search term.'}
                </p>
              </div>
            ) : (
              filteredAvailable.map((item) => {
                const sourceIndex = available.findIndex(
                  (row) => row.uuid === item.uuid,
                )
                const isDragging =
                  dragPayload?.source === 'available' &&
                  dragPayload.index === sourceIndex

                return (
                  <div
                    key={item.uuid}
                    draggable
                    onDragStart={() =>
                      setDragPayload({ source: 'available', index: sourceIndex })
                    }
                    onDragEnd={clearDragState}
                    className={cn(
                      'cursor-grab rounded-xl active:cursor-grabbing',
                      isDragging && 'opacity-50',
                    )}
                  >
                    <ActivityCard
                      item={item}
                      trailing={
                        <div className="flex shrink-0 flex-col items-center gap-1">
                          <GripVertical className="size-4 text-muted-foreground" />
                          <button
                            type="button"
                            onClick={() => addToFeatured(item)}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-paec-violet transition-colors hover:border-paec-violet hover:bg-violet-100"
                            aria-label={`Feature ${item.event_name}`}
                            title="Add to featured"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      }
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-violet-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-violet-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Featured on marketplace</p>
              <p className="text-[11px] text-muted-foreground">
                Drop activities here · drag to reorder
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              {featured.length}
            </span>
          </div>

          <div
            className={cn(
              'min-h-0 flex-1 space-y-2 overflow-y-auto p-4 transition-colors',
              dropTarget === 'featured' &&
                dragPayload?.source === 'available' &&
                'bg-amber-50/60 ring-2 ring-inset ring-amber-300/50',
            )}
            onDragOver={(e) => {
              if (dragPayload?.source === 'available') {
                e.preventDefault()
                setDropTarget('featured')
              } else if (dragPayload?.source === 'featured') {
                e.preventDefault()
              }
            }}
            onDragLeave={() => {
              setDropTarget(null)
              setDropIndex(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              handleDropOnFeatured(dropIndex)
            }}
          >
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl border border-violet-100 bg-violet-50/60"
                  />
                ))}
              </div>
            ) : featured.length === 0 ? (
              <div
                className={cn(
                  'rounded-xl border border-dashed border-amber-200 bg-amber-50/40 px-4 py-10 text-center transition-colors',
                  dropTarget === 'featured' &&
                    dragPayload?.source === 'available' &&
                    'border-amber-400 bg-amber-100/60',
                )}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDropTarget('featured')
                  setDropIndex(0)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDropOnFeatured(0)
                }}
              >
                <Star className="mx-auto size-8 text-amber-300" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  Drop activities here to feature
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Drag from the left panel or click the arrow button.
                </p>
              </div>
            ) : (
              featured.map((item, index) => {
                const isDragging =
                  dragPayload?.source === 'featured' &&
                  dragPayload.index === index

                return (
                  <div
                    key={item.uuid}
                    draggable
                    onDragStart={() =>
                      setDragPayload({ source: 'featured', index })
                    }
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDropIndex(index)
                      if (dragPayload?.source === 'available') {
                        setDropTarget('featured')
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDropOnFeatured(index)
                    }}
                    onDragEnd={clearDragState}
                    className={cn(
                      'cursor-grab rounded-xl transition-all active:cursor-grabbing',
                      isDragging && 'scale-[0.99] opacity-50',
                      dropIndex === index &&
                        dragPayload !== null &&
                        'ring-2 ring-paec-violet ring-offset-2',
                    )}
                  >
                  <ActivityCard
                    item={item}
                    index={index}
                    showPlacement
                    trailing={
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          className="cursor-grab rounded-md p-1 text-muted-foreground hover:bg-violet-100 active:cursor-grabbing"
                          aria-label={`Drag ${item.event_name}`}
                        >
                          <GripVertical className="size-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveFeatured(index, index - 1)}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-violet-200 bg-white text-muted-foreground hover:border-paec-violet hover:text-paec-violet disabled:opacity-40"
                          aria-label={`Move ${item.event_name} up`}
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === featured.length - 1}
                          onClick={() => moveFeatured(index, index + 1)}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-violet-200 bg-white text-muted-foreground hover:border-paec-violet hover:text-paec-violet disabled:opacity-40"
                          aria-label={`Move ${item.event_name} down`}
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromFeatured(item)}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          aria-label={`Remove ${item.event_name} from featured`}
                          title="Remove from featured"
                        >
                          <ArrowLeft className="size-3.5" />
                        </button>
                      </div>
                    }
                  />
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <MarketplacePreview items={featured} />
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Position 1 drives the hero banner and spotlight card. The first four
            featured activities appear in the Popular Attractions row.
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-2 border-t border-violet-100 bg-white/95 px-1 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDirty ? 'Unsaved featured changes' : 'Featured list synced with marketplace'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isDirty
              ? 'Save to update the homepage hero and featured attractions row.'
              : 'The marketplace homepage matches this featured list.'}
          </p>
        </div>
        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={() => void handleSave()}
          className="inline-flex items-center justify-center rounded-lg bg-paec-violet px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-paec-violet/20 transition-colors hover:bg-paec-violet/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Featured Activities'}
        </button>
      </div>
    </div>
  )
}
