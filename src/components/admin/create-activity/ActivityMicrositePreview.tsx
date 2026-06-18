import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  ImageIcon,
  MapPin,
  Share2,
  Star,
  Tag,
  Ticket,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { ActivityShowcaseGallery } from '@/components/attraction/ActivityShowcaseGallery'
import type { CreateActivityForm, CreateActivityTicket } from '@/types/createActivity'
import type { EditActivityForm } from '@/types/editActivity'
import { cn } from '@/lib/utils'
import { resolveImageUrl } from '@/lib/imageUtils'

type ActivityMicrositePreviewProps = {
  form: CreateActivityForm | EditActivityForm
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )

  return url
}

function formatPrice(value: number) {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function ticketLabel(ticket: CreateActivityTicket) {
  const name = ticket.name.trim() || 'Untitled ticket'
  const price = Number.parseFloat(ticket.price)
  if (Number.isNaN(price) || ticket.price === '') {
    return `${name} — TBA`
  }
  return `${name} — ${formatPrice(price)}`
}

export function ActivityMicrositePreview({ form }: ActivityMicrositePreviewProps) {
  const editForm = form as EditActivityForm
  const name = form.name.trim() || 'Activity name'
  const location =
    [form.city.trim(), form.address.trim()].filter(Boolean).join(', ') ||
    'Activity location'
  const description =
    form.description.trim() ||
    'Your activity description will appear here for visitors browsing the microsite.'
  const categoryLabel = (form.category || 'Attractions').toUpperCase()

  const featuredUrl = useObjectUrl(form.featuredImage)
  const portraitUrl = useObjectUrl(form.portraitImage)
  const showcaseObjectUrls = useMemo(
    () => form.showcaseImages.map((file) => URL.createObjectURL(file)),
    [form.showcaseImages],
  )

  useEffect(
    () => () => {
      showcaseObjectUrls.forEach((url) => URL.revokeObjectURL(url))
    },
    [showcaseObjectUrls],
  )

  const heroSrc =
    featuredUrl ??
    portraitUrl ??
    showcaseObjectUrls[0] ??
    editForm.existingFeaturedImage?.url ??
    editForm.existingPortraitImage?.url ??
    editForm.existingShowcaseImages?.[0]?.url ??
    null

  const showcasePreviewImages = useMemo(() => {
    const fromFiles = showcaseObjectUrls
      .map((url) => resolveImageUrl(url))
      .filter(Boolean)
    const fromExisting = (editForm.existingShowcaseImages ?? [])
      .map((image) => resolveImageUrl(image.url))
      .filter(Boolean)

    const combined =
      fromFiles.length > 0 ? fromFiles : fromExisting

    if (!heroSrc) return combined

    const resolvedHero = resolveImageUrl(heroSrc)
    return combined.filter((url) => url !== resolvedHero)
  }, [
    showcaseObjectUrls,
    editForm.existingShowcaseImages,
    heroSrc,
  ])

  const previewTickets = useMemo(
    () =>
      form.tickets.length > 0
        ? form.tickets
        : [
            {
              id: 'preview-default',
              name: 'General Admission',
              description: '',
              price: '',
              maxTicket: '500',
              isUnlimited: false,
              visitPolicy: 'priority' as const,
              validityDays: 7,
            },
          ],
    [form.tickets],
  )

  const [selectedTicketId, setSelectedTicketId] = useState(
    previewTickets[0]?.id ?? '',
  )

  useEffect(() => {
    setSelectedTicketId((current) => {
      if (previewTickets.some((ticket) => ticket.id === current)) {
        return current
      }
      return previewTickets[0]?.id ?? ''
    })
  }, [previewTickets])

  const selectedTicket =
    previewTickets.find((ticket) => ticket.id === selectedTicketId) ??
    previewTickets[0]

  const ticketPrices = previewTickets
    .map((ticket) => Number.parseFloat(ticket.price))
    .filter((price) => !Number.isNaN(price) && price >= 0)

  const lowestPrice =
    ticketPrices.length > 0 ? Math.min(...ticketPrices) : null

  const unitPrice = selectedTicket
    ? Number.parseFloat(selectedTicket.price) || 0
    : 0
  const hasSelectedPrice =
    selectedTicket?.price !== '' &&
    !Number.isNaN(unitPrice) &&
    unitPrice >= 0

  return (
    <div className="overflow-hidden rounded-xl border border-violet-100 bg-white">
      <div className="border-b border-violet-50 bg-violet-50/40 px-4 py-2">
        <p className="text-[10px] font-medium text-muted-foreground">
          Customer microsite preview
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-paec-violet">Home</span>
          <ChevronRight className="size-3" />
          <span className="truncate font-medium text-foreground">{name}</span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[1fr_240px] xl:grid-cols-[1fr_280px]">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-paec-violet px-2.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                {categoryLabel}
              </span>
              <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[9px] font-bold tracking-wide text-paec-orange uppercase">
                {lowestPrice !== null
                  ? `From ${formatPrice(lowestPrice)}`
                  : 'From TBA'}
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0 text-paec-violet" />
                <span className="line-clamp-1">{location}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5 shrink-0 text-paec-violet" />
                Open Daily
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <Zap className="size-2.5" />
                Moderate
              </span>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-xl">
              {heroSrc ? (
                <ImageWithFallback
                  src={heroSrc}
                  alt={name}
                  className="aspect-[16/9] w-full object-cover"
                  fallbackClassName="aspect-[16/9] w-full"
                />
              ) : (
                <div className="flex aspect-[16/9] w-full flex-col items-center justify-center bg-gradient-to-br from-paec-violet/30 to-paec-orange/20">
                  <ImageIcon className="size-12 text-white/50" />
                  <p className="mt-2 text-xs font-medium text-white/70">
                    No image uploaded
                  </p>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-1.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm">
                  <Heart className="size-3.5" />
                </span>
                <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm">
                  <Share2 className="size-3.5" />
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'size-3.5',
                      i < 4
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-violet-100',
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-foreground">4.8</span>
              <span className="text-xs text-muted-foreground">(Preview)</span>
            </div>

            <ActivityShowcaseGallery
              images={showcasePreviewImages}
              activityName={name}
              className="mt-4"
            />

            <section className="mt-5">
              <h2 className="text-base font-bold text-foreground">
                About this event
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {description}
              </p>
              {form.category && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-0.5 text-[10px] font-medium text-paec-violet">
                    #{form.category.toLowerCase().replace(/\s+/g, '')}
                  </span>
                  <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-0.5 text-[10px] font-medium text-paec-violet">
                    #preview
                  </span>
                </div>
              )}
            </section>
          </div>

          <PreviewBookingSidebar
            name={name}
            locationLabel={location}
            tickets={previewTickets}
            selectedTicketId={selectedTicketId}
            onSelectTicket={setSelectedTicketId}
            unitPrice={hasSelectedPrice ? unitPrice : null}
          />
        </div>
      </div>
    </div>
  )
}

type PreviewBookingSidebarProps = {
  name: string
  locationLabel: string
  tickets: CreateActivityTicket[]
  selectedTicketId: string
  onSelectTicket: (ticketId: string) => void
  unitPrice: number | null
}

function PreviewBookingSidebar({
  name,
  locationLabel,
  tickets,
  selectedTicketId,
  onSelectTicket,
  unitPrice,
}: PreviewBookingSidebarProps) {
  const quantity = 1
  const subtotal = unitPrice !== null ? unitPrice * quantity : null

  return (
    <aside className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-lg">
      <div className="bg-paec-violet px-4 py-3 text-white">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
          <Ticket className="size-3" />
          Get Tickets
        </div>
        <p className="mt-1 text-sm font-semibold leading-snug">{name}</p>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="mb-1 text-[10px] font-medium text-muted-foreground">
            Location
          </p>
          <div className="flex h-9 items-center rounded-lg border border-violet-100 bg-violet-50/30 px-3 text-xs text-foreground">
            {locationLabel}
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-medium text-muted-foreground">
            Ticket Type
          </p>
          {tickets.length > 1 ? (
            <select
              value={selectedTicketId}
              onChange={(event) => onSelectTicket(event.target.value)}
              className="flex h-9 w-full rounded-lg border border-violet-100 bg-violet-50/30 px-3 text-xs text-foreground"
            >
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticketLabel(ticket)}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex h-9 items-center rounded-lg border border-violet-100 bg-violet-50/30 px-3 text-xs text-foreground">
              {tickets[0] ? ticketLabel(tickets[0]) : 'No tickets configured'}
            </div>
          )}
        </div>

        <div>
          <p className="mb-1 text-[10px] font-medium text-muted-foreground">
            Visit Date
          </p>
          <div className="flex h-9 items-center rounded-lg border border-violet-100 bg-violet-50/30 px-3 text-xs text-muted-foreground">
            Select date
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-medium text-muted-foreground">
            Quantity
          </p>
          <div className="flex h-9 items-center justify-between rounded-lg border border-violet-100 px-3 text-xs font-semibold">
            <span className="text-muted-foreground">−</span>
            <span>{quantity}</span>
            <span className="text-muted-foreground">+</span>
          </div>
        </div>

        <p className="inline-flex items-center gap-1 text-[11px] font-medium text-paec-violet">
          <Tag className="size-3" />
          Add promo code
        </p>

        <div className="space-y-1.5 border-t border-violet-100 pt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Subtotal</span>
            <span>{subtotal !== null ? formatPrice(subtotal) : 'TBA'}</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Total
            </p>
            <p className="text-xl font-bold text-foreground">
              {subtotal !== null ? formatPrice(subtotal) : 'TBA'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {quantity} ticket{quantity === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-paec-orange text-xs font-semibold text-white">
          <Ticket className="size-3.5" />
          Get Tickets
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-emerald-600">
          <span className="inline-flex items-center gap-0.5">
            <CheckCircle2 className="size-3" />
            Instant confirmation
          </span>
          <span className="inline-flex items-center gap-0.5">
            <CheckCircle2 className="size-3" />
            Secure checkout
          </span>
        </div>
      </div>
    </aside>
  )
}
