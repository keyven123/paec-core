import { BarChart3, Wallet } from 'lucide-react'
import { useState } from 'react'

import { IntelligenceAnalyticsTab } from '@/components/admin/intelligence/IntelligenceAnalyticsTab'
import { IntelligenceFinanceTab } from '@/components/admin/intelligence/IntelligenceFinanceTab'
import { cn } from '@/lib/utils'

type IntelligenceTab = 'analytics' | 'finance'

const tabs: { id: IntelligenceTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'finance', label: 'Finance', icon: Wallet },
]

export function AdminIntelligenceSection() {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('analytics')

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-foreground lg:text-2xl">Intelligence</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Analytics and insights for your attractions and bookings
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
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

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {activeTab === 'analytics' && <IntelligenceAnalyticsTab />}
        {activeTab === 'finance' && <IntelligenceFinanceTab />}
      </div>
    </div>
  )
}
