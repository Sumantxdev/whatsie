import { Badge } from '@/design-system/components/data'
import type { AgentStatus, AiEventKind, ModelTier } from './types'
import { TIER_META } from './types'

/* Shared AI pills — text first, never color-only. Consistent with Inbox AI tags. */

export function AgentStatusBadge({ status }: { status: AgentStatus }): React.JSX.Element {
  const tone =
    status === 'active'
      ? 'success'
      : status === 'error'
        ? 'danger'
        : status === 'configuring'
          ? 'warning'
          : 'neutral'
  const label =
    status === 'active'
      ? 'Active'
      : status === 'inactive'
        ? 'Inactive'
        : status === 'configuring'
          ? 'Configuring'
          : 'Error'
  return <Badge tone={tone}>{label}</Badge>
}

export function TierBadge({ tier }: { tier: ModelTier }): React.JSX.Element {
  return <Badge tone="ai">{TIER_META[tier].label}</Badge>
}

export function EventKindBadge({ kind }: { kind: AiEventKind }): React.JSX.Element {
  const tone =
    kind === 'failure'
      ? 'danger'
      : kind === 'fallback' || kind === 'escalation'
        ? 'warning'
        : kind === 'usage'
          ? 'neutral'
          : 'info'
  const label =
    kind === 'called'
      ? 'AI called'
      : kind === 'response'
        ? 'Response'
        : kind === 'fallback'
          ? 'Fallback'
          : kind === 'failure'
            ? 'Failure'
            : kind === 'escalation'
              ? 'Escalation'
              : 'Usage'
  return <Badge tone={tone}>{label}</Badge>
}

export function KnowledgeStateBadge({
  state,
}: {
  state: 'indexed' | 'processing' | 'failed'
}): React.JSX.Element {
  const tone = state === 'indexed' ? 'success' : state === 'processing' ? 'info' : 'danger'
  const label = state === 'indexed' ? 'Indexed' : state === 'processing' ? 'Processing' : 'Failed'
  return <Badge tone={tone}>{label}</Badge>
}
