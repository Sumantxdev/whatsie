import type { Platform } from '@/types/domain'

/* AI contracts. Mirrors reference/message.txt: model routing tiers, RAG knowledge,
   guardrails, ai_called/fallback/failure/escalation events, tokens/cost/latency. */

export type AgentStatus = 'active' | 'inactive' | 'configuring' | 'error'
export type ModelTier = 'tier-1' | 'tier-2' | 'tier-3'
export type ModelAvailability = 'available' | 'degraded' | 'unavailable'
export type KnowledgeState = 'indexed' | 'processing' | 'failed' | 'unassigned'
export type AiEventKind = 'called' | 'response' | 'fallback' | 'failure' | 'escalation' | 'usage'

export interface KnowledgeSource {
  id: string
  title: string
  kind: 'doc' | 'url' | 'faq'
  state: Exclude<KnowledgeState, 'unassigned'>
  chunks: number
  updated: string
}

export interface AgentKnowledge {
  assignedIds: string[]
}

export interface Guardrails {
  moderation: boolean
  piiRedaction: boolean
  blockedTopics: string[]
  escalationThreshold: 'low' | 'standard' | 'strict'
  fallbackMessage: string
}

export interface AgentModel {
  tier: ModelTier
  availability: ModelAvailability
  fallbackTier: ModelTier | null
}

export interface Agent {
  id: string
  name: string
  purpose: string
  status: AgentStatus
  channels: Platform[]
  channelConnected: boolean
  model: AgentModel
  knowledge: AgentKnowledge
  guardrails: Guardrails
  behavior: { instructions: string; tone: 'friendly' | 'concise' | 'formal'; maxLength: number }
  escalationEnabled: boolean
  lastActive: string
  calls24h: number
  fallbackRate: string
  attention: string[]
}

export interface AiEvent {
  id: string
  agentId: string
  agentName: string
  kind: AiEventKind
  text: string
  conversationId: string | null
  time: string
  tokens?: number
  latencyMs?: number
}

export interface AgentUsage {
  agentId: string
  agentName: string
  calls: number
  tokens: number
  cost: string
  avgLatency: string
  fallbackRate: string
}

export interface WorkspaceQuota {
  tokensUsed: number
  tokensLimit: number
  callsUsed: number
  callsLimit: number
}

export interface TestMessage {
  id: string
  from: 'user' | 'ai' | 'system'
  text: string
  sources?: string[]
}

export const TIER_META: Record<ModelTier, { label: string; hint: string; cost: string }> = {
  'tier-1': { label: 'Tier 1 · Fast', hint: 'FAQs, short replies', cost: 'Low cost' },
  'tier-2': { label: 'Tier 2 · Balanced', hint: 'Most conversations', cost: 'Medium cost' },
  'tier-3': { label: 'Tier 3 · Frontier', hint: 'Complex reasoning', cost: 'High cost' },
}
