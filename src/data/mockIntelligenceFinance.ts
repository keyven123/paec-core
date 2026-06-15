export type FinancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
export type FinanceSubTab = 'platform' | 'operator' | 'transaction'

export const financeKpis = {
  grossSales: { value: 0, change: -100 },
  netRevenue: { value: 0, change: -100 },
  taxAndFees: { value: 0, change: -100 },
  effectiveTakeRate: { value: 10.07, change: null },
  contributionMargin: { value: 0, change: -100, marginPct: 0 },
}

export type IncomeStatementRow = {
  lineItem: string
  currentMonth: number | null
  previousMonth: number | null
  popDelta: number | null
  ytd: number | null
  pctOfGmv: number | null
  isSummary?: boolean
  isIndented?: boolean
}

export const incomeStatementRows: IncomeStatementRow[] = [
  {
    lineItem: 'Gross sales (GMV)',
    currentMonth: 0,
    previousMonth: 1_250_000,
    popDelta: -100,
    ytd: 5_530_467.25,
    pctOfGmv: 100,
    isSummary: true,
  },
  {
    lineItem: 'Less: refunds',
    currentMonth: 0,
    previousMonth: 12_500,
    popDelta: -100,
    ytd: 45_200,
    pctOfGmv: 0.82,
  },
  {
    lineItem: 'Less: chargebacks',
    currentMonth: 0,
    previousMonth: 3_200,
    popDelta: -100,
    ytd: 8_750,
    pctOfGmv: 0.16,
  },
  {
    lineItem: 'Net GMV',
    currentMonth: 0,
    previousMonth: 1_234_300,
    popDelta: -100,
    ytd: 5_476_517.25,
    pctOfGmv: 99.02,
    isSummary: true,
  },
  {
    lineItem: 'Net revenue (platform fee + markup)',
    currentMonth: 0,
    previousMonth: 124_300,
    popDelta: -100,
    ytd: 556_800,
    pctOfGmv: 10.07,
    isSummary: true,
  },
  {
    lineItem: 'Less: PayPal',
    currentMonth: 0,
    previousMonth: 8_500,
    popDelta: -100,
    ytd: 38_200,
    pctOfGmv: 0.69,
    isIndented: true,
  },
  {
    lineItem: 'Less: GCash',
    currentMonth: 0,
    previousMonth: 6_200,
    popDelta: -100,
    ytd: 28_400,
    pctOfGmv: 0.51,
    isIndented: true,
  },
  {
    lineItem: 'Less: Grab Pay',
    currentMonth: 0,
    previousMonth: 4_100,
    popDelta: -100,
    ytd: 18_600,
    pctOfGmv: 0.34,
    isIndented: true,
  },
  {
    lineItem: 'Less: PayMaya',
    currentMonth: 0,
    previousMonth: 3_800,
    popDelta: -100,
    ytd: 16_200,
    pctOfGmv: 0.29,
    isIndented: true,
  },
  {
    lineItem: 'Less: Credit Card',
    currentMonth: 0,
    previousMonth: 12_400,
    popDelta: -100,
    ytd: 55_800,
    pctOfGmv: 1.01,
    isIndented: true,
  },
  {
    lineItem: 'Contribution margin',
    currentMonth: 0,
    previousMonth: 89_300,
    popDelta: -100,
    ytd: 399_600,
    pctOfGmv: 7.22,
    isSummary: true,
  },
]

export const financeNotes = [
  'POP Δ = period-over-period percentage change vs. the previous comparable period.',
  'Gross sales (GMV) includes all ticket and add-on sales before refunds and chargebacks.',
  'Net revenue reflects platform fees and markup collected on completed transactions.',
  'Effective take rate = net revenue divided by net GMV for the selected period.',
  'Contribution margin = net revenue less payment processing and gateway costs.',
]
