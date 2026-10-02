import { useState } from 'react'
import { PageHeader } from '@/app/shell/PageHeader'
import { Avatar, Badge, Metric } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog, Drawer } from '@/design-system/components/overlays'
import { Tabs } from '@/design-system/components/tabs'
import { matrixMock } from './mock'
import type { AuditEvent, Member, Role } from './types'
import { ROLE_META } from './types'
import { InviteModal } from './InviteModal'
import { MemberDrawer } from './MemberDrawer'
import { InviteStatusBadge, MemberStatusBadge, RoleBadge } from './teamUi'
import { useTeamData } from './useTeamData'
import './Team.css'

/* Team: members, invitations, role matrix, audit. In-page tabs (no new routes).
   viewAs switcher is a clearly-labelled mock preview of role-aware UI. */

const TABS = [
  { id: 'members', label: 'Members' },
  { id: 'invitations', label: 'Invitations' },
  { id: 'roles', label: 'Roles & permissions' },
  { id: 'activity', label: 'Activity' },
]

export function TeamPage(): React.JSX.Element {
  const data = useTeamData()
  const [tab, setTab] = useState('members')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [event, setEvent] = useState<AuditEvent | null>(null)
  const {
    status,
    failedSections,
    searching,
    query,
    setQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    resetFilters,
    members,
    totalMembers,
    activeCount,
    pendingCount,
    invitations,
    audit,
    viewAs,
    setViewAs,
    canManage,
    reload,
  } = data

  const selected: Member | null = memberId
    ? (data.allMembers.find(m => m.id === memberId) ?? null)
    : null
  const filtersActive = query !== '' || roleFilter !== 'all' || statusFilter !== 'all'

  return (
    <section
      aria-labelledby="tm-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title="Team"
        description="Manage workspace members and access. Authorization is enforced by the backend; this UI only previews it."
        primaryAction={
          <Button
            variant="primary"
            size="md"
            onClick={() => setInviteOpen(true)}
            disabled={!canManage}
            title={!canManage ? 'Requires Admin (mock preview)' : undefined}
          >
            Invite Member
          </Button>
        }
      />

      <div className="tm-viewas" role="group" aria-label="Preview as role (mock)">
        <span className="wx-body-sm">
          <strong>Preview as</strong> (mock — switches visible permissions):
        </span>
        {(Object.keys(ROLE_META) as Role[]).map(r => (
          <button
            key={r}
            type="button"
            className="wx-btn wx-btn--sm"
            aria-pressed={viewAs === r}
            onClick={() => setViewAs(r)}
            style={
              viewAs === r
                ? {
                    background: 'var(--accent-primary)',
                    color: 'var(--surface)',
                    borderColor: 'transparent',
                  }
                : { background: 'var(--surface)' }
            }
          >
            {ROLE_META[r].label}
          </button>
        ))}
        {!canManage && (
          <span className="wx-caption">Management actions are disabled for this role.</span>
        )}
      </div>

      {status === 'loading' || searching ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          role="status"
          aria-label="Loading team"
        >
          <Skeleton height={90} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      ) : status === 'error' ? (
        <ErrorState
          title="Team failed to load"
          body="Retry to reload members, invitations, and activity."
          onRetry={reload}
          requestId="tm-all"
        />
      ) : (
        <>
          <div className="tm-stats" role="group" aria-label="Team summary">
            <div className="tm-stat">
              <Metric label="Members" value={String(totalMembers)} />
            </div>
            <div className="tm-stat">
              <Metric label="Active" value={String(activeCount)} />
            </div>
            <div className="tm-stat">
              <Metric
                label="Pending"
                value={String(pendingCount)}
                hint="Invites + invited members"
              />
            </div>
          </div>

          <Tabs items={TABS} activeId={tab} label="Team sections" onChange={setTab} />

          {tab === 'members' && (
            <>
              <div className="tm-toolbar" role="search">
                <input
                  type="search"
                  className="wx-input tm-search"
                  placeholder="Search name or email…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label="Search members"
                />
                <label className="wx-caption">
                  Role
                  <select
                    className="wx-select"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value as Role | 'all')}
                    aria-label="Filter by role"
                  >
                    <option value="all">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </label>
                <label className="wx-caption">
                  Status
                  <select
                    className="wx-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'invited')}
                    aria-label="Filter by status"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                  </select>
                </label>
                {filtersActive && (
                  <button type="button" className="wx-link-btn wx-body-sm" onClick={resetFilters}>
                    Clear all
                  </button>
                )}
              </div>
              <p className="wx-caption" role="status" aria-live="polite">
                {`${members.length} of ${totalMembers} members`}
                {searching && ' · searching…'}
              </p>
              {members.length === 0 && query === '' && !filtersActive ? (
                <EmptyState
                  title="No other members"
                  body="Invite teammates so conversations, leads, and reviews don't bottleneck on one person."
                  action={
                    canManage ? (
                      <Button variant="primary" size="md" onClick={() => setInviteOpen(true)}>
                        Invite Member
                      </Button>
                    ) : undefined
                  }
                />
              ) : members.length === 0 ? (
                <EmptyState
                  title={
                    query !== '' ? `No results for “${query}”` : 'No members match these filters'
                  }
                  body="Try another term or clear the filters."
                  action={
                    <Button variant="secondary" size="md" onClick={resetFilters}>
                      Clear search & filters
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="wx-table-wrap tm-tablewrap">
                    <table className="wx-table">
                      <caption
                        className="wx-caption"
                        style={{ textAlign: 'left', padding: '8px 16px' }}
                      >
                        Workspace members and access.
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Member</th>
                          <th scope="col">Role</th>
                          <th scope="col">Status</th>
                          <th scope="col">Joined</th>
                          <th scope="col">Last active</th>
                          <th scope="col">
                            <span
                              style={{
                                position: 'absolute',
                                width: 1,
                                height: 1,
                                overflow: 'hidden',
                                clip: 'rect(0 0 0 0)',
                              }}
                            >
                              Actions
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map(m => (
                          <tr key={m.id}>
                            <td>
                              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Avatar name={m.name} size="sm" />
                                <span>
                                  <button
                                    type="button"
                                    className="wx-link-btn wx-body"
                                    style={{ fontWeight: 600 }}
                                    onClick={() => setMemberId(m.id)}
                                    aria-label={`Open ${m.name}`}
                                  >
                                    {m.name}
                                    {m.isYou ? ' (you)' : ''}
                                  </button>
                                  <span className="wx-caption" style={{ display: 'block' }}>
                                    {m.email}
                                  </span>
                                </span>
                              </span>
                            </td>
                            <td>
                              <RoleBadge role={m.role} />
                            </td>
                            <td>
                              <MemberStatusBadge status={m.status} />
                            </td>
                            <td className="wx-body-sm">{m.joined}</td>
                            <td className="wx-body-sm">{m.lastActive}</td>
                            <td>
                              <button
                                type="button"
                                className="wx-link-btn wx-body-sm"
                                onClick={() => setMemberId(m.id)}
                                aria-label={`Manage ${m.name}`}
                              >
                                Manage →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="tm-cards">
                    {members.map(m => (
                      <li key={m.id} className="tm-card">
                        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Avatar name={m.name} size="sm" />
                          <button
                            type="button"
                            className="wx-link-btn wx-body"
                            style={{ fontWeight: 600 }}
                            onClick={() => setMemberId(m.id)}
                          >
                            {m.name}
                            {m.isYou ? ' (you)' : ''}
                          </button>
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            gap: 6,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          <RoleBadge role={m.role} />
                          <MemberStatusBadge status={m.status} />
                          <span className="wx-caption">{m.email}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {tab === 'invitations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {invitations.filter(i => i.status === 'pending').length === 0 &&
                invitations.length > 0 && (
                  <p className="wx-caption">
                    No pending invitations right now — past invites are listed below.
                  </p>
                )}
              {invitations.length === 0 ? (
                <EmptyState
                  title="No invitations"
                  body="Invite history will appear here once someone is invited."
                  action={
                    canManage ? (
                      <Button variant="primary" size="md" onClick={() => setInviteOpen(true)}>
                        Invite Member
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="wx-list">
                  {invitations.map(i => (
                    <li key={i.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                      <InviteStatusBadge status={i.status} />
                      <span style={{ flex: 1 }}>
                        <span className="wx-body-sm" style={{ display: 'block', fontWeight: 600 }}>
                          {i.email}
                        </span>
                        <span className="wx-caption">
                          Invited as {ROLE_META[i.role].label} · sent {i.sent} ·{' '}
                          {i.status === 'pending' ? `expires ${i.expires}` : i.expires}
                        </span>
                      </span>
                      {i.status === 'pending' && (
                        <span style={{ display: 'flex', gap: 8 }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!canManage}
                            title={!canManage ? 'Requires Admin (mock preview)' : undefined}
                            onClick={() => data.resendInvite(i.id)}
                          >
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canManage}
                            title={!canManage ? 'Requires Admin (mock preview)' : undefined}
                            onClick={() => setCancelId(i.id)}
                          >
                            Cancel
                          </Button>
                        </span>
                      )}
                      {i.status === 'expired' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!canManage}
                          title={!canManage ? 'Requires Admin (mock preview)' : undefined}
                          onClick={() => data.resendInvite(i.id)}
                        >
                          Resend
                        </Button>
                      )}
                      {i.status === 'cancelled' && canManage && (
                        <Button variant="ghost" size="sm" onClick={() => setInviteOpen(true)}>
                          Invite again
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'roles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="wx-body-sm">
                High-level preview only — exact authorization is enforced by the backend, not this
                table.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(ROLE_META) as Role[]).map(r => (
                  <div key={r} className="tm-stat" style={{ minWidth: 200, flex: 1 }}>
                    <p className="wx-label">{ROLE_META[r].label}</p>
                    <p className="wx-caption">{ROLE_META[r].description}</p>
                  </div>
                ))}
              </div>
              <div className="wx-table-wrap">
                <table className="wx-table">
                  <caption
                    className="wx-caption"
                    style={{ textAlign: 'left', padding: '8px 16px' }}
                  >
                    Capability matrix: Full = manage, Limited = scoped use, — = no access.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Capability</th>
                      <th scope="col">Admin</th>
                      <th scope="col">Agent</th>
                      <th scope="col">Viewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixMock.map(row => (
                      <tr key={row.area}>
                        <td>
                          <span
                            className="wx-body-sm"
                            style={{ fontWeight: 600, display: 'block' }}
                          >
                            {row.area}
                          </span>
                          {row.note && <span className="wx-caption">{row.note}</span>}
                        </td>
                        {(Object.keys(ROLE_META) as Role[]).map(r => (
                          <td key={r}>
                            {row.levels[r] === 'full' ? (
                              <Badge tone="success">Full</Badge>
                            ) : row.levels[r] === 'limited' ? (
                              <Badge tone="warning">Limited</Badge>
                            ) : (
                              <span
                                className="wx-caption"
                                aria-label={`${ROLE_META[r].label}: no access`}
                              >
                                —
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {failedSections.includes('activity') ? (
                <ErrorState
                  title="Activity failed to load"
                  body="Members, invitations, and roles above are unaffected."
                  onRetry={reload}
                  requestId="tm-activity"
                />
              ) : audit.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  body="Invites, role changes, and removals will appear here."
                />
              ) : (
                <ul className="wx-list">
                  {audit.map(e => (
                    <li key={e.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                      <Badge tone="neutral">{e.action}</Badge>
                      <span style={{ flex: 1 }}>
                        <button
                          type="button"
                          className="wx-link-btn wx-body-sm"
                          style={{ fontWeight: 600, display: 'block', textAlign: 'left' }}
                          onClick={() => setEvent(e)}
                          aria-label={`Open event: ${e.action} on ${e.target}`}
                        >
                          {e.target}
                        </button>
                        <span className="wx-caption">
                          {e.actor} · {e.time}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onSend={(email, role) => data.inviteMember(email, role)}
        />
      )}
      {selected && (
        <MemberDrawer
          member={selected}
          canManage={canManage}
          isLastAdmin={
            data.allMembers.filter(m => m.role === 'admin' && m.status === 'active').length <= 1
          }
          onChangeRole={(id, role) => data.changeRole(id, role)}
          onRemove={id => data.removeMember(id)}
          onClose={() => setMemberId(null)}
        />
      )}
      {cancelId && (
        <ConfirmDialog
          title="Cancel this invitation?"
          body="The recipient will no longer be able to join from this invite. You can invite them again later."
          confirmLabel="Cancel invitation"
          danger
          onConfirm={() => {
            data.cancelInvite(cancelId)
            setCancelId(null)
          }}
          onCancel={() => setCancelId(null)}
        />
      )}
      {event && (
        <Drawer title={event.action} onClose={() => setEvent(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="wx-body">
              <strong>Target:</strong> {event.target}
            </p>
            <p className="wx-body-sm">
              <strong>Actor:</strong> {event.actor}
            </p>
            <p className="wx-caption">{event.time}</p>
            {event.detail && <p className="wx-body-sm">{event.detail}</p>}
            {event.prev !== undefined && event.next !== undefined && (
              <p className="wx-body-sm">
                <strong>Changed:</strong> {event.prev} → {event.next}
              </p>
            )}
          </div>
        </Drawer>
      )}
    </section>
  )
}
