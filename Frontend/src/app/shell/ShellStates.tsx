import { Alert } from '@/design-system/components/feedback'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { useOnlineStatus } from './useOnlineStatus'

/* Shell-level states. Suspended + offline are live; others are foundations for later. */

export function ShellBanners({
  workspaceSuspended,
  workspaceName,
}: {
  workspaceSuspended: boolean
  workspaceName: string
}): React.JSX.Element | null {
  const online = useOnlineStatus()
  if (online && !workspaceSuspended) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {!online && (
        <div style={{ padding: '8px 32px', background: 'var(--warning-bg)' }} role="alert">
          <p className="wx-body-sm" style={{ color: 'var(--warning-text)' }}>
            You’re offline. Changes will queue and sync when reconnected.
          </p>
        </div>
      )}
      {workspaceSuspended && (
        <div style={{ padding: '8px 32px', background: 'var(--warning-bg)' }} role="alert">
          <p className="wx-body-sm" style={{ color: 'var(--warning-text)' }}>
            {workspaceName} is suspended. Reads are available; sending and publishing are paused.
          </p>
        </div>
      )}
    </div>
  )
}

export function WorkspaceLoading(): React.JSX.Element {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      role="status"
      aria-label="Loading workspace"
    >
      <Skeleton height={30} width="40%" />
      <Skeleton height={16} width="70%" />
      <Skeleton height={120} />
    </div>
  )
}

export function WorkspaceUnavailable({ onRetry }: { onRetry?: () => void }): React.JSX.Element {
  return (
    <ErrorState
      title="Workspace unavailable"
      body="We couldn’t load this workspace. Check your connection or switch workspaces."
      onRetry={onRetry}
    />
  )
}

export function UnauthorizedState(): React.JSX.Element {
  return (
    <EmptyState
      title="You don’t have access"
      body="This area requires a different role. Contact your workspace admin."
    />
  )
}

export function SessionExpiredState(): React.JSX.Element {
  return (
    <EmptyState
      title="Session expired"
      body="Sign in again to continue. Your drafts are preserved locally."
    />
  )
}

export function ShellAlertDemo(): React.JSX.Element {
  // Kept to prove Alert tones use tokens; not product content.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Alert tone="info">Shell foundation active. Feature pages land in later stages.</Alert>
    </div>
  )
}
