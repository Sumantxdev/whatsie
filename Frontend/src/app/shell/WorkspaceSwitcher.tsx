import { useState } from 'react'
import { ArrowLeftRight, Check } from 'lucide-react'
import { Badge } from '@/design-system/components/data'
import { Icon } from '@/design-system/components/icons'
import { Popover } from '@/design-system/components/overlays'
import type { Workspace } from '@/types/domain'
import { mockActiveWorkspaceId, mockWorkspaces, workspaceStatusLabel } from '../mock'

/* Workspace identity + switching foundation. Mock-backed; API replaces later. */

export function WorkspaceSwitcher(): React.JSX.Element {
  const [activeId, setActiveId] = useState(mockActiveWorkspaceId)
  const active: Workspace | undefined = mockWorkspaces.find(w => w.id === activeId)

  return (
    <Popover
      label="Switch workspace"
      trigger={
        <button
          type="button"
          className="wx-icon-btn wx-icon-btn--bordered"
          style={{ width: 'auto', padding: '0 12px', gap: 8 }}
          aria-label={`Current workspace: ${active?.name ?? 'none'}`}
        >
          <span
            className="wx-label"
            style={{
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {active?.name ?? 'Select workspace'}
          </span>
          <Badge tone={active?.status === 'active' ? 'success' : 'warning'}>
            {workspaceStatusLabel(active?.status ?? 'active')}
          </Badge>
          <Icon icon={ArrowLeftRight} size="xs" />
        </button>
      }
    >
      <div role="listbox" aria-label="Workspaces" style={{ minWidth: 280 }}>
        {mockWorkspaces.length === 0 && <p className="wx-body-sm">No workspaces.</p>}
        {mockWorkspaces.map(ws => {
          const selected = ws.id === activeId
          return (
            <button
              key={ws.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => setActiveId(ws.id)}
              className="wx-list__row"
              style={{
                width: '100%',
                border: 'none',
                background: selected ? 'var(--surface-hover)' : 'transparent',
                textAlign: 'left',
              }}
            >
              <span style={{ flex: 1 }}>
                <span className="wx-label" style={{ display: 'block' }}>
                  {ws.name}
                </span>
                <span className="wx-caption">
                  {ws.plan} · {workspaceStatusLabel(ws.status)}
                </span>
              </span>
              {selected && <Icon icon={Check} size="sm" />}
            </button>
          )
        })}
      </div>
    </Popover>
  )
}
