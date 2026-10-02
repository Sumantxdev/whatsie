import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Badge, KeyValue } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog } from '@/design-system/components/overlays'
import { Tabs } from '@/design-system/components/tabs'
import { knowledgeMock } from './mock'
import type { ModelTier } from './types'
import { TIER_META } from './types'
import { AgentStatusBadge, EventKindBadge, KnowledgeStateBadge, TierBadge } from './aiUi'
import { useAiData } from './useAiData'
import './Ai.css'

/* Agent detail: overview + config tabs + test. Dirty-guarded save, partial-safe. */

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'behavior', label: 'Behavior' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'guardrails', label: 'Guardrails' },
  { id: 'test', label: 'Test' },
  { id: 'activity', label: 'Activity' },
  { id: 'usage', label: 'Usage' },
]

const BLOCKABLE = ['medical advice', 'financial advice', 'legal advice'] as const

export function AgentDetailPage(): React.JSX.Element {
  const { agentId } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = params.get('tab') ?? 'overview'
  const activeTab = TABS.some(t => t.id === tab) ? tab : 'overview'
  const data = useAiData(agentId)
  const { agent, detailNotFound, listStatus, activityFailed, dirty, saving, savedAt } = data
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [testDraft, setTestDraft] = useState('')

  if (listStatus === 'loading') {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        role="status"
        aria-label="Loading agent"
      >
        <Skeleton height={38} width="40%" />
        <Skeleton height={120} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (detailNotFound || !agent) {
    return (
      <EmptyState
        title="Agent not found"
        body="It may have been deleted or belong to another workspace."
        action={
          <Link to="/ai" className="wx-btn wx-btn--secondary wx-btn--md">
            Back to Agents
          </Link>
        }
      />
    )
  }

  const ready = agent.status === 'active' && agent.attention.length === 0
  const usage = data.usage.find(u => u.agentId === agent.id)

  return (
    <section
      aria-labelledby="agent-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title={agent.name}
        description={agent.purpose || 'No purpose set yet.'}
        breadcrumbs={[{ label: 'AI agents', to: '/ai' }, { label: agent.name }]}
        primaryAction={
          agent.status !== 'active' ? (
            <Button variant="primary" size="md" onClick={() => data.setEnabled(true)}>
              Enable
            </Button>
          ) : (
            <Button variant="secondary" size="md" onClick={() => data.setEnabled(false)}>
              Pause
            </Button>
          )
        }
        secondaryActions={
          <Button variant="destructive" size="md" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        }
      />

      <div
        style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
        role="status"
        aria-label="Agent status"
      >
        <AgentStatusBadge status={agent.status} />
        <TierBadge tier={agent.model.tier} />
        <Badge tone={ready ? 'success' : 'warning'}>
          {ready ? 'Ready' : 'Needs configuration'}
        </Badge>
        {dirty && <Badge tone="info">Unsaved changes</Badge>}
        {saving && <span className="wx-body-sm">Saving…</span>}
        {!saving && savedAt && !dirty && <span className="wx-caption">Saved {savedAt}</span>}
        {dirty && (
          <span style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={data.discard}>
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={data.save} loading={saving}>
              Save changes
            </Button>
          </span>
        )}
      </div>

      {agent.attention.length > 0 && (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
          }}
        >
          <strong className="wx-body-sm" style={{ color: 'var(--warning-text)' }}>
            Configuration needed — agent is not fully ready:
          </strong>
          <ul
            className="wx-body-sm"
            style={{ margin: 0, paddingLeft: 18, color: 'var(--warning-text)' }}
          >
            {agent.attention.map(a => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <Tabs
        items={TABS}
        activeId={activeTab}
        label="Agent sections"
        onChange={id => {
          const next = new URLSearchParams(params)
          next.set('tab', id)
          setParams(next, { preventScrollReset: true })
        }}
      />

      {activeTab === 'overview' && (
        <div className="ai-cols">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <KeyValue
              items={[
                { key: 'Status', value: `${agent.status} · last active ${agent.lastActive}` },
                {
                  key: 'Channels',
                  value:
                    agent.channels.length === 0
                      ? 'None assigned'
                      : `${agent.channels.join(' · ')} (${agent.channelConnected ? 'connected' : 'not connected'})`,
                },
                {
                  key: 'Model',
                  value: `${TIER_META[agent.model.tier].label} · ${agent.model.availability}${agent.model.fallbackTier ? ` · falls back to ${TIER_META[agent.model.fallbackTier].label}` : ''}`,
                },
                {
                  key: 'Knowledge',
                  value:
                    agent.knowledge.assignedIds.length === 0
                      ? 'None assigned'
                      : `${agent.knowledge.assignedIds.length} sources`,
                },
                {
                  key: 'Escalation',
                  value: agent.escalationEnabled
                    ? `On (${agent.guardrails.escalationThreshold})`
                    : 'Off',
                },
              ]}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="wx-h3">Recent activity</h3>
            {data.events.slice(0, 3).length === 0 ? (
              <p className="wx-caption">No activity yet — test the agent or wait for traffic.</p>
            ) : (
              <ul className="wx-list">
                {data.events.slice(0, 3).map(e => (
                  <li key={e.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                    <EventKindBadge kind={e.kind} />
                    <span style={{ flex: 1 }}>
                      <span className="wx-body-sm" style={{ display: 'block' }}>
                        {e.text}
                      </span>
                      <span className="wx-caption">{e.time}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to={`/ai/${agent.id}?tab=activity`} className="wx-link-btn wx-body-sm">
              Full activity →
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'behavior' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor="ag-instructions">
              Instructions
            </label>
            <textarea
              id="ag-instructions"
              className="wx-textarea"
              rows={4}
              value={agent.behavior.instructions}
              onChange={e => data.updateBehavior({ instructions: e.target.value })}
              placeholder="How should this agent behave? What must it never do?"
            />
            <p className="wx-caption">
              {agent.behavior.instructions.length} characters · keep it specific
            </p>
          </div>
          <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', gap: 16 }}>
            <legend className="wx-field__label">Tone</legend>
            {(['friendly', 'concise', 'formal'] as const).map(t => (
              <label key={t} className="wx-check-row">
                <input
                  type="radio"
                  name="tone"
                  checked={agent.behavior.tone === t}
                  onChange={() => data.updateBehavior({ tone: t })}
                />
                <span className="wx-body-sm" style={{ textTransform: 'capitalize' }}>
                  {t}
                </span>
              </label>
            ))}
          </fieldset>
          <div className="wx-field" style={{ maxWidth: 240 }}>
            <label className="wx-field__label" htmlFor="ag-maxlen">
              Max reply length
            </label>
            <input
              id="ag-maxlen"
              type="number"
              className="wx-input"
              min={40}
              max={2000}
              value={agent.behavior.maxLength}
              onChange={e => data.updateBehavior({ maxLength: Number(e.target.value) || 280 })}
            />
          </div>
          <div className="wx-field" style={{ maxWidth: 360 }}>
            <label className="wx-field__label" htmlFor="ag-tier">
              Model tier
            </label>
            <select
              id="ag-tier"
              className="wx-select"
              value={agent.model.tier}
              onChange={e => data.updateModel(e.target.value as ModelTier)}
            >
              {(Object.keys(TIER_META) as ModelTier[]).map(t => (
                <option key={t} value={t}>
                  {TIER_META[t].label} · {TIER_META[t].cost}
                </option>
              ))}
            </select>
            <p className="wx-caption">
              {TIER_META[agent.model.tier].hint}. Availability: {agent.model.availability}
              {agent.model.fallbackTier
                ? ` · falls back to ${TIER_META[agent.model.fallbackTier].label} when unavailable.`
                : '.'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          <p className="wx-body-sm">
            Assigned sources ground answers. Unassigned agents answer from instructions only.{' '}
            <Link to="/ai?view=knowledge">Workspace knowledge →</Link>
          </p>
          {knowledgeMock.map(k => {
            const on = agent.knowledge.assignedIds.includes(k.id)
            return (
              <label
                key={k.id}
                className="wx-check-row"
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => data.toggleKnowledge(k.id)}
                  aria-label={`Assign ${k.title}`}
                />
                <span style={{ flex: 1 }}>
                  <span
                    className="wx-label"
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    {k.title} <KnowledgeStateBadge state={k.state} />
                  </span>
                  <span className="wx-caption">
                    {k.kind} · {k.state === 'indexed' ? `${k.chunks} chunks` : k.updated}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      )}

      {activeTab === 'guardrails' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
          <label className="wx-check-row">
            <input
              type="checkbox"
              checked={agent.guardrails.moderation}
              onChange={e => data.updateGuardrails({ moderation: e.target.checked })}
            />
            <span>
              <span className="wx-label">Content moderation</span>
              <span className="wx-caption" style={{ display: 'block' }}>
                Screens inputs and outputs for unsafe content.
              </span>
            </span>
          </label>
          <label className="wx-check-row">
            <input
              type="checkbox"
              checked={agent.guardrails.piiRedaction}
              onChange={e => data.updateGuardrails({ piiRedaction: e.target.checked })}
            />
            <span>
              <span className="wx-label">PII redaction</span>
              <span className="wx-caption" style={{ display: 'block' }}>
                Masks phone numbers, emails, and IDs in logs.
              </span>
            </span>
          </label>
          <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
            <legend className="wx-field__label">
              Blocked topics (agent refuses and escalates)
            </legend>
            {BLOCKABLE.map(t => (
              <label key={t} className="wx-check-row">
                <input
                  type="checkbox"
                  checked={agent.guardrails.blockedTopics.includes(t)}
                  onChange={e =>
                    data.updateGuardrails({
                      blockedTopics: e.target.checked
                        ? [...agent.guardrails.blockedTopics, t]
                        : agent.guardrails.blockedTopics.filter(x => x !== t),
                    })
                  }
                />
                <span className="wx-body-sm" style={{ textTransform: 'capitalize' }}>
                  {t}
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', gap: 16 }}>
            <legend className="wx-field__label">Escalation sensitivity</legend>
            {(['low', 'standard', 'strict'] as const).map(s => (
              <label key={s} className="wx-check-row">
                <input
                  type="radio"
                  name="escalation"
                  checked={agent.guardrails.escalationThreshold === s}
                  onChange={() => data.updateGuardrails({ escalationThreshold: s })}
                />
                <span className="wx-body-sm" style={{ textTransform: 'capitalize' }}>
                  {s}
                </span>
              </label>
            ))}
          </fieldset>
          <label className="wx-check-row">
            <input
              type="checkbox"
              checked={agent.escalationEnabled}
              onChange={e => data.setEscalation(e.target.checked)}
            />
            <span>
              <span className="wx-label">Human escalation</span>
              <span className="wx-caption" style={{ display: 'block' }}>
                Route to a human with full context when thresholds trigger.
              </span>
            </span>
          </label>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor="ag-fallback">
              Fallback message
            </label>
            <textarea
              id="ag-fallback"
              className="wx-textarea"
              rows={2}
              value={agent.guardrails.fallbackMessage}
              onChange={e => data.updateGuardrails({ fallbackMessage: e.target.value })}
              placeholder="Sent when the agent cannot answer safely…"
            />
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          <p className="wx-body-sm">
            Simulate a customer message. Mock replies only — nothing reaches a model or channel.
            {agent.knowledge.assignedIds.length === 0 &&
              ' No knowledge assigned: answers will say so.'}
          </p>
          {data.testMessages.length === 0 && !data.testBusy ? (
            <EmptyState
              title="No test messages"
              body="Try “What is the price?”, “I want a human”, or “fail” to preview the error path."
            />
          ) : (
            <ul className="ai-test-thread" aria-live="polite" aria-label="Test conversation">
              {data.testMessages.map(m => (
                <li
                  key={m.id}
                  className={
                    m.from === 'user'
                      ? 'ai-test-user'
                      : m.from === 'ai'
                        ? 'ai-test-ai'
                        : 'ai-test-sys'
                  }
                >
                  <span className="wx-body-sm">{m.text}</span>
                  {m.sources && (
                    <span className="wx-caption" style={{ display: 'block' }}>
                      Sources: {m.sources.join(', ')}
                    </span>
                  )}
                </li>
              ))}
              {data.testBusy && (
                <li className="ai-test-ai" role="status" aria-label="AI is responding">
                  <span className="wx-body-sm">Thinking…</span>
                </li>
              )}
            </ul>
          )}
          <form
            onSubmit={e => {
              e.preventDefault()
              if (testDraft.trim() === '') return
              data.sendTest(testDraft)
              setTestDraft('')
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <label
              htmlFor="ag-test-input"
              className="wx-caption"
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
              }}
            >
              Test message
            </label>
            <input
              id="ag-test-input"
              className="wx-input"
              value={testDraft}
              onChange={e => setTestDraft(e.target.value)}
              placeholder="Type as a customer…"
              style={{ flex: 1 }}
            />
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={data.testBusy}
              disabled={testDraft.trim() === '' || data.testBusy}
            >
              Send
            </Button>
            {data.testMessages.length > 0 && (
              <Button variant="ghost" size="md" onClick={data.clearTest}>
                Clear
              </Button>
            )}
          </form>
        </div>
      )}

      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activityFailed ? (
            <ErrorState
              title="Activity failed to load"
              body="Configuration above is unaffected."
              onRetry={data.reload}
              requestId="ai-activity"
            />
          ) : data.events.length === 0 ? (
            <EmptyState title="No activity yet" body="Test the agent or wait for live traffic." />
          ) : (
            <ul className="wx-list">
              {data.events.map(e => (
                <li key={e.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                  <EventKindBadge kind={e.kind} />
                  <span style={{ flex: 1 }}>
                    <span className="wx-body-sm" style={{ display: 'block' }}>
                      {e.text}
                    </span>
                    <span className="wx-caption">
                      {e.time}
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
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'usage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          {usage ? (
            <>
              <KeyValue
                items={[
                  { key: 'Calls (period)', value: String(usage.calls) },
                  { key: 'Tokens', value: usage.tokens.toLocaleString() },
                  { key: 'Est. cost', value: `${usage.cost} (mock)` },
                  { key: 'Avg latency', value: usage.avgLatency },
                  { key: 'Fallback rate', value: usage.fallbackRate },
                ]}
              />
              <p className="wx-caption">
                Usage informs cost control; plan limits and invoices live in{' '}
                <Link to="/billing">Billing →</Link>
              </p>
            </>
          ) : (
            <EmptyState
              title="No usage yet"
              body="Calls, tokens, and latency appear after the first run."
            />
          )}
        </div>
      )}

      {deleteOpen && (
        <ConfirmDialog
          title={`Delete ${agent.name}?`}
          body="Configuration, knowledge assignments, and test history are removed. Past conversation activity is kept. This cannot be undone."
          confirmLabel="Delete agent"
          danger
          onConfirm={() => {
            data.deleteAgent()
            navigate('/ai')
          }}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </section>
  )
}
