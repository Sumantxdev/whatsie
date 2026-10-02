import { useId } from 'react'
import { cx } from '../utils'

/* Horizontal tabs for contextual nav + page tabs. Arrow-key navigable. */

export interface TabItem {
  id: string
  label: string
  disabled?: boolean
}

export function Tabs({
  items,
  activeId,
  onChange,
  label,
}: {
  items: TabItem[]
  activeId: string
  onChange: (id: string) => void
  label: string
}): React.JSX.Element {
  const listId = useId()
  return (
    <div role="tablist" aria-label={label} id={listId} className="wx-tabs">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === activeId}
          aria-controls={`${listId}-${item.id}`}
          disabled={item.disabled}
          tabIndex={item.id === activeId ? 0 : -1}
          onClick={() => onChange(item.id)}
          onKeyDown={e => {
            const enabled = items.filter(i => !i.disabled)
            const current = enabled.findIndex(i => i.id === activeId)
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault()
              const dir = e.key === 'ArrowRight' ? 1 : -1
              const next = enabled[(current + dir + enabled.length) % enabled.length]
              if (next) onChange(next.id)
            }
            if (e.key === 'Home' || e.key === 'End') {
              e.preventDefault()
              const target = e.key === 'Home' ? enabled[0] : enabled[enabled.length - 1]
              if (target) onChange(target.id)
            }
          }}
          className={cx('wx-tab')}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
