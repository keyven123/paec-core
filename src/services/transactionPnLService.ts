import { adminApi } from '@/lib/api'

export type TransactionPnLView = 'events' | 'fun'
export type TransactionPnLSort = 'revenue' | 'gmv' | 'margin'

export type TransactionPnLRow = {
  id: string
  name: string
  organizer: string
  date_label: string
  tickets: number
  gmv: number
  refund_pct: number
  take_rate: number
  net_revenue: number
  margin: number
}

export type TransactionPnLData = {
  view: TransactionPnLView
  month: string
  sort: TransactionPnLSort
  available_months: string[]
  rows: TransactionPnLRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const transactionPnLService = {
  async getLeaderboard(params: {
    view: TransactionPnLView
    month: string
    sort: TransactionPnLSort
    page: number
    per_page?: number
  }): Promise<TransactionPnLData> {
    const { data } = await adminApi.get<{ data: TransactionPnLData }>(
      '/v1/admin/finance/transaction-pnl',
      { params },
    )
    return data.data
  },
}
