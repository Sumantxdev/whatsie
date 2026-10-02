import type { ConversationStatus, LeadStatus, Platform } from '@/types/domain'

/* Home dashboard contracts. Mirrors reference/message.txt entities; mock-backed. */

export interface SnapshotMetric {
  id: 'active-conversations' | 'new-leads' | 'ai-tokens' | 'failed-executions'
  label: string
  value: string
  hint: string
  to: string
  linkLabel: string
}

export type AttentionSeverity = 'critical' | 'warning' | 'info'

export interface AttentionItem {
  id: string
  severity: AttentionSeverity
  title: string
  body: string
  actionLabel: string
  to: string
}

export interface ConversationSummary {
  id: string
  name: string
  platform: Platform
  preview: string
  time: string
  unread: number
  status: ConversationStatus
  aiHandled: boolean
}

export interface FunnelStage {
  stage: LeadStatus
  count: number
}

export interface AiHealth {
  status: 'healthy' | 'degraded' | 'over-quota'
  tokensUsed: string
  tokenLimit: string
  fallbackRate: string
  takeovers: number
  errors: number
}

export type ChannelHealthState =
  'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'degraded' | 'auth-issue'

export interface ChannelHealth {
  id: string
  platform: Platform
  label: string
  state: ChannelHealthState
  detail: string
}

export interface WorkflowStat {
  running: number
  completed24h: number
  failed24h: number
}

export interface ExecutionSummary {
  id: string
  workflow: string
  lead: string
  status: 'in_progress' | 'completed' | 'failed'
  time: string
}

export type ActivityKind =
  'message_received' | 'status_changed' | 'workflow_started' | 'ai_called' | 'channel_event'

export interface ActivityEvent {
  id: string
  kind: ActivityKind
  text: string
  context: string
  time: string
}

export interface QuickAction {
  id: string
  label: string
  hint: string
  to: string
}

export interface HomeSnapshot {
  workspaceName: string
  plan: string
  metrics: SnapshotMetric[]
  attention: AttentionItem[]
  conversations: ConversationSummary[]
  funnel: FunnelStage[]
  ai: AiHealth
  workflows: WorkflowStat
  executions: ExecutionSummary[]
  channels: ChannelHealth[]
  activity: ActivityEvent[]
  actions: QuickAction[]
}
