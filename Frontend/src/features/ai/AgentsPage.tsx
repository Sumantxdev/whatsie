import { useId, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Badge } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { Modal } from '@/design-system/components/overlays'
import { KnowledgePage } from '@/features/kb/KnowledgePage'
import type { ModelTier } from './types'
import { TIER_META } from './types'
import { AgentStatusBadge, EventKindBadge, TierBadge } from './aiUi'
import { useAiData } from './useAiData'
import './Ai.css'

/* AI section: views follow the shell contextual tabs (agents/knowledge/activity/usage). */

function CreateAgentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, purpose: string, tier: ModelTier) => string
}): React.JSX.Element {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [tier, setTier] = useState<ModelTier>('tier-2')
  const [error, setError] = useState<string | undefined>()
  const baseId = useId()
  const navigate = useNavigate()
  return (
    <Modal
      title={step === 1 ? 'Create agent · basics' : 'Create agent · model'}
      onClose={onClose}
      footer={
        <>
          {step === 2 && (
            <Button variant="secondary" size="md" onClick={() => setStep(1)}>
              Back
            </Button>
          )}
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (name.trim() === '') {
                  setError('Give the agent a name first.')
                  return
                }
                setError(undefined)
                setStep(2)
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const id = onCreate(name.trim(), purpose.trim(), tier)
                navigate(`/ai/${id}?tab=behavior`)
              }}
            >
              Create draft
            </Button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${baseId}-name`}>
              Agent name *
            </label>
            <input
              id={`${baseId}-name`}
              className="wx-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Support Copilot"
            />
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${baseId}-purpose`}>
              Purpose
            </label>
            <textarea
              id={`${baseId}-purpose`}
              className="wx-textarea"
              rows={2}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="What should this agent handle?"
            />
          </div>
          {error && (
            <p role="alert" className="wx-field__error">
              {error}
            </p>
          )}
          <p className="wx-caption">
            Behavior, knowledge, and guardrails are configured next — the agent starts as a draft.
          </p>
        </div>
      ) : (
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
          <legend className="wx-field__label">Starting model tier</legend>
          {(Object.keys(TIER_META) as ModelTier[]).map(t => (
            <label
              key={t}
              className="wx-check-row"
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
              }}
            >
              <input type="radio" name="tier" checked={tier === t} onChange={() => setTier(t)} />
              <span>
                <span className="wx-label">
                  {TIER_META[t].label} · {TIER_META[t].cost}
                </span>
                <span className="wx-caption" style={{ display: 'block' }}>
                  {TIER_META[t].hint}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </Modal>
  )
}

export function AgentsPage(): React.JSX.Element {
  const data = useAiData()
  const [params] = useSearchParams()
  const view = params.get('view') ?? 'agents'
  const [createOpen, setCreateOpen] = useState(false)
  const {
    listStatus,
    searching,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    resetListFilters,
    agents,
    totalCount,
    events,
    eventFilter,
    setEventFilter,
    usage,
    quota,
    reload,
  } = data

  return (
    <section
      aria-labelledby="ai-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title="AI agents"
        description="Configure behavior, knowledge, and guardrails. Test before relying on an agent."
        primaryAction={
          <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
            Create agent
          </Button>
        }
      />

      {view === 'agents' && (
        <>
          <div className="ai-toolbar" role="search">
            <input
              type="search"
              className="wx-input ai-search"
              placeholder="Search agents…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search agents"
            />
            <label className="wx-caption">
              Status
              <select
                className="wx-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all')}
                aria-label="Filter by agent status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="configuring">Configuring</option>
                <option value="error">Error</option>
              </select>
            </label>
            {(query !== '' || statusFilter !== 'all') && (
              <button type="button" className="wx-link-btn wx-body-sm" onClick={resetListFilters}>
                Clear
              </button>
            )}
          </div>
          <p className="wx-caption" role="status" aria-live="polite">
            {listStatus === 'ready' ? `${agents.length} of ${totalCount} agents` : '…'}
            {searching && ' · searching…'}
          </p>
          {listStatus === 'loading' || searching ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              role="status"
              aria-label="Loading agents"
            >
              {[0, 1, 2].map(i => (
                <Skeleton key={i} height={140} />
              ))}
            </div>
          ) : listStatus === 'error' ? (
            <ErrorState
              title="Agents failed to load"
              body="Retry to reload the agent list."
              onRetry={reload}
              requestId="ai-list"
            />
          ) : agents.length === 0 && (query !== '' || statusFilter !== 'all') ? (
            <EmptyState
              title="No agents match"
              body="Clear search or status to see everything."
              action={
                <Button variant="secondary" size="md" onClick={resetListFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : agents.length === 0 ? (
            <EmptyState
              title="No agents yet"
              body="Create your first agent — start with a name and model, then add behavior and knowledge."
              action={
                <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
                  Create agent
                </Button>
              }
            />
          ) : (
            <div className="ai-grid">
              {agents.map(a => (
                <Link
                  key={a.id}
                  to={`/ai/${a.id}`}
                  className="ai-agent-card"
                  aria-label={`${a.name}, ${a.status}, ${a.calls24h} calls in 24 hours`}
                >
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong className="wx-h3">{a.name}</strong>
                    <AgentStatusBadge status={a.status} />
                    <TierBadge tier={a.model.tier} />
                  </span>
                  <span className="wx-body-sm">{a.purpose}</span>
                  <span className="wx-caption">
                    {a.channels.length === 0 ? 'No channels' : a.channels.join(' · ')} ·{' '}
                    {a.calls24h} calls/24h · fallback {a.fallbackRate} · {a.lastActive}
                  </span>
                  {a.attention.length > 0 && (
                    <span className="wx-body-sm" style={{ color: 'var(--warning-text)' }}>
                      Needs attention: {a.attention[0]}
                      {a.attention.length > 1 ? ` (+${a.attention.length - 1} more)` : ''}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'knowledge' && <KnowledgePage />}

      {view === 'activity' && (
        <>
          <h2 className="wx-h2">AI activity</h2>
          <label className="wx-caption">
            Event
            <select
              className="wx-select"
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value as 'all')}
              aria-label="Filter activity by event"
              style={{ maxWidth: 220 }}
            >
              <option value="all">All events</option>
              <option value="called">AI called</option>
              <option value="response">Response</option>
              <option value="fallback">Fallback</option>
              <option value="failure">Failure</option>
              <option value="escalation">Escalation</option>
              <option value="usage">Usage</option>
            </select>
          </label>
          {events.length === 0 ? (
            <EmptyState
              title="No activity for this filter"
              body="Try another event type."
              action={
                <Button variant="secondary" size="md" onClick={() => setEventFilter('all')}>
                  Show all
                </Button>
              }
            />
          ) : (
            <ul className="wx-list">
              {events.map(e => (
                <li key={e.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                  <EventKindBadge kind={e.kind} />
                  <span style={{ flex: 1 }}>
                    <span className="wx-body-sm" style={{ display: 'block' }}>
                      {e.text}
                    </span>
                    <span className="wx-caption">
                      {e.agentName}
                      {e.conversationId ? (
                        <>
                          {' '}
                          · <Link to={`/inbox/${e.conversationId}`}>Open conversation →</Link>
                        </>
                      ) : (
                        ''
                      )}
                      {e.tokens ? ` · ${e.tokens} tokens` : ''}
                      {e.latencyMs ? ` · ${(e.latencyMs / 1000).toFixed(1)}s` : ''}
                    </span>
                  </span>
                  <span className="wx-caption">{e.time}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {view === 'usage' && (
        <>
          <h2 className="wx-h2">Usage vs quota</h2>
          <div className="ai-quota" role="group" aria-label="Workspace token quota">
            <p className="wx-label">
              Tokens · {quota.tokensUsed.toLocaleString()} / {quota.tokensLimit.toLocaleString()}{' '}
              (82%)
            </p>
            <div className="ai-bar ai-bar--warn" role="img" aria-label="Token usage 82 percent">
              <div style={{ width: '82%' }} />
            </div>
            <p className="wx-caption">
              Calls · {quota.callsUsed} / {quota.callsLimit}. Usage resets monthly.{' '}
              <Link to="/billing">Billing manages plan & invoices →</Link>
            </p>
          </div>
          <div className="wx-table-wrap">
            <table className="wx-table">
              <caption className="wx-caption" style={{ textAlign: 'left', padding: '8px 16px' }}>
                Per-agent usage. Mock values for demonstration.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Agent</th>
                  <th scope="col">Calls</th>
                  <th scope="col">Tokens</th>
                  <th scope="col">Est. cost</th>
                  <th scope="col">Avg latency</th>
                  <th scope="col">Fallback</th>
                </tr>
              </thead>
              <tbody>
                {usage.map(u => (
                  <tr key={u.agentId}>
                    <td>
                      <Link to={`/ai/${u.agentId}?tab=usage`} style={{ fontWeight: 600 }}>
                        {u.agentName}
                      </Link>
                    </td>
                    <td className="wx-body-sm">{u.calls}</td>
                    <td className="wx-body-sm">{u.tokens.toLocaleString()}</td>
                    <td className="wx-body-sm">{u.cost}</td>
                    <td className="wx-body-sm">{u.avgLatency}</td>
                    <td>
                      <Badge
                        tone={
                          u.fallbackRate === '—'
                            ? 'neutral'
                            : parseFloat(u.fallbackRate) > 5
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {u.fallbackRate}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {createOpen && (
        <CreateAgentModal
          onClose={() => setCreateOpen(false)}
          onCreate={(name, purpose, tier) => data.createAgent({ name, purpose, tier })}
        />
      )}
    </section>
  )
}
