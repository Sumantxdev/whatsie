import type { LeadStatus, Platform } from '@/types/domain'

/* CONTACT vs LEAD (per reference/message.txt):
   The architecture defines ONE entity (`leads`) with a lifecycle `status`.
   There is no separate contacts table. This feature models that directly:
   - Contact = the person facet (identity, info, tags, notes, custom fields).
   - Lead = the lifecycle facet of the same record (stage, assignment, pipeline).
   "Contacts" list shows people; "Lead detail" is the lifecycle view of a record. */

export type Stage = LeadStatus

export const STAGE_ORDER: Stage[] = ['new', 'contacted', 'qualified', 'converted', 'lost']

export interface CrmNote {
  id: string
  author: string
  time: string
  text: string
}

export interface CustomField {
  key: string
  value: string
}

export type ActivitySource = 'manual' | 'workflow' | 'ai'

export interface CrmActivity {
  id: string
  kind: 'message' | 'status' | 'workflow' | 'ai' | 'assign' | 'note' | 'tag'
  text: string
  source: ActivitySource
  actor: string
  time: string
}

export interface RelatedConversation {
  inboxId: string | null
  platform: Platform
  preview: string
  time: string
}

export interface CrmRecord {
  id: string
  name: string
  phone: string
  email?: string
  channel: Platform
  stage: Stage
  assignedTo: string | null
  tags: string[]
  lastActivity: string
  lastActivitySort: number
  createdSort: number
  notes: CrmNote[]
  customFields: CustomField[]
  conversations: RelatedConversation[]
  activity: CrmActivity[]
}

export type StageFilter = Stage | 'all'
export type AssigneeFilter = 'all' | 'mine' | 'unassigned' | string

export interface CrmFilters {
  query: string
  stage: StageFilter
  assignee: AssigneeFilter
  tag: string
  channel: Platform | 'all'
}

export type SortKey = 'recent' | 'name' | 'newest' | 'stage'

export const emptyCrmFilters: CrmFilters = {
  query: '',
  stage: 'all',
  assignee: 'all',
  tag: 'all',
  channel: 'all',
}
