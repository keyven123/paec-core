import { Handshake, Users, Wallet, Calendar } from 'lucide-react'
import { useState } from 'react'

import { AffiliateActivitiesTab } from '@/components/admin/affiliate/AffiliateActivitiesTab'
import { AffiliatePartnersTab } from '@/components/admin/affiliate/AffiliatePartnersTab'
import { AffiliatePayoutsTab } from '@/components/admin/affiliate/AffiliatePayoutsTab'
import { cn } from '@/lib/utils'

type AffiliateTab = 'activities' | 'partners' | 'payouts'

const tabs: Array<{ id: AffiliateTab; label: string; icon: typeof Users }> = [
  { id: 'activities', label: 'Activities', icon: Calendar },
  { id: 'partners', label: 'Partners', icon: Users },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
]

const subtitles: Record<AffiliateTab, string> = {
  activities:
    'Turn affiliate sales on per activity and set the commission as a percent of the ticket price.',
  partners:
    'Customers enrolled in the affiliate program. Open View to see clicks, commissions and earnings.',
  payouts:
    'Review payout requests. Approve or decline pending requests; partners see the status in their history.',
}

export function AdminAffiliatePartnersPage() {
  const [tab, setTab] = useState<AffiliateTab>('activities')

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-paec-violet">
          <Handshake className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            Affiliate Partners
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {subtitles[tab]}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-violet-100 pb-3">
        {tabs.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'bg-paec-violet text-white shadow-sm shadow-paec-violet/20'
                  : 'border border-violet-100 bg-white text-muted-foreground hover:bg-violet-50 hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'activities' ? <AffiliateActivitiesTab /> : null}
      {tab === 'partners' ? <AffiliatePartnersTab /> : null}
      {tab === 'payouts' ? <AffiliatePayoutsTab /> : null}
    </div>
  )
}
