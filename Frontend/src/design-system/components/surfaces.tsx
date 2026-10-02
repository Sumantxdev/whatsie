import type { ReactNode } from 'react'
import { cx } from '../utils'

/* Spacious surfaces. Prefer Section/Container; Card only for grouped actions. */

export function Container({
  wide = false,
  children,
  className,
}: {
  wide?: boolean
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={cx('wx-container', wide && 'wx-container--wide', className)}>{children}</div>
  )
}

export function Card({
  padding = 'default',
  children,
  className,
}: {
  padding?: 'compact' | 'default' | 'spacious'
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <section
      className={cx(
        'wx-card',
        padding === 'compact' && 'wx-card--compact',
        padding === 'spacious' && 'wx-card--spacious',
        className
      )}
    >
      {children}
    </section>
  )
}

export function Section({
  children,
  className,
  labelledBy,
}: {
  children: ReactNode
  className?: string
  labelledBy?: string
}): React.JSX.Element {
  return (
    <section aria-labelledby={labelledBy} className={cx('wx-section', className)}>
      {children}
    </section>
  )
}

export function Divider({ className }: { className?: string }): React.JSX.Element {
  return <hr className={cx('wx-divider', className)} />
}
