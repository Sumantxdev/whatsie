import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Metric } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { agentsMock } from '../ai/mock'
import { AddKnowledgeModal } from './AddKnowledgeModal'
import { KbStatusBadge, KbTypeBadge } from './kbUi'
import type { KbSourceType, KbStatus } from './types'
import { useKbData } from './useKbData'
import './Kb.css'

/* Knowledge overview: stats → search/filter → source grid. Embedded in the
   AI section knowledge view; detail lives at /ai/knowledge/:sourceId. */

export function KnowledgePage(): React.JSX.Element {
  const data = useKbData()
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const {
    listStatus,
    searching,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    agentFilter,
    setAgentFilter,
    showArchived,
    setShowArchived,
    resetFilters,
    sources,
    totalCount,
    stats,
    createSource,
    reload,
  } = data
  const filtersActive =
    query !== '' || typeFilter !== 'all' || statusFilter !== 'all' || agentFilter !== 'all'

  return (
    <section
      aria-labelledby="kb-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 id="kb-title" className="wx-h2">
            Knowledge Base
          </h2>
          <p className="wx-body-sm">
            Sources agents cite when responding. Embedded once, shared across agents.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
          Add Knowledge
        </Button>
      </div>

      {listStatus === 'loading' || searching ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          role="status"
          aria-label="Loading knowledge"
        >
          <Skeleton height={90} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      ) : listStatus === 'error' ? (
        <ErrorState
          title="Knowledge failed to load"
          body="Filters are preserved. Retry to reload."
          onRetry={reload}
          requestId="kb-list"
        />
      ) : (
        <>
          <div className="kb-stats" role="group" aria-label="Knowledge summary">
            <div className="kb-stat">
              <Metric label="Sources" value={String(stats.total)} />
            </div>
            <div className="kb-stat">
              <Metric label="Indexed" value={String(stats.indexed)} />
            </div>
            <div className="kb-stat">
              <Metric label="Processing" value={String(stats.processing)} />
            </div>
            <div className="kb-stat">
              <Metric
                label="Needs attention"
                value={String(stats.attention)}
                hint="Failed or empty"
              />
            </div>
            <div className="kb-stat">
              <Metric label="Agents using" value={String(stats.agentsUsing)} />
            </div>
          </div>

          <div className="kb-toolbar" role="search">
            <input
              type="search"
              className="wx-input kb-search"
              placeholder="Search name, description, tag…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search knowledge"
            />
            <label className="wx-caption">
              Type
              <select
                className="wx-select"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as KbSourceType | 'all')}
                aria-label="Filter by source type"
              >
                <option value="all">All types</option>
                <option value="document">Documents</option>
                <option value="text">Text</option>
                <option value="url">URL</option>
                <option value="faq">FAQ</option>
                <option value="structured">Structured</option>
              </select>
            </label>
            <label className="wx-caption">
              Status
              <select
                className="wx-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as KbStatus | 'all')}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="indexed">Indexed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="empty">Empty</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <label className="wx-caption">
              Agent
              <select
                className="wx-select"
                value={agentFilter}
                onChange={e => setAgentFilter(e.target.value)}
                aria-label="Filter by agent usage"
              >
                <option value="all">Used by anyone</option>
                <option value="none">Used by no agent</option>
                {agentsMock.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="wx-check-row" style={{ padding: 0 }}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
              />
              <span className="wx-body-sm">Archived</span>
            </label>
            {filtersActive && (
              <button type="button" className="wx-link-btn wx-body-sm" onClick={resetFilters}>
                Clear all
              </button>
            )}
          </div>

          <p className="wx-caption" role="status" aria-live="polite">
            {`${sources.length} of ${totalCount} sources`}
            {searching && ' · searching…'}
          </p>

          {sources.length === 0 && query === '' && !filtersActive && !showArchived ? (
            <EmptyState
              title="No knowledge yet"
              body="The Knowledge Base grounds AI answers in your content. Add a document, URL, text, FAQ, or structured source — then assign it to agents."
              action={
                <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
                  Add Knowledge
                </Button>
              }
            />
          ) : sources.length === 0 ? (
            <EmptyState
              title={query !== '' ? `No results for “${query}”` : 'Nothing matches these filters'}
              body="Try another term, or clear the filters."
              action={
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    resetFilters()
                    setShowArchived(false)
                  }}
                >
                  Clear search & filters
                </Button>
              }
            />
          ) : (
            <div className="kb-grid">
              {sources.map(s => (
                <Link
                  key={s.id}
                  to={`/ai/knowledge/${s.id}`}
                  className="kb-card"
                  aria-label={`${s.title}, ${s.status}${s.archived ? ', archived' : ''}`}
                >
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong className="wx-h3">{s.title}</strong>
                    <KbStatusBadge status={s.status} />
                    {s.archived && <span className="wx-badge wx-badge--neutral">Archived</span>}
                  </span>
                  <span className="wx-body-sm">{s.description || 'No description.'}</span>
                  {s.status === 'processing' && typeof s.progress === 'number' && (
                    <span
                      className="kb-progress"
                      role="img"
                      aria-label={`Processing ${s.progress} percent`}
                    >
                      <div style={{ width: `${s.progress}%` }} />
                    </span>
                  )}
                  {s.status === 'failed' && s.error && (
                    <span
                      className="wx-body-sm"
                      role="alert"
                      style={{ color: 'var(--danger-text)' }}
                    >
                      {s.error}
                    </span>
                  )}
                  <span className="wx-caption">
                    <KbTypeBadge type={s.type} /> · {s.docs.length}{' '}
                    {s.docs.length === 1 ? 'item' : 'items'} · {s.agentIds.length}{' '}
                    {s.agentIds.length === 1 ? 'agent' : 'agents'} · {s.updated}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {addOpen && (
        <AddKnowledgeModal
          onClose={() => setAddOpen(false)}
          onCreated={input => {
            const id = createSource(input)
            setAddOpen(false)
            navigate(`/ai/knowledge/${id}`)
            return id
          }}
        />
      )}
    </section>
  )
}
