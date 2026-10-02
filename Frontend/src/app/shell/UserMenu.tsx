import { Avatar } from '@/design-system/components/data'
import { Popover } from '@/design-system/components/overlays'
import { mockUser } from '../mock'

/* User menu foundation. Destinations only — no real auth actions yet. */

const destinations = ['Profile', 'Workspace settings', 'Help & docs', 'Keyboard shortcuts']

export function UserMenu(): React.JSX.Element {
  return (
    <Popover
      label="Account"
      trigger={
        <button
          type="button"
          aria-label={`Account: ${mockUser.name}, ${mockUser.role}`}
          className="wx-icon-btn"
          style={{ width: 'auto', height: 'auto', padding: 2 }}
        >
          <Avatar name={mockUser.name} />
        </button>
      }
    >
      <div style={{ minWidth: 260 }}>
        <div style={{ padding: '8px 12px' }}>
          <p className="wx-label">{mockUser.name}</p>
          <p className="wx-caption">
            {mockUser.email} · {mockUser.role}
          </p>
        </div>
        <hr className="wx-divider" style={{ margin: '4px 0' }} />
        <ul className="wx-list">
          {destinations.map(d => (
            <li key={d}>
              <button
                type="button"
                className="wx-list__row"
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                }}
              >
                <span className="wx-body">{d}</span>
              </button>
            </li>
          ))}
        </ul>
        <hr className="wx-divider" style={{ margin: '4px 0' }} />
        <button
          type="button"
          className="wx-list__row"
          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
        >
          <span className="wx-body">Log out</span>
        </button>
      </div>
    </Popover>
  )
}
