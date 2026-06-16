import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  GripVertical,
  LayoutGrid,
  MapPin,
  Sparkles,
  Star,
  Ticket,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  return items.map((item, index) => ({
    ...item,
    featured_order: index,
  }))
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
              Add published activities to preview the marketplace row.
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

export function FeaturedActivitiesTab() {
  const [items, setItems] = useState<FeaturedActivityItem[]>([])
  const [savedItems, setSavedItems] = useState<FeaturedActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const loadFeatured = useCallback(async () => {
    setLoading(true)
    try {
      const list = await adminEventService.listFeaturedActivities()
      setItems(list)
      setSavedItems(list)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load featured activities.'))
      setItems([])
      setSavedItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFeatured()
  }, [loadFeatured])

  const isDirty = useMemo(() => {
    if (items.length !== savedItems.length) return true
    return items.some((item, index) => item.uuid !== savedItems[index]?.uuid)
  }, [items, savedItems])

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return
    setItems((current) => {
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return withUpdatedOrder(next)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = items.map((item, index) => ({
        uuid: item.uuid,
        featured_order: index,
      }))
      await adminEventService.arrangeFeaturedActivities(payload)
      const next = withUpdatedOrder(items)
      setItems(next)
      setSavedItems(next)
      toast.success('Featured activity order saved to marketplace.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save featured order.'))
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
                Marketplace Featured Order
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
                Reorder the activities shown in the homepage hero and Popular
                Attractions row. Position 1 is the hero spotlight; positions 2–4
                fill the featured cards below.
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

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="flex min-h-0 flex-col rounded-xl border border-violet-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-violet-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Sort activities</p>
              <p className="text-[11px] text-muted-foreground">
                Drag cards or use arrows to change order
              </p>
            </div>
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-paec-violet">
              {items.length} {items.length === 1 ? 'activity' : 'activities'}
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 pb-24">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl border border-violet-100 bg-violet-50/60"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-12 text-center">
                <Star className="mx-auto size-8 text-violet-300" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  No published activities to feature
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Publish activities from the Activities module first, then return
                  here to set their marketplace order.
                </p>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.uuid}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDropIndex(index)
                  }}
                  onDragLeave={() => setDropIndex(null)}
                  onDrop={() => {
                    if (dragIndex !== null) moveItem(dragIndex, index)
                    setDragIndex(null)
                    setDropIndex(null)
                  }}
                  onDragEnd={() => {
                    setDragIndex(null)
                    setDropIndex(null)
                  }}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl border p-3 transition-all',
                    dragIndex === index
                      ? 'scale-[0.99] border-paec-violet bg-violet-50 opacity-70 shadow-md'
                      : dropIndex === index
                        ? 'border-paec-violet bg-violet-50/80 shadow-sm'
                        : 'border-violet-100 bg-white hover:border-violet-200 hover:shadow-sm',
                  )}
                >
                  <button
                    type="button"
                    className="cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:bg-violet-100 hover:text-foreground active:cursor-grabbing"
                    aria-label={`Drag ${item.event_name}`}
                  >
                    <GripVertical className="size-4" />
                  </button>

                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1',
                      getPlacementTone(index),
                    )}
                  >
                    {index + 1}
                  </div>

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
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
                          getPlacementTone(index),
                        )}
                      >
                        {getPlacementLabel(index)}
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0 text-paec-orange" />
                      <span className="truncate">{getActivityLocation(item)}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-bold text-paec-orange">
                        ₱{toPrice(item.price_start).toLocaleString()}
                      </span>
                      <span className="capitalize text-muted-foreground">
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveItem(index, index - 1)}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-violet-200 bg-white text-muted-foreground transition-colors hover:border-paec-violet hover:bg-violet-50 hover:text-paec-violet disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move ${item.event_name} up`}
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(index, index + 1)}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-violet-200 bg-white text-muted-foreground transition-colors hover:border-paec-violet hover:bg-violet-50 hover:text-paec-violet disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move ${item.event_name} down`}
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <MarketplacePreview items={items} />
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Preview updates live as you reorder. Only the first four positions appear
            in the Popular Attractions row on the marketplace homepage.
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-2 border-t border-violet-100 bg-white/95 px-1 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDirty ? 'Unsaved order changes' : 'Order synced with marketplace'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isDirty
                ? 'Save to apply the new featured order on the customer site.'
                : 'The homepage featured section matches this order.'}
            </p>
          </div>
          <button
            type="button"
            disabled={!isDirty || saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center justify-center rounded-lg bg-paec-violet px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-paec-violet/20 transition-colors hover:bg-paec-violet/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Featured Order'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
