import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import { Icon } from '@/design-system/components/icons'
import { IconButton } from '@/design-system/components/buttons'

/* Search entry + palette shell. No real search yet — grouped empty UI + keyboard. */

export function SearchTrigger({ onOpen }: { onOpen: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open global search"
      className="wx-icon-btn wx-icon-btn--bordered"
      style={{ width: 'auto', padding: '0 12px', gap: 8, display: 'inline-flex' }}
    >
      <Icon icon={Search} size="sm" />
      <span className="wx-body-sm" style={{ color: 'var(--text-muted)' }}>
        Search
      </span>
      <kbd
        className="wx-mono wx-caption"
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: 6,
          padding: '1px 6px',
        }}
      >
        ⌘K
      </kbd>
    </button>
  )
}

export function SearchTriggerCompact({ onOpen }: { onOpen: () => void }): React.JSX.Element {
  return (
    <IconButton label="Open global search" onClick={onOpen} bordered>
      <Icon icon={Search} size="sm" />
    </IconButton>
  )
}

export function SearchPalette({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [query, setQuery] = useState('')
  const searchableGroups = [
    'Conversations',
    'Contacts / Leads',
    'AI agents',
    'Workflows',
    'Channels',
    'Team members',
  ]
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <>
      <div className="wx-backdrop wx-backdrop--modal" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        className="wx-modal wx-modal--wide"
        style={{ top: '20%', transform: 'translate(-50%, 0)', padding: 0, overflow: 'hidden' }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conversations, leads, agents, workflows…"
            aria-label="Search Whatsie"
            className="wx-input"
            style={{ border: 'none', boxShadow: 'none', padding: 0, minHeight: 48, fontSize: 16 }}
          />
        </div>
        <div style={{ padding: 16, maxHeight: 320, overflow: 'auto' }}>
          {query.trim() === '' ? (
            <div>
              <p className="wx-caption">RECENT — none yet</p>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchableGroups.map(g => (
                  <p key={g} className="wx-body-sm">
                    {g} <span className="wx-caption">— search lands here</span>
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div role="status">
              <p className="wx-body">No results for “{query.trim()}”.</p>
              <p className="wx-caption">Search backend lands later. Try a name, phone, or ID.</p>
            </div>
          )}
        </div>
        <div
          className="wx-caption"
          style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)' }}
        >
          ↑↓ navigate · Enter open · Esc close
        </div>
      </div>
    </>,
    document.body
  )
}
