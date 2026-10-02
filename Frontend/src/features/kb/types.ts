/* Knowledge Base contracts. Sources ground AI retrieval; agents reference them
   by id (see features/ai mock assignedIds). Statuses mirror the indexing
   pipeline: draft → processing → indexed, or failed with retry. */

export type KbSourceType = 'document' | 'text' | 'url' | 'faq' | 'structured'
export type KbStatus = 'indexed' | 'processing' | 'failed' | 'empty' | 'draft'
export type KbDocState = 'indexed' | 'processing' | 'failed'

export interface KbDoc {
  id: string
  name: string
  kind: 'pdf' | 'docx' | 'md' | 'txt' | 'url' | 'qa'
  size: string
  state: KbDocState
  updated: string
}

export interface KbSource {
  id: string
  title: string
  type: KbSourceType
  description: string
  tags: string[]
  status: KbStatus
  progress?: number
  error?: string
  updated: string
  docs: KbDoc[]
  agentIds: string[]
  archived?: boolean
}

export type KbActivityKind =
  'uploaded' | 'indexed' | 'failed' | 'assigned' | 'unassigned' | 'reprocessed' | 'edited'

export interface KbActivity {
  id: string
  sourceId: string
  kind: KbActivityKind
  text: string
  actor: string
  time: string
}

export interface NewSourceInput {
  title: string
  type: KbSourceType
  description: string
  tags: string[]
}

export const KB_TYPE_META: Record<KbSourceType, { label: string; hint: string }> = {
  document: { label: 'Documents', hint: 'PDF, DOCX, Markdown, or text files' },
  text: { label: 'Text', hint: 'Paste or write content directly' },
  url: { label: 'URL', hint: 'Public web pages to fetch and index' },
  faq: { label: 'FAQ', hint: 'Question-and-answer pairs' },
  structured: { label: 'Structured', hint: 'CSV-style rows for precise lookup' },
}
