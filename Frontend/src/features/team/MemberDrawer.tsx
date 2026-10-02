import { useState } from 'react'
import { Avatar, KeyValue } from '@/design-system/components/data'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog, Drawer } from '@/design-system/components/overlays'
import type { Member, Role } from './types'
import { ROLE_META } from './types'
import { MemberStatusBadge, RoleBadge } from './teamUi'

/* Member detail drawer: identity, role change (guarded), removal (guarded).
   Destructive actions always confirm; guards surface as messages, not traps. */

export function MemberDrawer({
  member,
  canManage,
  isLastAdmin,
  onChangeRole,
  onRemove,
  onClose,
}: {
  member: Member
  canManage: boolean
  isLastAdmin: boolean
  onChangeRole: (id: string, role: Role) => { ok: boolean; error?: string }
  onRemove: (id: string) => { ok: boolean; error?: string }
  onClose: () => void
}): React.JSX.Element {
  const [roleDraft, setRoleDraft] = useState<Role>(member.role)
  const [confirmRole, setConfirmRole] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [notice, setNotice] = useState<string | undefined>()

  return (
    <>
      <Drawer title={member.name} onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar name={member.name} size="lg" />
            <div>
              <p className="wx-body-sm">{member.email}</p>
              <p style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <RoleBadge role={member.role} />
                <MemberStatusBadge status={member.status} />
                {member.isYou && <span className="wx-badge wx-badge--accent">You</span>}
              </p>
            </div>
          </div>
          <KeyValue
            items={[
              { key: 'Joined', value: member.joined },
              { key: 'Last active', value: member.lastActive },
            ]}
          />
          <div>
            <p className="wx-field__label" style={{ marginBottom: 8 }}>
              Role
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <select
                className="wx-select"
                value={roleDraft}
                onChange={e => setRoleDraft(e.target.value as Role)}
                disabled={!canManage || member.isYou}
                aria-label={`Role for ${member.name}`}
                title={
                  !canManage
                    ? 'Requires Admin (mock preview)'
                    : member.isYou
                      ? 'You cannot change your own role'
                      : undefined
                }
                style={{ minWidth: 160 }}
              >
                {(Object.keys(ROLE_META) as Role[]).map(r => (
                  <option key={r} value={r}>
                    {ROLE_META[r].label}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="md"
                disabled={!canManage || member.isYou || roleDraft === member.role}
                title={!canManage ? 'Requires Admin (mock preview)' : undefined}
                onClick={() => setConfirmRole(true)}
              >
                Change role
              </Button>
            </div>
            {member.isYou && (
              <p className="wx-caption" style={{ marginTop: 4 }}>
                You cannot change your own role.
              </p>
            )}
            {isLastAdmin && member.role === 'admin' && (
              <p className="wx-caption" style={{ marginTop: 4 }}>
                Last Admin — promote someone before demoting or removing.
              </p>
            )}
          </div>
          {!member.isYou && (
            <div>
              <p className="wx-field__label" style={{ marginBottom: 8 }}>
                Danger zone
              </p>
              <Button
                variant="destructive"
                size="md"
                disabled={!canManage}
                title={!canManage ? 'Requires Admin (mock preview)' : undefined}
                onClick={() => setConfirmRemove(true)}
              >
                Remove member
              </Button>
            </div>
          )}
          {notice && (
            <p role="status" className="wx-body-sm">
              {notice}
            </p>
          )}
        </div>
      </Drawer>

      {confirmRole && (
        <ConfirmDialog
          title={`Change ${member.name} to ${ROLE_META[roleDraft].label}?`}
          body={`They will move from ${ROLE_META[member.role].label} to ${ROLE_META[roleDraft].label}: ${ROLE_META[roleDraft].description}`}
          confirmLabel="Change role"
          onConfirm={() => {
            const res = onChangeRole(member.id, roleDraft)
            setConfirmRole(false)
            if (!res.ok) setNotice(res.error)
            else {
              setNotice(`Role changed to ${ROLE_META[roleDraft].label}.`)
              onClose()
            }
          }}
          onCancel={() => setConfirmRole(false)}
        />
      )}
      {confirmRemove && (
        <ConfirmDialog
          title={`Remove ${member.name}?`}
          body={`${member.name} (${member.email}) will lose workspace access immediately. Their past activity stays in the audit log.`}
          confirmLabel="Remove member"
          danger
          onConfirm={() => {
            const res = onRemove(member.id)
            setConfirmRemove(false)
            if (!res.ok) setNotice(res.error)
            else onClose()
          }}
          onCancel={() => setConfirmRemove(false)}
        />
      )}
    </>
  )
}
