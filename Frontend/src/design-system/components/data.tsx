import type { ReactNode } from 'react'
import { cx } from '../utils'

/* Generic data foundations only — no CRM/analytics specifics. */

type Tone = 'neutral' | 'accent' | 'ai' | 'success' | 'warning' | 'danger' | 'info'

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return <span className={cx('wx-badge', `wx-badge--${tone}`, className)}>{children}</span>
}

export function StatusIndicator({
  state = 'idle',
  label,
}: {
  state?: 'idle' | 'active' | 'processing' | 'warning' | 'error'
  label: string
}): React.JSX.Element {
  const dot =
    state === 'active'
      ? 'wx-status__dot--active'
      : state === 'processing'
        ? 'wx-status__dot--processing'
        : state === 'warning'
          ? 'wx-status__dot--warning'
          : state === 'error'
            ? 'wx-status__dot--error'
            : ''
  return (
    <span className="wx-status">
      <span className={cx('wx-status__dot', dot)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? '?'
  const second = parts.length > 1 ? (parts[1]?.[0] ?? '') : ''
  return `${first}${second}`.toUpperCase()
}

export function Avatar({
  name,
  size = 'md',
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
}): React.JSX.Element {
  return (
    <span
      className={cx(
        'wx-avatar',
        size === 'sm' && 'wx-avatar--sm',
        size === 'lg' && 'wx-avatar--lg'
      )}
      role="img"
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </span>
  )
}

export function DataList({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return <ul className={cx('wx-list', className)}>{children}</ul>
}

export function KeyValue({
  items,
}: {
  items: Array<{ key: string; value: ReactNode }>
}): React.JSX.Element {
  return (
    <dl className="wx-kv">
      {items.map(item => (
        <div key={item.key} style={{ display: 'contents' }}>
          <dt>{item.key}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}): React.JSX.Element {
  return (
    <div>
      <p className="wx-metric__label">{label}</p>
      <p className="wx-metric__value">{value}</p>
      {hint && <p className="wx-caption">{hint}</p>}
    </div>
  )
}
