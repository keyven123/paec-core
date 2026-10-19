import {
  Banknote,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Handshake,
  Headphones,
  Link2,
  LineChart,
  Loader2,
  Percent,
  Search,
  Share2,
  Sparkles,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { Button } from '@/components/ui/button'
import {
  AFFILIATE_MIN_PAYOUT_PHP,
  affiliateGrossIntNet,
  buildActivityReferralLink,
  formatAffiliateCalendarDay,
  formatAffiliateDateTime,
  formatPeso,
} from '@/lib/affiliateFormat'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  affiliatePartnerService,
  type AffiliateCatalogEvent,
  type AffiliateConversion,
  type AffiliateModule,
  type AffiliatePartnerPayload,
  type AffiliatePayoutRequest,
} from '@/services/affiliatePartnerService'

type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Array<Feature> = [
  {
    icon: Percent,
    title: 'Earn commission',
    description:
      'Earn a percentage of the ticket price on every activity booking made through your link.',
  },
  {
    icon: Link2,
    title: 'Your own link',
    description:
      'Share a unique code or a link to any participating activity.',
  },
  {
    icon: LineChart,
    title: 'Track performance',
    description: 'See link clicks, conversions and your earnings in one place.',
  },
  {
    icon: Wallet,
    title: 'Simple payouts',
    description:
      'Add your bank details and request a payout once you reach the minimum.',
  },
  {
    icon: Share2,
    title: 'Made for creators',
    description:
      'Perfect for bloggers, travel creators and community pages.',
  },
  {
    icon: Headphones,
    title: 'We are here to help',
    description: 'Questions about the program? Our team is happy to assist.',
  },
]

const MODULES: Array<{ id: AffiliateModule; label: string }> = [
  { id: 'activities', label: 'Activities' },
  { id: 'commission', label: 'Commission & Payouts' },
  { id: 'bank', label: 'Bank Details' },
]

const CATALOG_PER_PAGE = 12

const inputClassName = cn(
  'h-10 w-full rounded-xl border border-violet-100 bg-violet-50/30 px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

const cardClassName = 'rounded-xl border border-violet-100 bg-white'

function formatCommissionLabel(event: AffiliateCatalogEvent): string {
  const pct = event.affiliate_commission_percent
  if (pct != null && Number(pct) > 0) {
    const n = Number(pct)
    return `${n % 1 === 0 ? n : n.toFixed(2)}% commission on ticket price`
  }
  return 'Commission rate not set'
}

function payoutStatusClass(status: AffiliatePayoutRequest['status']): string {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700'
  if (status === 'declined') return 'bg-red-100 text-red-600'
  return 'bg-amber-100 text-amber-700'
}

function PaginationControls({
  page,
  totalPages,
  disabled,
  onChange,
}: {
  page: number
  totalPages: number
  disabled?: boolean
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-violet-100 px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
          Prev
        </button>
        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          className="inline-flex items-center gap-1 rounded-lg border border-violet-100 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          Next
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export function AffiliatePartnerSection() {
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [applying, setApplying] = useState(false)
  const [data, setData] = useState<AffiliatePartnerPayload | null>(null)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const [activeModule, setActiveModule] =
    useState<AffiliateModule>('activities')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [catalog, setCatalog] = useState<Array<AffiliateCatalogEvent>>([])
  const [catalogPage, setCatalogPage] = useState(1)
  const [catalogTotalPages, setCatalogTotalPages] = useState(1)
  const [catalogLoading, setCatalogLoading] = useState(false)

  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const [payoutRows, setPayoutRows] = useState<Array<AffiliatePayoutRequest>>(
    [],
  )
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutSubmitting, setPayoutSubmitting] = useState(false)

  const [conversionRows, setConversionRows] = useState<
    Array<AffiliateConversion>
  >([])
  const [conversionLoading, setConversionLoading] = useState(false)
  const [conversionPage, setConversionPage] = useState(1)
  const [conversionTotalPages, setConversionTotalPages] = useState(1)

  const [bankForm, setBankForm] = useState({
    bank: '',
    branch: '',
    account_name: '',
    account_number: '',
    tin: '',
  })
  const [bankSaving, setBankSaving] = useState(false)

  const isActivePartner = data?.status === 'approved'
  const isSuspendedPartner = data?.status === 'suspended'
  const isEnrolledPartner = isActivePartner || isSuspendedPartner

  const hasPendingPayout = useMemo(
    () => payoutRows.some((row) => row.status === 'pending'),
    [payoutRows],
  )

  const availableForPayout = data?.stats.available_earnings ?? 0
  const meetsMinPayout =
    availableForPayout + 1e-9 >= AFFILIATE_MIN_PAYOUT_PHP
  const canRequestPayout =
    isActivePartner && meetsMinPayout && !hasPendingPayout && !payoutLoading

  const referralLink = useMemo(() => {
    if (!data?.code) return ''
    return (
      data.referral_link ||
      `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${encodeURIComponent(data.code)}`
    )
  }, [data?.code, data?.referral_link])

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        setLoading(true)
        setLoadFailed(false)
        const result = await affiliatePartnerService.get()
        if (active) setData(result)
      } catch (error) {
        if (active) {
          setLoadFailed(true)
          toast.error(
            getApiErrorMessage(error, 'Could not load your affiliate details.'),
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const bank = data?.bank_details
    if (!bank) return
    setBankForm({
      bank: bank.bank ?? '',
      branch: bank.branch ?? '',
      account_name: bank.account_name ?? '',
      account_number: bank.account_number ?? '',
      tin: bank.tin ?? '',
    })
  }, [data?.bank_details])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (isSuspendedPartner && activeModule === 'activities') {
      setActiveModule('commission')
    }
  }, [isSuspendedPartner, activeModule])

  useEffect(() => {
    setCatalogPage(1)
  }, [debouncedSearch, activeModule])

  // Activities: combine ticket events and Explore/fun listings into one catalog.
  useEffect(() => {
    if (!isActivePartner || activeModule !== 'activities') return
    let cancelled = false

    void (async () => {
      try {
        setCatalogLoading(true)
        const params = {
          q: debouncedSearch.trim() || undefined,
          page: catalogPage,
          per_page: CATALOG_PER_PAGE,
        }
        const [events, fun] = await Promise.all([
          affiliatePartnerService.getAvailableEvents(params),
          affiliatePartnerService.getAvailableFun(params).catch(() => null),
        ])
        if (cancelled) return

        const seen = new Set<string>()
        const merged = [...events.data, ...(fun?.data ?? [])].filter((item) => {
          if (seen.has(item.uuid)) return false
          seen.add(item.uuid)
          return true
        })
        setCatalog(merged)
        setCatalogTotalPages(
          Math.max(1, events.meta.last_page, fun?.meta.last_page ?? 1),
        )
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, 'Could not load activities.'))
          setCatalog([])
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isActivePartner, activeModule, catalogPage, debouncedSearch])

  const loadPayouts = useCallback(async () => {
    try {
      setPayoutLoading(true)
      const result = await affiliatePartnerService.getPayoutHistory({
        per_page: 50,
      })
      setPayoutRows(result.data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load payout history.'))
    } finally {
      setPayoutLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isEnrolledPartner || activeModule !== 'commission') return
    void loadPayouts()
  }, [isEnrolledPartner, activeModule, loadPayouts])

  useEffect(() => {
    if (!isEnrolledPartner || activeModule !== 'commission') return
    let cancelled = false

    void (async () => {
      try {
        setConversionLoading(true)
        const result = await affiliatePartnerService.getConversionHistory({
          page: conversionPage,
          per_page: 10,
        })
        if (cancelled) return
        setConversionRows(result.data)
        setConversionTotalPages(Math.max(1, result.meta.last_page))
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, 'Could not load commission history.'),
          )
        }
      } finally {
        if (!cancelled) setConversionLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEnrolledPartner, activeModule, conversionPage])

  const copyToClipboard = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast.success('Link copied to clipboard.')
      window.setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      toast.error('Could not copy the link.')
    }
  }

  const handleApply = async () => {
    try {
      setApplying(true)
      const next = await affiliatePartnerService.apply()
      setData(next)
      toast.success('Welcome to the affiliate partner program!')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not join the program.'))
    } finally {
      setApplying(false)
    }
  }

  const handleSaveBankDetails = async () => {
    if (isSuspendedPartner) {
      toast.error('Your affiliate account is suspended.')
      return
    }
    const { bank, branch, account_name, account_number, tin } = bankForm
    if (
      !bank.trim() ||
      !branch.trim() ||
      !account_name.trim() ||
      !account_number.trim() ||
      !tin.trim()
    ) {
      toast.error('Please complete all bank details.')
      return
    }

    try {
      setBankSaving(true)
      const next = await affiliatePartnerService.updateBankDetails({
        bank: bank.trim(),
        branch: branch.trim(),
        account_name: account_name.trim(),
        account_number: account_number.trim(),
        tin: tin.trim(),
      })
      setData(next)
      toast.success('Bank details saved.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save bank details.'))
    } finally {
      setBankSaving(false)
    }
  }

  const handleSubmitPayoutRequest = async () => {
    const amount = Number.parseFloat(payoutAmount.trim())
    if (!Number.isFinite(amount) || amount < AFFILIATE_MIN_PAYOUT_PHP) {
      toast.error(
        `Minimum payout is ${formatPeso(AFFILIATE_MIN_PAYOUT_PHP)}.`,
      )
      return
    }

    try {
      setPayoutSubmitting(true)
      const created = await affiliatePartnerService.createPayoutRequest(amount)
      setPayoutRows((rows) => [created, ...rows])
      setPayoutModalOpen(false)
      setPayoutAmount('')
      try {
        setData(await affiliatePartnerService.get())
      } catch {
        // Stats refresh is optional.
      }
      toast.success('Payout request submitted.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Could not submit your payout request.'),
      )
    } finally {
      setPayoutSubmitting(false)
    }
  }

  const statItems = data
    ? [
        { label: 'Link clicks', value: String(data.stats.total_clicks) },
        {
          label: 'Net commission',
          value: formatPeso(data.stats.total_conversions),
        },
        {
          label: 'Available commission',
          value: formatPeso(data.stats.available_earnings),
          highlight: true,
        },
        {
          label: 'Requested cash out',
          value: formatPeso(data.stats.pending_earnings),
        },
        { label: 'Cashed out', value: formatPeso(data.stats.paid_earnings) },
      ]
    : []

  const visibleModules = isSuspendedPartner
    ? MODULES.filter((module) => module.id !== 'activities')
    : MODULES

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Affiliate <span className="text-paec-violet">partner</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isEnrolledPartner
          ? isSuspendedPartner
            ? 'Your partner access is currently suspended.'
            : 'Share activities, track commissions and request payouts.'
          : 'Earn commission by sharing PAEC activities with your audience.'}
      </p>

      {loading ? (
        <div className="mt-8 flex min-h-[240px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-paec-violet" />
        </div>
      ) : loadFailed && !data ? (
        <div className={cn(cardClassName, 'mt-8 p-6 text-center sm:p-10')}>
          <p className="text-sm text-muted-foreground">
            Please sign in again to join or manage your affiliate partnership.
          </p>
          <Button
            type="button"
            onClick={() => {
              window.location.href = '/'
            }}
            className="mt-6 h-11 rounded-xl bg-paec-violet px-8 font-semibold hover:bg-paec-violet-dark"
          >
            Back to home
          </Button>
        </div>
      ) : !isEnrolledPartner ? (
        <div className={cn(cardClassName, 'mt-8 p-6 text-center sm:p-10')}>
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-violet-100 text-paec-violet">
            <Handshake className="size-8" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-foreground">
            Become an affiliate partner
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Join the program to get your unique referral code and start earning
            commission on every booking you refer.
          </p>

          <ul className="mx-auto mt-8 max-w-lg space-y-5 text-left">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-paec-violet">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <label
            htmlFor="affiliate-partner-terms"
            className="mx-auto mt-8 flex max-w-lg cursor-pointer items-start gap-3 text-left text-sm leading-relaxed text-foreground"
          >
            <input
              id="affiliate-partner-terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(event) => setAgreeTerms(event.target.checked)}
              className="mt-1 size-4 shrink-0 rounded border-violet-300 accent-paec-violet"
            />
            <span>
              I agree to the{' '}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  toast.info('Terms and conditions page coming soon.')
                }}
                className="font-medium text-paec-violet underline hover:text-paec-violet-dark"
              >
                affiliate partner terms and conditions
              </button>
              .
            </span>
          </label>

          <Button
            type="button"
            onClick={() => void handleApply()}
            disabled={applying || !agreeTerms}
            className="mt-6 h-11 rounded-xl bg-paec-violet px-8 font-semibold hover:bg-paec-violet-dark"
          >
            {applying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Joining…
              </>
            ) : (
              'Become a partner'
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {isSuspendedPartner ? (
            <div className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-sm">
              <p className="font-semibold text-red-700">
                Affiliate account suspended
              </p>
              <p className="mt-1 leading-relaxed text-red-700/90">
                {data?.affiliate_suspend_reason?.trim() ||
                  'Your partner access has been suspended. Contact support if you have questions.'}
              </p>
              {data?.affiliate_suspended_at ? (
                <p className="mt-2 text-xs text-red-700/70">
                  Effective {formatAffiliateDateTime(data.affiliate_suspended_at)}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                You can still view your commission and payout history. New
                links and payout requests are disabled.
              </p>
            </div>
          ) : null}

          {data?.code ? (
            <div className={cn(cardClassName, 'p-5')}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Your unique code
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-paec-violet">
                    {data.code}
                  </p>
                  {!isSuspendedPartner && referralLink ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {referralLink}
                    </p>
                  ) : null}
                </div>
                {!isSuspendedPartner && referralLink ? (
                  <Button
                    type="button"
                    onClick={() => void copyToClipboard('referral', referralLink)}
                    className="rounded-xl bg-paec-violet hover:bg-paec-violet-dark"
                  >
                    {copiedKey === 'referral' ? (
                      <>
                        <Check className="size-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Copy referral link
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-b border-violet-100 pb-3">
            {visibleModules.map((module) => {
              const active = activeModule === module.id
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => {
                    setActiveModule(module.id)
                    setSearch('')
                    setDebouncedSearch('')
                  }}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-paec-violet text-white shadow-sm shadow-paec-violet/20'
                      : 'border border-violet-100 bg-white text-muted-foreground hover:bg-violet-50 hover:text-foreground',
                  )}
                >
                  {module.label}
                </button>
              )
            })}
          </div>

          {activeModule === 'activities' && isActivePartner ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4 shrink-0 text-paec-violet" />
                  <span>
                    Copy a share link for any activity below. Bookings made
                    through your link earn you commission.
                  </span>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search activities..."
                    className={cn(inputClassName, 'h-9 pl-9')}
                  />
                </div>
              </div>

              {catalogLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="size-6 animate-spin text-paec-violet" />
                </div>
              ) : catalog.length === 0 ? (
                <div
                  className={cn(
                    cardClassName,
                    'py-16 text-center text-sm text-muted-foreground',
                  )}
                >
                  No activities are open to affiliates right now.
                </div>
              ) : (
                <div className={cn(cardClassName, 'overflow-hidden')}>
                  <ul className="divide-y divide-violet-50">
                    {catalog.map((event) => {
                      const endsAt = formatAffiliateCalendarDay(
                        event.affiliate_ends_at,
                      )
                      const image =
                        event.portrait_image?.url ?? event.featured_image?.url
                      return (
                        <li
                          key={event.uuid}
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <ImageWithFallback
                              src={image ?? ''}
                              alt=""
                              className="size-14 shrink-0 rounded-lg bg-violet-50 object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">
                                {event.event_name}
                              </p>
                              {event.category_name || event.city ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {[event.category_name, event.city]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs font-medium text-paec-violet">
                                {formatCommissionLabel(event)}
                              </p>
                              {endsAt ? (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  Program ends {endsAt}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              void copyToClipboard(
                                event.uuid,
                                buildActivityReferralLink(
                                  event.slug,
                                  event.uuid,
                                  data?.code ?? '',
                                ),
                              )
                            }
                            disabled={!data?.code}
                            className="w-full shrink-0 rounded-lg border-violet-200 font-semibold text-paec-violet hover:bg-violet-50 hover:text-paec-violet sm:w-auto"
                          >
                            {copiedKey === event.uuid ? (
                              <>
                                <Check className="size-4" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Link2 className="size-4" />
                                Copy link
                              </>
                            )}
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                  <PaginationControls
                    page={catalogPage}
                    totalPages={catalogTotalPages}
                    disabled={catalogLoading}
                    onChange={setCatalogPage}
                  />
                </div>
              )}
            </div>
          ) : null}

          {activeModule === 'commission' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {statItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      cardClassName,
                      'p-4',
                      item.highlight && 'ring-1 ring-paec-violet/20',
                    )}
                  >
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p
                      className={cn(
                        'mt-1 text-2xl font-semibold tabular-nums',
                        item.highlight ? 'text-paec-violet' : 'text-foreground',
                      )}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className={cn(
                  cardClassName,
                  'flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between',
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Request a payout
                  </p>
                  {isSuspendedPartner ? (
                    <p className="mt-1 text-xs text-red-600">
                      Payout requests are disabled while your account is
                      suspended.
                    </p>
                  ) : hasPendingPayout ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      You have a pending payout request.
                    </p>
                  ) : !meetsMinPayout ? (
                    <p className="mt-1 max-w-xl text-xs text-amber-700">
                      You have {formatPeso(availableForPayout)} available. The
                      minimum payout is {formatPeso(AFFILIATE_MIN_PAYOUT_PHP)}.
                    </p>
                  ) : null}
                </div>
                {!isSuspendedPartner ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setPayoutAmount('')
                      setPayoutModalOpen(true)
                    }}
                    disabled={!canRequestPayout}
                    className="shrink-0 rounded-xl bg-paec-violet hover:bg-paec-violet-dark"
                  >
                    <Banknote className="size-4" />
                    Request payout
                  </Button>
                ) : null}
              </div>

              <div className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex items-center justify-between border-b border-violet-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-foreground">
                    Payout history
                  </h2>
                  {payoutLoading ? (
                    <Loader2 className="size-4 animate-spin text-paec-violet" />
                  ) : null}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-violet-50/60">
                      <tr className="border-b border-violet-100">
                        {['Requested', 'Amount', 'Status', 'Processed', 'Note'].map(
                          (col) => (
                            <th
                              key={col}
                              className="px-4 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                            >
                              {col}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {!payoutLoading && payoutRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-10 text-center text-muted-foreground"
                          >
                            No payout requests yet.
                          </td>
                        </tr>
                      ) : (
                        payoutRows.map((row) => (
                          <tr
                            key={row.uuid}
                            className="border-b border-violet-50 last:border-0"
                          >
                            <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                              {formatAffiliateDateTime(row.created_at)}
                            </td>
                            <td className="px-4 py-3 font-medium tabular-nums">
                              {formatPeso(row.amount_requested)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize',
                                  payoutStatusClass(row.status),
                                )}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                              {formatAffiliateDateTime(row.processed_at)}
                            </td>
                            <td
                              className="max-w-[220px] truncate px-4 py-3 text-xs text-muted-foreground"
                              title={row.admin_notes ?? undefined}
                            >
                              {row.admin_notes ?? '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex items-center justify-between border-b border-violet-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-foreground">
                    Commission history
                  </h2>
                  {conversionLoading ? (
                    <Loader2 className="size-4 animate-spin text-paec-violet" />
                  ) : null}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-violet-50/60">
                      <tr className="border-b border-violet-100">
                        {[
                          'Date',
                          'Activity',
                          'Order #',
                          'Status',
                          'Order total',
                          '%',
                          'INT (10%)',
                          'Net commission',
                        ].map((col, index) => (
                          <th
                            key={col}
                            className={cn(
                              'px-4 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase',
                              index >= 4 && 'text-right',
                            )}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {!conversionLoading && conversionRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-10 text-center text-muted-foreground"
                          >
                            No commissions yet.
                          </td>
                        </tr>
                      ) : (
                        conversionRows.map((row) => {
                          const isReversal =
                            (row.entry_type ?? 'credit') === 'reversal'
                          const { intAmount, netCommission } =
                            affiliateGrossIntNet(row.commission_amount)
                          return (
                            <tr
                              key={row.uuid}
                              className="border-b border-violet-50 last:border-0"
                            >
                              <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                                {formatAffiliateDateTime(row.created_at)}
                              </td>
                              <td
                                className="max-w-[200px] truncate px-4 py-3 font-medium"
                                title={row.event?.event_name}
                              >
                                {row.event?.event_name ?? '—'}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                {row.transaction?.order_number ?? '—'}
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {isReversal ? (
                                  <span className="text-red-600">
                                    Reversal
                                    {row.ticket?.ticket_number
                                      ? ` · #${row.ticket.ticket_number}`
                                      : ''}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600">
                                    Earned
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {formatPeso(row.order_total)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {row.commission_percent}%
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                -{formatPeso(Math.abs(intAmount))}
                              </td>
                              <td
                                className={cn(
                                  'px-4 py-3 text-right font-medium tabular-nums',
                                  isReversal
                                    ? 'text-red-600'
                                    : 'text-emerald-600',
                                )}
                              >
                                {formatPeso(netCommission)}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  page={conversionPage}
                  totalPages={conversionTotalPages}
                  disabled={conversionLoading}
                  onChange={setConversionPage}
                />
              </div>

              <p className="max-w-2xl text-xs text-muted-foreground">
                Commission is credited when a referred booking is paid and
                becomes available for payout after the payout schedule. A 10%
                withholding tax (INT) applies to the gross commission.
              </p>
            </div>
          ) : null}

          {activeModule === 'bank' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="size-4 shrink-0 text-paec-violet" />
                <span>
                  Your bank details are used to send approved payouts.
                  {isSuspendedPartner
                    ? ' Editing is disabled while your account is suspended.'
                    : ''}
                </span>
              </div>

              <div className={cn(cardClassName, 'max-w-xl space-y-4 p-5')}>
                {(
                  [
                    ['bank', 'Bank', 'organization'],
                    ['branch', 'Branch', 'off'],
                    ['account_name', 'Account name', 'name'],
                    ['account_number', 'Account number', 'off'],
                    ['tin', 'Tax Identification Number (TIN)', 'off'],
                  ] as const
                ).map(([field, label, autoComplete]) => (
                  <div key={field} className="space-y-2">
                    <label
                      htmlFor={`aff-${field}`}
                      className="text-sm font-medium text-foreground"
                    >
                      {label}
                    </label>
                    <input
                      id={`aff-${field}`}
                      value={bankForm[field]}
                      onChange={(event) =>
                        setBankForm((form) => ({
                          ...form,
                          [field]: event.target.value,
                        }))
                      }
                      autoComplete={autoComplete}
                      maxLength={field === 'tin' ? 32 : undefined}
                      disabled={isSuspendedPartner}
                      className={cn(
                        inputClassName,
                        (field === 'account_number' || field === 'tin') &&
                          'font-mono tabular-nums',
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => void handleSaveBankDetails()}
                  disabled={bankSaving || isSuspendedPartner}
                  className="rounded-xl bg-paec-violet hover:bg-paec-violet-dark"
                >
                  {bankSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save bank details'
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {payoutModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !payoutSubmitting && setPayoutModalOpen(false)}
            aria-label="Close payout request"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-violet-100 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => !payoutSubmitting && setPayoutModalOpen(false)}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-violet-50 hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-bold text-foreground">
              Request payout
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Minimum payout is {formatPeso(AFFILIATE_MIN_PAYOUT_PHP)}.
            </p>
            <p className="mt-4 text-sm text-foreground">
              Available:{' '}
              <span className="font-semibold tabular-nums">
                {formatPeso(availableForPayout)}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Each payout is subject to a transaction fee and 10% withholding
              tax.
            </p>
            <label
              htmlFor="payout-amt"
              className="mt-4 block text-sm font-medium text-foreground"
            >
              Amount (PHP)
            </label>
            <input
              id="payout-amt"
              type="number"
              min={AFFILIATE_MIN_PAYOUT_PHP}
              step={0.01}
              placeholder="0.00"
              value={payoutAmount}
              onChange={(event) => setPayoutAmount(event.target.value)}
              className={cn(inputClassName, 'mt-2')}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayoutModalOpen(false)}
                disabled={payoutSubmitting}
                className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-violet-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={() => void handleSubmitPayoutRequest()}
                disabled={payoutSubmitting}
                className="rounded-lg bg-paec-violet hover:bg-paec-violet-dark"
              >
                {payoutSubmitting ? 'Submitting…' : 'Submit request'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
