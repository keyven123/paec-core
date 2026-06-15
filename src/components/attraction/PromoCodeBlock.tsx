import { CheckCircle2, Tag, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/api'
import {
  formatPromoSavingsLabel,
  getPromoDiscountAmount,
} from '@/lib/promoUtils'
import { cn } from '@/lib/utils'
import {
  publicPromoCodeService,
  type PublicPromoCode,
} from '@/services/promoCodeService'

type PromoCodeBlockProps = {
  eventUuid: string
  subtotal: number
  appliedPromoCode: PublicPromoCode | null
  onAppliedChange: (promo: PublicPromoCode | null) => void
}

export function PromoCodeBlock({
  eventUuid,
  subtotal,
  appliedPromoCode,
  onAppliedChange,
}: PromoCodeBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [applying, setApplying] = useState(false)

  const handleApply = async () => {
    const code = input.trim().toUpperCase()
    if (!code) {
      toast.error('Please enter a promo code')
      return
    }

    if (subtotal <= 0) {
      toast.error('Select tickets before applying a promo code')
      return
    }

    setApplying(true)
    try {
      const promo = await publicPromoCodeService.validateByCode(code, eventUuid)
      onAppliedChange(promo)
      setInput('')
      setExpanded(false)
      const discount = getPromoDiscountAmount(subtotal, promo)
      toast.success(
        discount > 0
          ? `Promo applied — you save ₱${discount.toLocaleString()}`
          : 'Promo code applied',
      )
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Invalid or expired promo code'),
      )
    } finally {
      setApplying(false)
    }
  }

  const handleRemove = () => {
    onAppliedChange(null)
    setInput('')
    toast.success('Promo code removed')
  }

  if (appliedPromoCode) {
    return (
      <div className="rounded-xl border border-paec-violet/20 bg-violet-50/60 px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span className="text-xs font-semibold tracking-wide text-paec-violet uppercase">
                Promo applied
              </span>
            </div>
            <p className="mt-1 font-mono text-sm font-bold text-foreground">
              {appliedPromoCode.code}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatPromoSavingsLabel(appliedPromoCode, subtotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white text-muted-foreground transition-colors hover:border-red-200 hover:text-red-500"
            aria-label="Remove promo code"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-paec-violet transition-colors hover:text-paec-violet-dark"
      >
        <Tag className="size-3.5" />
        Add promo code
      </button>
    )
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-dashed border-paec-violet/30 bg-violet-50/40 p-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="booking-promo-code"
          className="text-xs font-medium text-muted-foreground"
        >
          Promo code
        </label>
        <button
          type="button"
          onClick={() => {
            setExpanded(false)
            setInput('')
          }}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      <div className="flex gap-2">
        <input
          id="booking-promo-code"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleApply()
          }}
          placeholder="Enter code"
          autoComplete="off"
          className={cn(
            'h-10 min-w-0 flex-1 rounded-lg border border-violet-100 bg-white px-3',
            'font-mono text-sm uppercase tracking-wider text-foreground',
            'placeholder:text-muted-foreground/50',
            'focus:border-paec-violet focus:ring-2 focus:ring-paec-violet/20 focus:outline-none',
          )}
        />
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={applying || !input.trim()}
          className="shrink-0 rounded-lg bg-paec-violet px-4 text-sm font-semibold text-white transition-colors hover:bg-paec-violet-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {applying ? '…' : 'Apply'}
        </button>
      </div>
    </div>
  )
}
