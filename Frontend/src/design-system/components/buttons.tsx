import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../utils'
import '../primitives.css'

/* Single button API. Variant + size only; no competing styles. */

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'destructive-solid'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: 'wx-btn--primary',
  secondary: 'wx-btn--secondary',
  ghost: 'wx-btn--ghost',
  destructive: 'wx-btn--destructive',
  'destructive-solid': 'wx-btn--destructive-solid',
}

export function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cx(
        'wx-btn',
        variantClass[variant],
        size === 'sm' && 'wx-btn--sm',
        size === 'md' && 'wx-btn--md',
        loading && 'wx-btn--loading',
        className
      )}
      {...rest}
    >
      {loading && <span className="wx-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  bordered = false,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  bordered?: boolean
  children: ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx('wx-icon-btn', bordered && 'wx-icon-btn--bordered', className)}
      {...rest}
    >
      {children}
    </button>
  )
}

export function LinkButton({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }): React.JSX.Element {
  return (
    <button type="button" className={cx('wx-link-btn', className)} {...rest}>
      {children}
    </button>
  )
}
