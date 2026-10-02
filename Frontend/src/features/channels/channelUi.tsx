import { Badge } from '@/design-system/components/data'
import type { Capability, ConnectionState, HealthState } from './types'

/* Shared channel pills — text first, never color-only. */

export function ConnectionBadge({ status }: { status: ConnectionState }): React.JSX.Element {
  const map: Record<
    ConnectionState,
    { tone: 'success' | 'neutral' | 'info' | 'warning' | 'danger'; label: string }
  > = {
    connected: { tone: 'success', label: 'Connected' },
    connecting: { tone: 'info', label: 'Connecting' },
    'not-connected': { tone: 'neutral', label: 'Not connected' },
    attention: { tone: 'warning', label: 'Needs attention' },
    error: { tone: 'danger', label: 'Error' },
    disabled: { tone: 'neutral', label: 'Disabled' },
  }
  const m = map[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export function HealthBadge({ health }: { health: HealthState }): React.JSX.Element {
  const map: Record<
    HealthState,
    { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string }
  > = {
    healthy: { tone: 'success', label: 'Healthy' },
    degraded: { tone: 'warning', label: 'Degraded' },
    down: { tone: 'danger', label: 'Down' },
    unknown: { tone: 'neutral', label: 'Unknown' },
  }
  const m = map[health]
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export function CapabilityBadge({ capability }: { capability: Capability }): React.JSX.Element {
  const tone =
    capability.state === 'supported'
      ? 'success'
      : capability.state === 'limited'
        ? 'warning'
        : 'neutral'
  const label =
    capability.state === 'supported'
      ? 'Supported'
      : capability.state === 'limited'
        ? 'Limited'
        : 'Unavailable'
  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <span className="wx-body-sm">{capability.label}</span>
      <Badge tone={tone}>{label}</Badge>
    </span>
  )
}
