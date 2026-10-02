import { Badge } from '@/design-system/components/data'
import { KB_TYPE_META } from './types'
import type { KbDocState, KbSourceType, KbStatus } from './types'

/* Shared KB pills — text first, never color-only. Matches AI knowledge badges. */

export function KbStatusBadge({ status }: { status: KbStatus }): React.JSX.Element {
  const tone =
    status === 'indexed'
      ? 'success'
      : status === 'processing'
        ? 'info'
        : status === 'failed'
          ? 'danger'
          : status === 'empty'
            ? 'warning'
            : 'neutral'
  const label =
    status === 'indexed'
      ? 'Indexed'
      : status === 'processing'
        ? 'Processing'
        : status === 'failed'
          ? 'Failed'
          : status === 'empty'
            ? 'Empty'
            : 'Draft'
  return <Badge tone={tone}>{label}</Badge>
}

export function KbTypeBadge({ type }: { type: KbSourceType }): React.JSX.Element {
  return <Badge tone="neutral">{KB_TYPE_META[type].label}</Badge>
}

export function KbDocStateBadge({ state }: { state: KbDocState }): React.JSX.Element {
  const tone = state === 'indexed' ? 'success' : state === 'processing' ? 'info' : 'danger'
  const label = state === 'indexed' ? 'Indexed' : state === 'processing' ? 'Processing' : 'Failed'
  return <Badge tone={tone}>{label}</Badge>
}
