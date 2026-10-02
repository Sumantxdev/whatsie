import { Badge } from '@/design-system/components/data'
import type { ActivitySource } from './types'
import type { Stage } from './types'

/* Shared stage/source pills — text first, never color-only. */

export function StageBadge({ stage }: { stage: Stage }): React.JSX.Element {
  const tone =
    stage === 'converted'
      ? 'success'
      : stage === 'lost'
        ? 'danger'
        : stage === 'qualified'
          ? 'warning'
          : stage === 'contacted'
            ? 'info'
            : 'neutral'
  return <Badge tone={tone}>{stage}</Badge>
}

export function SourceBadge({ source }: { source: ActivitySource }): React.JSX.Element {
  const label = source === 'manual' ? 'Manual' : source === 'workflow' ? 'Workflow' : 'AI'
  const tone = source === 'manual' ? 'neutral' : source === 'workflow' ? 'accent' : 'ai'
  return <Badge tone={tone}>{label}</Badge>
}
