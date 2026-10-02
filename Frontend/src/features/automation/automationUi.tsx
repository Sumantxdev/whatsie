import { Badge } from '@/design-system/components/data'
import { STEP_META } from './types'
import type { ExecutionStatus, StepType, TriggerType, WorkflowStatus } from './types'

/* Shared automation pills — text first, never color-only. */

export function WorkflowStatusBadge({ status }: { status: WorkflowStatus }): React.JSX.Element {
  const tone = status === 'active' ? 'success' : status === 'disabled' ? 'neutral' : 'warning'
  const label = status === 'active' ? 'Active' : status === 'disabled' ? 'Disabled' : 'Draft'
  return <Badge tone={tone}>{label}</Badge>
}

export function TriggerBadge({ type }: { type: TriggerType }): React.JSX.Element {
  const label = type === 'keyword' ? 'Keyword' : type === 'intent' ? 'Intent' : 'Event'
  return <Badge tone="info">{label}</Badge>
}

export function StepTypeBadge({ type }: { type: StepType }): React.JSX.Element {
  return <Badge tone="neutral">{STEP_META[type].label}</Badge>
}

export function ExecutionStatusBadge({ status }: { status: ExecutionStatus }): React.JSX.Element {
  const tone =
    status === 'completed'
      ? 'success'
      : status === 'failed'
        ? 'danger'
        : status === 'running'
          ? 'info'
          : 'neutral'
  const label =
    status === 'completed'
      ? 'Completed'
      : status === 'failed'
        ? 'Failed'
        : status === 'running'
          ? 'Running'
          : 'Cancelled'
  return <Badge tone={tone}>{label}</Badge>
}
