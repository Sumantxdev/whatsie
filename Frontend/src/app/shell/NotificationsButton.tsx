import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Badge } from '@/design-system/components/data'
import { Icon } from '@/design-system/components/icons'
import { IconButton } from '@/design-system/components/buttons'
import { Popover } from '@/design-system/components/overlays'
import { mockNotifications } from '../mock'

/* Notification trigger + panel foundation. Mock list; backend wires later. */

export function NotificationsButton(): React.JSX.Element {
  const [readAll, setReadAll] = useState(false)
  const unread = readAll ? 0 : mockNotifications.length

  return (
    <Popover
      label="Notifications"
      trigger={
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IconButton label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}>
            <Icon icon={Bell} size="sm" />
          </IconButton>
          {unread > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                minWidth: 18,
                height: 18,
                borderRadius: 999,
                background: 'var(--danger-text)',
                color: 'var(--surface)',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
              }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
      }
    >
      <div style={{ width: 360, maxWidth: 'calc(100vw - 32px)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
          }}
        >
          <p className="wx-label">Notifications</p>
          <button type="button" className="wx-link-btn wx-body-sm" onClick={() => setReadAll(true)}>
            Mark all read
          </button>
        </div>
        {mockNotifications.length === 0 ? (
          <p className="wx-body-sm" style={{ padding: '12px' }}>
            You’re caught up. No notifications.
          </p>
        ) : (
          <ul className="wx-list" style={{ maxHeight: 320, overflow: 'auto' }}>
            {mockNotifications.map(n => (
              <li key={n.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                <Badge
                  tone={
                    n.severity === 'critical'
                      ? 'danger'
                      : n.severity === 'warning'
                        ? 'warning'
                        : 'info'
                  }
                >
                  {n.severity}
                </Badge>
                <span>
                  <span className="wx-label" style={{ display: 'block' }}>
                    {n.title}
                  </span>
                  <span className="wx-body-sm">{n.body}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Popover>
  )
}
