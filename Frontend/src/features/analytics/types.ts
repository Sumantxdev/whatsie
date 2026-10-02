/* Analytics contracts. Every value is mock-backed and replaceable by API
   responses without touching components. No revenue, CSAT, or scores. */

export type TimeRange = 'today' | '7d' | '30d' | 'custom'
export type DeltaDirection = 'up' | 'down' | 'flat'

export interface Kpi {
  id: string
  label: string
  value: string
  delta: string
  direction: DeltaDirection
  hint: string
  to: string
  linkLabel: string
}

export interface TimePoint {
  label: string
  inbound: number
  outbound: number
}

export interface FunnelCount {
  stage: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  count: number
}

export interface LeadMovement {
  id: string
  leadId: string | null
  leadName: string
  text: string
  time: string
}

export interface AgentUsageRow {
  agentId: string
  agentName: string
  calls: number
  tokens: number
  cost: string
  avgLatency: string
  fallbackRate: string
}

export interface WorkflowStat {
  workflowId: string
  workflowName: string
  runs: number
  failed: number
}

export interface ChannelStat {
  platform: string
  label: string
  messages: number
  conversations: number
  connected: boolean
  channelId: string
}

export interface UsageTotals {
  messages: number
  tokens: number
  calls: number
  cost: string
  quotaPct: number
}

export interface RangeDataset {
  kpis: Kpi[]
  messages: TimePoint[]
  funnel: FunnelCount[]
  movements: LeadMovement[]
  agents: AgentUsageRow[]
  aiSeries: Array<{ label: string; calls: number }>
  tokenSeries: Array<{ label: string; tokens: number }>
  execSeries: Array<{ label: string; completed: number; failed: number }>
  topWorkflows: WorkflowStat[]
  channels: ChannelStat[]
  usage: UsageTotals
}
