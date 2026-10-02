import type {
  ConversationStatus,
  LeadStatus,
  MessageDirection,
  MessageType,
  Platform,
} from '@/types/domain'

/* Inbox contracts. Lifecycle (conversation) and delivery (message) stay distinct. */

export type LifecycleState = ConversationStatus | 'waiting'
export type DeliveryState =
  | 'queued'
  | 'processing'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'retrying'
  | 'expired'

export type SenderKind = 'customer' | 'agent' | 'ai' | 'system'

export interface Attachment {
  id: string
  kind: 'image' | 'file' | 'audio' | 'video'
  name: string
  size: string
  state?: 'uploading' | 'uploaded' | 'failed' | 'unsupported'
  progress?: number
}

export interface InboxMessage {
  id: string
  direction: MessageDirection | 'system'
  sender: SenderKind
  agentName?: string
  type: MessageType
  text: string
  time: string
  delivery: DeliveryState
  failureReason?: string
  replyTo?: { id: string; preview: string }
  attachment?: Attachment
  mention?: string
  quickReplies?: string[]
  aiTag?: string
}

export interface LeadContext {
  id: string
  name: string
  phone: string
  email?: string
  stage: LeadStatus
  tags: string[]
  assignedTo: string | null
  recentActivity: string[]
  relatedCount: number
}

export interface InboxConversation {
  id: string
  name: string
  platform: Platform
  preview: string
  time: string
  unread: number
  lifecycle: LifecycleState
  assignedTo: string | null
  aiHandling: boolean
  tags: string[]
  leadStage: LeadStatus
  messages: InboxMessage[]
  lead: LeadContext
}

export interface TeamMember {
  id: string
  name: string
  role: string
}

export type ChannelFilter = Platform | 'all'
export type LifecycleFilter = 'all' | 'active' | 'waiting' | 'closed'
export type AssignFilter = 'all' | 'mine' | 'unassigned'
export type HandlingFilter = 'all' | 'ai' | 'human'

export interface InboxFilters {
  query: string
  channel: ChannelFilter
  lifecycle: LifecycleFilter
  assign: AssignFilter
  handling: HandlingFilter
}

export const emptyFilters: InboxFilters = {
  query: '',
  channel: 'all',
  lifecycle: 'all',
  assign: 'all',
  handling: 'all',
}
