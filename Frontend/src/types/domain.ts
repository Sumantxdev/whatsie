/* Minimal structural types from reference/message.txt.
   Feature mock data comes later. No invented backend contracts. */

export type Platform =
  'whatsapp' | 'telegram' | 'discord' | 'messenger' | 'instagram' | 'teams' | 'twitch' | 'twitter'

export type TenantPlan = 'free' | 'pro' | 'enterprise'
export type TenantStatus = 'active' | 'suspended' | 'cancelled'
export type UserRole = 'admin' | 'agent' | 'viewer'

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
export type ConversationStatus = 'active' | 'closed' | 'transferred'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'location'
  | 'contact'
  | 'sticker'
  | 'button_click'

export type WorkflowStatus = 'active' | 'paused' | 'archived'
export type ExecutionStatus = 'in_progress' | 'completed' | 'failed'
export type SessionState = 'idle' | 'in_flow' | 'waiting_input'

export interface Workspace {
  id: string
  name: string
  plan: TenantPlan
  status: TenantStatus
}
