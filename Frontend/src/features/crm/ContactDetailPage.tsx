import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Avatar, Badge, KeyValue } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog, Popover } from '@/design-system/components/overlays'
import { CRM_ME, crmTeam } from './mock'
import { SourceBadge, StageBadge } from './stageUi'
import type { Stage } from './types'
import { STAGE_ORDER } from './types'
import { useCrmData } from './useCrmData'
import './Crm.css'

/* Lead detail = lifecycle view of the same contact record. Sections stay
   independent: activity/conversation failures never blank identity. */

export function ContactDetailPage(): React.JSX.Element {
  const { contactId } = useParams()
  const navigate = useNavigate()
  const data = useCrmData(contactId)
  const {
    listStatus,
    record,
    detailNotFound,
    activityFailed,
    savingNote,
    addNote,
    addTag,
    removeTag,
    setStage,
    setAssignee,
    deleteRecord,
    reload,
  } = data
  const [noteDraft, setNoteDraft] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (listStatus === 'loading') {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        role="status"
        aria-label="Loading contact"
      >
        <Skeleton height={38} width="40%" />
        <Skeleton height={120} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (detailNotFound || !record) {
    return (
      <EmptyState
        title="Contact not found"
        body="It may have been deleted or belong to another workspace."
        action={
          <Link to="/contacts" className="wx-btn wx-btn--secondary wx-btn--md">
            Back to Contacts
          </Link>
        }
      />
    )
  }

  return (
    <section
      aria-labelledby="contact-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      <PageHeader
        title={record.name}
        description={`${record.phone}${record.email ? ` · ${record.email}` : ''} · via ${record.channel}`}
        breadcrumbs={[{ label: 'Contacts', to: '/contacts' }, { label: record.name }]}
        primaryAction={
          record.conversations.length > 0 && record.conversations[0]?.inboxId ? (
            <Link
              to={`/inbox/${record.conversations[0].inboxId}`}
              className="wx-btn wx-btn--primary wx-btn--md"
            >
              Open conversation
            </Link>
          ) : (
            <Link to="/inbox" className="wx-btn wx-btn--primary wx-btn--md">
              Open Inbox
            </Link>
          )
        }
        secondaryActions={
          <Button variant="destructive" size="md" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Avatar name={record.name} size="lg" />
        <label className="wx-body-sm">
          Stage
          <select
            className="wx-select"
            value={record.stage}
            onChange={e => setStage(e.target.value as Stage)}
            aria-label={`Change ${record.name} stage`}
            style={{ marginLeft: 8, minHeight: 36 }}
          >
            {STAGE_ORDER.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <StageBadge stage={record.stage} />
        <Popover
          label="Change assignment"
          trigger={
            <button type="button" className="wx-btn wx-btn--secondary wx-btn--sm">
              Assigned: {record.assignedTo ?? 'Unassigned'}
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
            <button
              type="button"
              className="wx-list__row wx-body-sm"
              onClick={() => setAssignee(null)}
            >
              Unassigned
            </button>
            {crmTeam.map(t => (
              <button
                key={t}
                type="button"
                className="wx-list__row wx-body-sm"
                onClick={() => setAssignee(t)}
              >
                {t}
                {t === CRM_ME ? ' (you)' : ''}
              </button>
            ))}
          </div>
        </Popover>
      </div>

      <div className="crm-detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <section aria-labelledby="d-info">
            <h2 id="d-info" className="wx-h2" style={{ marginBottom: 8 }}>
              Contact information
            </h2>
            <KeyValue
              items={[
                { key: 'Phone', value: record.phone },
                { key: 'Email', value: record.email ?? '—' },
                { key: 'Channel', value: <Badge tone="neutral">{record.channel}</Badge> },
                { key: 'Last activity', value: record.lastActivity },
              ]}
            />
            {record.customFields.length > 0 && (
              <>
                <h3 className="wx-h4" style={{ margin: '12px 0 8px' }}>
                  Custom fields
                </h3>
                <KeyValue items={record.customFields.map(f => ({ key: f.key, value: f.value }))} />
              </>
            )}
            <h3 className="wx-h4" style={{ margin: '12px 0 8px' }}>
              Tags
            </h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {record.tags.length === 0 && <span className="wx-caption">No tags.</span>}
              {record.tags.map(t => (
                <span key={t} className="wx-badge wx-badge--neutral">
                  #{t}
                  <button
                    type="button"
                    className="wx-link-btn wx-body-sm"
                    onClick={() => removeTag(t)}
                    aria-label={`Remove tag ${t}`}
                    style={{ marginLeft: 4 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form
              onSubmit={e => {
                e.preventDefault()
                addTag(tagDraft)
                setTagDraft('')
              }}
              style={{ display: 'flex', gap: 8, marginTop: 8 }}
            >
              <input
                className="wx-input"
                style={{ minHeight: 36, maxWidth: 200 }}
                placeholder="Add tag…"
                value={tagDraft}
                onChange={e => setTagDraft(e.target.value)}
                aria-label="Add tag"
              />
              <Button variant="secondary" size="md" type="submit" disabled={tagDraft.trim() === ''}>
                Add
              </Button>
            </form>
          </section>

          <section aria-labelledby="d-notes">
            <h2 id="d-notes" className="wx-h2" style={{ marginBottom: 8 }}>
              Notes · {record.notes.length}
            </h2>
            <form
              onSubmit={e => {
                e.preventDefault()
                addNote(noteDraft)
                setNoteDraft('')
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}
            >
              <label htmlFor="crm-note" className="wx-caption">
                Add a note as {CRM_ME}
              </label>
              <textarea
                id="crm-note"
                className="wx-textarea"
                rows={2}
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                placeholder="Context for the next agent…"
              />
              <div>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={savingNote}
                  disabled={noteDraft.trim() === '' || savingNote}
                >
                  Save note
                </Button>
              </div>
            </form>
            {record.notes.length === 0 ? (
              <p className="wx-caption">
                No notes yet. Notes are visible to the whole workspace team.
              </p>
            ) : (
              <ul className="wx-list">
                {record.notes.map(n => (
                  <li
                    key={n.id}
                    className="wx-list__row"
                    style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 2 }}
                  >
                    <span className="wx-body">{n.text}</span>
                    <span className="wx-caption">
                      {n.author} · {n.time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <section aria-labelledby="d-activity">
            <h2 id="d-activity" className="wx-h2" style={{ marginBottom: 8 }}>
              Activity
            </h2>
            {activityFailed ? (
              <ErrorState
                title="Activity failed to load"
                body="Identity, notes, and conversations above are unaffected."
                onRetry={reload}
                requestId="crm-activity"
              />
            ) : record.activity.length === 0 ? (
              <p className="wx-caption">No activity yet.</p>
            ) : (
              <ul className="wx-list">
                {record.activity.map(a => (
                  <li key={a.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                    <SourceBadge source={a.source} />
                    <span style={{ flex: 1 }}>
                      <span className="wx-body-sm" style={{ display: 'block' }}>
                        {a.text}
                      </span>
                      <span className="wx-caption">
                        {a.actor} · {a.time}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="d-convos">
            <h2 id="d-convos" className="wx-h2" style={{ marginBottom: 8 }}>
              Conversations · {record.conversations.length}
            </h2>
            {record.conversations.length === 0 ? (
              <p className="wx-caption">
                No conversations yet. New messages from this contact will appear here and in Inbox.
              </p>
            ) : (
              <ul className="wx-list">
                {record.conversations.map((c, i) => (
                  <li key={`${c.inboxId ?? 'none'}-${i}`} className="wx-list__row">
                    <Badge tone="neutral">{c.platform}</Badge>
                    <span style={{ flex: 1 }}>
                      <span className="wx-body-sm" style={{ display: 'block' }}>
                        {c.preview}
                      </span>
                      <span className="wx-caption">{c.time}</span>
                    </span>
                    {c.inboxId ? (
                      <Link
                        to={`/inbox/${c.inboxId}`}
                        className="wx-link-btn wx-body-sm"
                        aria-label={`Open conversation: ${c.preview}`}
                      >
                        Open →
                      </Link>
                    ) : (
                      <Link to="/inbox" className="wx-link-btn wx-body-sm">
                        Inbox →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {deleteOpen && (
        <ConfirmDialog
          title={`Delete ${record.name}?`}
          body="Notes, tags, and activity are removed. Inbox conversations are kept. This cannot be undone."
          confirmLabel="Delete contact"
          danger
          onConfirm={() => {
            deleteRecord()
            navigate('/contacts')
          }}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </section>
  )
}
