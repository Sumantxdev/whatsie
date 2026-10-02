import { Badge } from '@/design-system/components/data'
import type { InviteStatus, MemberStatus, Role } from './types'
import { ROLE_META } from './types'

/* Shared team pills — text first, never color-only. */

export function RoleBadge({ role }: { role: Role }): React.JSX.Element {
  const tone = role === 'admin' ? 'info' : role === 'agent' ? 'accent' : 'neutral'
  return <Badge tone={tone}>{ROLE_META[role].label}</Badge>
}

export function MemberStatusBadge({ status }: { status: MemberStatus }): React.JSX.Element {
  return (
    <Badge tone={status === 'active' ? 'success' : 'warning'}>
      {status === 'active' ? 'Active' : 'Invited'}
    </Badge>
  )
}

export function InviteStatusBadge({ status }: { status: InviteStatus }): React.JSX.Element {
  const tone =
    status === 'accepted'
      ? 'success'
      : status === 'pending'
        ? 'warning'
        : status === 'failed'
          ? 'danger'
          : 'neutral'
  const label =
    status === 'pending'
      ? 'Pending'
      : status === 'accepted'
        ? 'Accepted'
        : status === 'expired'
          ? 'Expired'
          : status === 'cancelled'
            ? 'Cancelled'
            : 'Failed'
  return <Badge tone={tone}>{label}</Badge>
}
