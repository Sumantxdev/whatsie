/* Billing contracts. Usage categories mirror reference/message.txt logging
   (tokens, cost, latency; per-tenant monthly counters; tier quotas).
   Quotas shown are architecture-defined (Free 10K/mo, Pro 100K/mo).
   Costs are mock values in the project's mock-data convention — no pricing
   formula, currency claim, tax, or payment behavior is invented. */

export type InvoiceStatus = 'paid' | 'pending' | 'failed' | 'draft'

export interface UsageSnapshot {
  period: string
  updatedAt: string
  messages: { total: number; sent: number; received: number }
  aiCalls: number
  aiTokens: number
  totalCost: string
  quota: {
    tokensUsed: number
    tokensLimit: number
    callsUsed: number
    callsLimit: number
    tier: string
  }
}

export interface UsagePoint {
  label: string
  messages: number
  calls: number
  tokens: number
  cost: number
}

export interface AgentCostRow {
  agentId: string
  agentName: string
  calls: number
  tokens: number
  cost: string
}

export interface Invoice {
  id: string
  period: string
  date: string
  amount: string
  status: InvoiceStatus
  messages: number
  tokens: number
  calls: number
}

export interface BillingSettings {
  billingName: string
  contactEmail: string
  invoiceEmail: boolean
}
