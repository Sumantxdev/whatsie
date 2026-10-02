import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from '../utils'

/* Top-nav primitives only. Final assembly happens in the app shell stage. */

export function NavItem({
  to,
  active = false,
  children,
}: {
  to: string
  active?: boolean
  children: ReactNode
}): React.JSX.Element {
  return (
    <Link to={to} aria-current={active ? 'page' : undefined} className="wx-nav-item">
      {children}
    </Link>
  )
}

export function NavActionButton({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }): React.JSX.Element {
  return (
    <button type="button" className={cx('wx-nav-item', className)} {...rest}>
      {children}
    </button>
  )
}

export function NavGroup({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} role="group">
      {children}
    </div>
  )
}
