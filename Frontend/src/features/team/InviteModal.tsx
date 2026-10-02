import { useId, useState } from 'react'
import { Button } from '@/design-system/components/buttons'
import { Modal } from '@/design-system/components/overlays'
import type { Role } from './types'
import { ROLE_META } from './types'

/* Invite flow: email + role → validation (format, member, pending) → review
   step implied inline → send. Mock only — states clearly that no email ships. */

export function InviteModal({
  onClose,
  onSend,
}: {
  onClose: () => void
  onSend: (email: string, role: Role) => { ok: boolean; error?: string }
}): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('agent')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [sent, setSent] = useState(false)
  const baseId = useId()

  return (
    <Modal
      title={sent ? 'Invitation sent (mock)' : 'Invite member'}
      onClose={onClose}
      footer={
        sent ? (
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const res = onSend(email, role)
                if (!res.ok) {
                  setError(res.error)
                  return
                }
                setError(undefined)
                setSent(true)
              }}
            >
              Send invitation
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="wx-body">
            <strong>{email.trim().toLowerCase()}</strong> was invited as{' '}
            <strong>{ROLE_META[role].label}</strong>.
          </p>
          <p className="wx-caption">
            Mock — no email was actually delivered. The invite appears below as Pending.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${baseId}-email`}>
              Email address *
            </label>
            <input
              id={`${baseId}-email`}
              type="email"
              className="wx-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              autoComplete="off"
              aria-invalid={error !== undefined || undefined}
            />
          </div>
          <fieldset
            style={{
              border: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <legend className="wx-field__label">Role *</legend>
            {(Object.keys(ROLE_META) as Role[]).map(r => (
              <label
                key={r}
                className="wx-check-row"
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                }}
              >
                <input
                  type="radio"
                  name="invite-role"
                  checked={role === r}
                  onChange={() => setRole(r)}
                />
                <span>
                  <span className="wx-label">
                    {ROLE_META[r].label} — {ROLE_META[r].summary}
                  </span>
                  <span className="wx-caption" style={{ display: 'block' }}>
                    {ROLE_META[r].description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${baseId}-msg`}>
              Personal message (optional)
            </label>
            <textarea
              id={`${baseId}-msg`}
              className="wx-textarea"
              rows={2}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Join us on Whatsie…"
            />
          </div>
          {error && (
            <p role="alert" className="wx-field__error">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
