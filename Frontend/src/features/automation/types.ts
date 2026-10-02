import type { LeadStatus } from '@/types/domain'

/* Automation contracts. Mirror reference/message.txt workflow schema:
   trigger { type: 'keyword' | 'intent' | 'event', value },
   steps [{ id, type: 'message' | 'wait' | 'condition' | 'api_call' | 'update_lead', config }].
   Conditions branch into yes/no lanes; all other steps run in sequence. */

export type TriggerType = 'keyword' | 'intent' | 'event'
export type StepType = 'message' | 'wait' | 'condition' | 'api_call' | 'update_lead'
export type WorkflowStatus = 'draft' | 'active' | 'disabled'
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled'
export type StepRunStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'

export interface Trigger {
  type: TriggerType
  value: string
  match?: 'contains' | 'exact'
}

export interface MessageConfig {
  text: string
}
export interface WaitConfig {
  amount: number
  unit: 'seconds' | 'minutes' | 'hours' | 'days'
}
export interface ConditionConfig {
  variable: 'lead.status' | 'message.text' | 'contact.tag' | 'conversation.state'
  operator: 'equals' | 'contains' | 'is'
  value: string
}
export interface ApiConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers: Array<{ key: string; value: string }>
  body: string
}
export interface LeadUpdateConfig {
  status: LeadStatus | 'no-change'
  assignee: string
  addTags: string
}

export interface Step {
  id: string
  type: StepType
  message?: MessageConfig
  wait?: WaitConfig
  condition?: ConditionConfig
  api?: ApiConfig
  lead?: LeadUpdateConfig
  yes: Step[]
  no: Step[]
}

export interface Workflow {
  id: string
  name: string
  description: string
  status: WorkflowStatus
  trigger: Trigger
  steps: Step[]
  updated: string
  runs24h: number
  failRate: string
  lastRun: string
}

export interface StepRun {
  stepId: string
  label: string
  status: StepRunStatus
  detail?: string
  error?: string
}

export interface Execution {
  id: string
  workflowId: string
  workflowName: string
  triggerLabel: string
  leadName: string
  leadId: string | null
  conversationId: string | null
  started: string
  duration: string
  status: ExecutionStatus
  steps: StepRun[]
  error?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  trigger: Trigger
  stepCount: string
}

export const TRIGGER_EVENTS = [
  'message received',
  'message sent',
  'lead status changed',
  'workflow started',
  'AI called',
] as const

export const STEP_META: Record<StepType, { label: string; hint: string }> = {
  message: { label: 'Send Message', hint: 'Reply to the customer' },
  wait: { label: 'Wait', hint: 'Pause before the next step' },
  condition: { label: 'Condition', hint: 'Branch on Yes / No' },
  api_call: { label: 'API Call', hint: 'Call an external endpoint' },
  update_lead: { label: 'Update Lead', hint: 'Change CRM stage, owner, tags' },
}
