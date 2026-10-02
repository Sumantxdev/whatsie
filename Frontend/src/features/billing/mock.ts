import type { AgentCostRow, BillingSettings, Invoice, UsagePoint, UsageSnapshot } from './types'

/* Centralized billing mock. 7-day snapshot aligns with the AI usage mock
   (82,140 tokens · 623 calls · $7.95) and the analytics 7d dataset. */

export const billingMock: UsageSnapshot = {
  period: 'Sep 25 – Oct 02, 2026 (mock)',
  updatedAt: '2 minutes ago',
  messages: { total: 1842, sent: 880, received: 962 },
  aiCalls: 623,
  aiTokens: 82140,
  totalCost: '$7.95 (mock)',
  quota: {
    tokensUsed: 82140,
    tokensLimit: 100000,
    callsUsed: 623,
    callsLimit: 1000,
    tier: 'Pro · 100K tokens/month',
  },
}

export const usageSeriesMock: UsagePoint[] = [
  { label: 'Mon', messages: 210, calls: 72, tokens: 9400, cost: 0.91 },
  { label: 'Tue', messages: 244, calls: 81, tokens: 10500, cost: 1.02 },
  { label: 'Wed', messages: 198, calls: 66, tokens: 8900, cost: 0.86 },
  { label: 'Thu', messages: 268, calls: 94, tokens: 12300, cost: 1.19 },
  { label: 'Fri', messages: 312, calls: 108, tokens: 14100, cost: 1.36 },
  { label: 'Sat', messages: 296, calls: 104, tokens: 13400, cost: 1.3 },
  { label: 'Sun', messages: 314, calls: 98, tokens: 12540, cost: 1.31 },
]

export const billingAgentsMock: AgentCostRow[] = [
  {
    agentId: 'ag-support',
    agentName: 'Support Copilot',
    calls: 412,
    tokens: 48210,
    cost: '$3.86 (mock)',
  },
  {
    agentId: 'ag-sales',
    agentName: 'Sales Qualifier',
    calls: 188,
    tokens: 22480,
    cost: '$1.80 (mock)',
  },
  {
    agentId: 'ag-enterprise',
    agentName: 'Enterprise Desk',
    calls: 23,
    tokens: 11450,
    cost: '$2.29 (mock)',
  },
]

export const invoicesMock: Invoice[] = [
  {
    id: 'INV-2026-09',
    period: 'Sep 2026',
    date: 'Oct 01, 2026',
    amount: '$31.40 (mock)',
    status: 'paid',
    messages: 7420,
    tokens: 318500,
    calls: 2510,
  },
  {
    id: 'INV-2026-08',
    period: 'Aug 2026',
    date: 'Sep 01, 2026',
    amount: '$28.05 (mock)',
    status: 'paid',
    messages: 6905,
    tokens: 289300,
    calls: 2288,
  },
  {
    id: 'INV-2026-10',
    period: 'Oct 2026 (to date)',
    date: 'Oct 02, 2026',
    amount: '$7.95 (mock)',
    status: 'pending',
    messages: 1842,
    tokens: 82140,
    calls: 623,
  },
  {
    id: 'INV-2026-07',
    period: 'Jul 2026',
    date: 'Aug 01, 2026',
    amount: '$24.90 (mock)',
    status: 'paid',
    messages: 6110,
    tokens: 254800,
    calls: 2012,
  },
  {
    id: 'INV-2026-06',
    period: 'Jun 2026',
    date: 'Jul 03, 2026',
    status: 'failed',
    amount: '$22.10 (mock)',
    messages: 5400,
    tokens: 221000,
    calls: 1740,
  },
  {
    id: 'INV-2026-11',
    period: 'Nov 2026 (draft)',
    date: 'Draft — not issued',
    amount: '$0.42 (mock)',
    status: 'draft',
    messages: 96,
    tokens: 4100,
    calls: 31,
  },
]

export const billingSettingsMock: BillingSettings = {
  billingName: 'Acme Goods',
  contactEmail: 'billing@example.com',
  invoiceEmail: true,
}
