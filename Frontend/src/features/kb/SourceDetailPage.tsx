import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Badge, KeyValue } from '@/design-system/components/data'
import { EmptyState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog } from '@/design-system/components/overlays'
import { Tabs } from '@/design-system/components/tabs'
import { agentsMock } from '../ai/mock'
import { KbDocStateBadge, KbStatusBadge, KbTypeBadge } from './kbUi'
import { useKbData } from './useKbData'
import './Kb.css'

/* Source detail: overview, content, agent usage, activity, settings.
   Tabs reuse the established pattern; failures stay section-local. */

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'content', label: 'Content' },
  { id: 'usage', label: 'Usage' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
]

export function SourceDetailPage(): React.JSX.Element {
  const { sourceId } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = params.get('tab') ?? 'overview'
  const activeTab = TABS.some(t => t.id === tab) ? tab : 'overview'
  const data = useKbData(sourceId)
  const { source, detailNotFound, listStatus } = data
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [docQuery, setDocQuery] = useState('')
  const [tagDraft, setTagDraft] = useState('')

  if (listStatus === 'loading') {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        role="status"
        aria-label="Loading source"
      >
        <Skeleton height={38} width="40%" />
        <Skeleton height={120} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (detailNotFound || !source) {
    return (
      <EmptyState
        title="Source not found"
        body="It may have been deleted or belong to another workspace."
        action={
          <Link to="/ai?view=knowledge" className="wx-btn wx-btn--secondary wx-btn--md">
            Back to Knowledge
          </Link>
        }
      />
    )
  }

  const connected = agentsMock.filter(a => source.agentIds.includes(a.id))
  const available = agentsMock.filter(a => !source.agentIds.includes(a.id))
  const docs = source.docs.filter(d => {
    const q = docQuery.trim().toLowerCase()
    return q === '' || d.name.toLowerCase().includes(q)
  })

  return (
    <section
      aria-labelledby="kb-source-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title={source.title}
        description={source.description || 'No description.'}
        breadcrumbs={[
          { label: 'AI agents', to: '/ai' },
          { label: 'Knowledge', to: '/ai?view=knowledge' },
          { label: source.title },
        ]}
        primaryAction={
          source.status === 'failed' ? (
            <Button variant="primary" size="md" onClick={data.retryProcessing}>
              Retry processing
            </Button>
          ) : source.archived ? (
            <Button variant="primary" size="md" onClick={data.restoreSource}>
              Restore
            </Button>
          ) : undefined
        }
        secondaryActions={
          !source.archived ? (
            <Button variant="secondary" size="md" onClick={data.archiveSource}>
              Archive
            </Button>
          ) : undefined
        }
      />

      <div
        style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
        role="status"
        aria-label="Source status"
      >
        <KbStatusBadge status={source.status} />
        <KbTypeBadge type={source.type} />
        {source.archived && <Badge tone="neutral">Archived</Badge>}
        {data.dirty && <Badge tone="info">Unsaved changes</Badge>}
        {data.saving && <span className="wx-body-sm">Saving…</span>}
        {!data.saving && data.savedAt && !data.dirty && (
          <span className="wx-caption">Saved {data.savedAt}</span>
        )}
        {data.dirty && (
          <span style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={data.discardMeta}>
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={data.saveMeta} loading={data.saving}>
              Save changes
            </Button>
          </span>
        )}
      </div>

      {source.status === 'processing' && typeof source.progress === 'number' && (
        <div
          role="status"
          aria-label={`Processing ${source.progress} percent`}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <span className="wx-body-sm">
            Processing — chunking and embedding content. The source becomes usable when indexed.
          </span>
          <span className="kb-progress">
            <div style={{ width: `${source.progress}%` }} />
          </span>
        </div>
      )}
      {source.status === 'failed' && source.error && (
        <div
          role="alert"
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <strong className="wx-body-sm" style={{ color: 'var(--danger-text)' }}>
            Processing failed
          </strong>
          <span className="wx-body-sm" style={{ color: 'var(--danger-text)' }}>
            {source.error}
          </span>
          <span>
            <Button variant="secondary" size="sm" onClick={data.retryProcessing}>
              Retry processing
            </Button>
          </span>
        </div>
      )}

      <Tabs
        items={TABS}
        activeId={activeTab}
        label="Source sections"
        onChange={id => {
          const next = new URLSearchParams(params)
          next.set('tab', id)
          setParams(next, { preventScrollReset: true })
        }}
      />

      {activeTab === 'overview' && (
        <div className="kb-cols">
          <KeyValue
            items={[
              { key: 'Type', value: <KbTypeBadge type={source.type} /> },
              { key: 'Status', value: <KbStatusBadge status={source.status} /> },
              {
                key: 'Items',
                value: `${source.docs.length} ${source.docs.length === 1 ? 'item' : 'items'}`,
              },
              {
                key: 'Agents',
                value:
                  connected.length === 0
                    ? 'Not used by any agent'
                    : connected.map(a => a.name).join(', '),
              },
              { key: 'Updated', value: source.updated },
            ]}
          />
          <div>
            <h3 className="wx-h3">Tags</h3>
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginTop: 8,
                alignItems: 'center',
              }}
            >
              {source.tags.length === 0 && <span className="wx-caption">No tags.</span>}
              {source.tags.map(t => (
                <span key={t} className="wx-badge wx-badge--neutral">
                  #{t}
                  <button
                    type="button"
                    className="wx-link-btn wx-body-sm"
                    style={{ marginLeft: 4 }}
                    aria-label={`Remove tag ${t}`}
                    onClick={() => data.updateMeta({ tags: source.tags.filter(x => x !== t) })}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form
              onSubmit={e => {
                e.preventDefault()
                const clean = tagDraft.trim().toLowerCase().replace(/\s+/g, '-')
                if (clean !== '' && !source.tags.includes(clean))
                  data.updateMeta({ tags: [...source.tags, clean] })
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
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="search"
            className="wx-input"
            style={{ maxWidth: 320 }}
            placeholder="Search items…"
            value={docQuery}
            onChange={e => setDocQuery(e.target.value)}
            aria-label="Search source content"
          />
          {source.docs.length === 0 ? (
            <EmptyState
              title="No content yet"
              body="This source is empty. Add documents, text, or links so agents have something to retrieve."
            />
          ) : docs.length === 0 ? (
            <EmptyState
              title={`No items match “${docQuery}”`}
              body="Try another term."
              action={
                <Button variant="secondary" size="md" onClick={() => setDocQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <div className="wx-table-wrap">
              <table className="wx-table">
                <caption className="wx-caption" style={{ textAlign: 'left', padding: '8px 16px' }}>
                  Source content and index state.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Type</th>
                    <th scope="col">Size</th>
                    <th scope="col">State</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td className="wx-body-sm">{d.kind}</td>
                      <td className="wx-body-sm">{d.size}</td>
                      <td>
                        <KbDocStateBadge state={d.state} />
                      </td>
                      <td className="wx-body-sm">{d.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'usage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="wx-body-sm">
            Agents citing this source in responses. Changes apply to future retrievals.
          </p>
          {connected.length === 0 && (
            <p className="wx-caption">Not used by any agent yet — connect one below.</p>
          )}
          {connected.length > 0 && (
            <ul className="wx-list">
              {connected.map(a => (
                <li key={a.id} className="wx-list__row">
                  <span style={{ flex: 1 }}>
                    <Link
                      to={`/ai/${a.id}?tab=knowledge`}
                      className="wx-label"
                      style={{ display: 'block' }}
                    >
                      {a.name}
                    </Link>
                    <span className="wx-caption">
                      {a.status} · {a.calls24h} calls/24h
                    </span>
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => data.toggleAgent(a.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {available.length > 0 && (
            <>
              <h3 className="wx-h3">Available agents</h3>
              <ul className="wx-list">
                {available.map(a => (
                  <li key={a.id} className="wx-list__row">
                    <span style={{ flex: 1 }}>
                      <Link
                        to={`/ai/${a.id}?tab=knowledge`}
                        className="wx-label"
                        style={{ display: 'block' }}
                      >
                        {a.name}
                      </Link>
                      <span className="wx-caption">{a.status}</span>
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => data.toggleAgent(a.id)}>
                      Connect
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.activities.length === 0 ? (
            <EmptyState
              title="No activity yet"
              body="Uploads, indexing, failures, and agent assignments appear here."
            />
          ) : (
            <ul className="wx-list">
              {data.activities.map(a => (
                <li key={a.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                  <Badge tone="neutral">{a.kind}</Badge>
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
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor="kb-title">
              Title
            </label>
            <input
              id="kb-title"
              className="wx-input"
              value={source.title}
              onChange={e => data.updateMeta({ title: e.target.value })}
            />
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor="kb-desc">
              Description
            </label>
            <textarea
              id="kb-desc"
              className="wx-textarea"
              rows={3}
              value={source.description}
              onChange={e => data.updateMeta({ description: e.target.value })}
            />
          </div>
          {source.archived ? (
            <span>
              <Button variant="secondary" size="md" onClick={data.restoreSource}>
                Restore from archive
              </Button>
            </span>
          ) : (
            <span>
              <Button variant="secondary" size="md" onClick={data.archiveSource}>
                Archive source
              </Button>
            </span>
          )}
          <span>
            <Button variant="destructive" size="md" onClick={() => setDeleteOpen(true)}>
              Delete source
            </Button>
          </span>
          <p className="wx-caption">
            Deleting removes content and agent connections. Agents fall back to instructions-only
            answers.
          </p>
        </div>
      )}

      {deleteOpen && (
        <ConfirmDialog
          title={`Delete “${source.title}”?`}
          body={`Removes ${source.docs.length} items and disconnects ${connected.length} agents. This cannot be undone.`}
          confirmLabel="Delete source"
          danger
          onConfirm={() => {
            data.deleteSource()
            navigate('/ai?view=knowledge')
          }}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </section>
  )
}
