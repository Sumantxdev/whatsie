import type { ReactNode } from 'react'
import { cx } from '../utils'

/* Refined type scale. `as` keeps semantics; class keeps visual hierarchy. */

type TextProps = {
  as?: 'p' | 'span' | 'div'
  children: ReactNode
  className?: string
}

function text(className: string) {
  return function Text({ as = 'p', children, className: extra }: TextProps): React.JSX.Element {
    const Tag = as
    return <Tag className={cx(className, extra)}>{children}</Tag>
  }
}

export const Display = text('wx-display')
export const BodyLarge = text('wx-body-lg')
export const Body = text('wx-body')
export const BodySmall = text('wx-body-sm')
export const Caption = text('wx-caption')
