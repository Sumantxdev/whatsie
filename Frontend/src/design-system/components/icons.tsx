import type { LucideIcon } from 'lucide-react'
import { cx } from '../utils'
import { iconSizes } from './iconSizes'
import type { IconSize } from './iconSizes'

/* Consistent icon wrapper: fixed sizes, currentColor, accessible by default (hidden). */

export function Icon({
  icon: LucideIconComponent,
  size = 'sm',
  label,
  className,
}: {
  icon: LucideIcon
  size?: IconSize
  label?: string
  className?: string
}): React.JSX.Element {
  const px = iconSizes[size]
  if (label) {
    return (
      <LucideIconComponent
        width={px}
        height={px}
        strokeWidth={2}
        role="img"
        aria-label={label}
        className={cx(className)}
      />
    )
  }
  return (
    <LucideIconComponent
      width={px}
      height={px}
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
      className={cx(className)}
    />
  )
}
