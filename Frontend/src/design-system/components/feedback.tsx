import type { ReactNode } from 'react'
import { cx } from '../utils'
import { Button } from './buttons'

/* Predictable states: every async/empty/error path uses these. */

export function Spinner({ label = 'Loading' }: { label?: string }): React.JSX.Element {
  return <span className="wx-spinner" role="status" aria-label={label} />
}

export function Skeleton({
  width = '100%',
  height = 16,
  label = 'Loading',
}: {
  width?: string | number
  height?: number
  label?: string
}): React.JSX.Element {
  return <div className="wx-skeleton" role="status" aria-label={label} style={{ width, height }} />
}

function StateShell({
  title,
  body,
  actions,
  tone,
}: {
  title: string
  body?: string
  actions?: ReactNode
  tone?: 'error' | 'success'
}): React.JSX.Element {
  return (
    <div className="wx-state" role={tone === 'error' ? 'alert' : 'status'}>
      <p className="wx-state__title">{title}</p>
      {body && <p className="wx-state__body">{body}</p>}
      {actions && <div style={{ display: 'flex', gap: 12 }}>{actions}</div>}
    </div>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}): React.JSX.Element {
  return <StateShell title={title} body={body} actions={action} />
}

export function ErrorState({
  title = 'Something went wrong',
  body,
  onRetry,
  requestId,
}: {
  title?: string
  body?: string
  onRetry?: () => void
  requestId?: string
}): React.JSX.Element {
  return (
    <StateShell
      tone="error"
      title={title}
      body={body}
      actions={
        <>
          {onRetry && (
            <Button variant="secondary" size="md" onClick={onRetry}>
              Retry
            </Button>
          )}
          {requestId && <span className="wx-caption">ID: {requestId}</span>}
        </>
      }
    />
  )
}

export function Alert({
  tone,
  children,
  className,
}: {
  tone: 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(`wx-alert--${tone}`, 'wx-alert', className)}
    >
      <span>{children}</span>
    </div>
  )
}

export function Toast({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}): React.JSX.Element {
  return (
    <div className="wx-toast" role="status">
      <div>
        <p className="wx-label">{title}</p>
        {body && <p className="wx-body-sm">{body}</p>}
      </div>
      {action}
    </div>
  )
}
