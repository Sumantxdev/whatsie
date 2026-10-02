import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Metric } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog, Modal } from '@/design-system/components/overlays'
import { TriggerFields } from './NodeInspector'
import { ExecutionDrawer } from './RunViews'
import type { Execution, Trigger, TriggerType, WorkflowStatus } from './types'
import { ExecutionStatusBadge, TriggerBadge, WorkflowStatusBadge } from './automationUi'
import { useAutomationData } from './useAutomationData'
import './Automation.css'

/* Automation overview: stats → views (workflows / executions / templates). */

function CreateWorkflowModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (name: string, description: string, trigger: Trigger) => string
}): React.JSX.Element {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [trigger, setTrigger] = useState<Trigger>({ type: 'keyword', value: '', match: 'contains' })
  const [error, setError] = useState<string | undefined>()
  const navigate = useNavigate()

  const submit = (): void => {
    if (name.trim() === '') {
      setError('Give the workflow a name.')
      return
    }
    if (trigger.value.trim() === '') {
      setError('Configure a trigger value before continuing.')
      return
    }
    const id = onCreated(name.trim(), description.trim(), trigger)
    void id
    navigate(`/automations/${id}?tab=workflow`)
  }

  return (
    <Modal
      title="Create workflow"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={() => submit()}>
            Save as draft
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p className="wx-body-sm">
          Name it, pick a trigger, then build steps in the editor. Nothing activates until you say
          so.
        </p>
        <div className="wx-field">
          <label className="wx-field__label" htmlFor="wf-new-name">
            Workflow name *
          </label>
          <input
            id="wf-new-name"
            className="wx-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Abandoned cart follow-up"
          />
        </div>
        <div className="wx-field">
          <label className="wx-field__label" htmlFor="wf-new-desc">
            Description
          </label>
          <input
            id="wf-new-desc"
            className="wx-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What does this automate?"
          />
        </div>
        <TriggerFields trigger={trigger} onChange={setTrigger} idPrefix="wf-new" />
        {error && (
          <p role="alert" className="wx-field__error">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

export function AutomationPage(): React.JSX.Element {
  const data = useAutomationData()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const view = params.get('view') ?? 'workflows'
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const {
    listStatus,
    searching,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    triggerFilter,
    setTriggerFilter,
    resetFilters,
    workflows,
    totalCount,
    stats,
    deleteWorkflow,
    setWorkflowStatus,
    executions,
    executionFilter,
    setExecutionFilter,
    retryExecution,
    templates,
    instantiateTemplate,
    reload,
  } = data

  const activeRun: Execution | null = runId ? (executions.find(e => e.id === runId) ?? null) : null
  const filtersActive = query !== '' || statusFilter !== 'all' || triggerFilter !== 'all'

  return (
    <section
      aria-labelledby="af-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title="Automation"
        description="Workflows react to messages, intents, and events — then message, wait, branch, call APIs, and update leads."
        primaryAction={
          <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
            Create Workflow
          </Button>
        }
      />

      {listStatus === 'loading' || searching ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          role="status"
          aria-label="Loading automation"
        >
          <Skeleton height={90} />
          <Skeleton height={120} />
          <Skeleton height={120} />
        </div>
      ) : listStatus === 'error' ? (
        <ErrorState
          title="Automation failed to load"
          body="Retry to reload workflows and runs."
          onRetry={reload}
          requestId="af-list"
        />
      ) : (
        <>
          <div className="af-stats" role="group" aria-label="Automation summary">
            <div className="af-stat">
              <Metric label="Workflows" value={String(stats.total)} />
            </div>
            <div className="af-stat">
              <Metric label="Active" value={String(stats.active)} />
            </div>
            <div className="af-stat">
              <Metric label="Drafts" value={String(stats.draft)} />
            </div>
            <div className="af-stat">
              <Metric label="Failed runs · 24h" value={String(stats.failed24h)} />
            </div>
            <div className="af-stat">
              <Metric label="Runs · 24h" value={String(stats.runs24h)} />
            </div>
          </div>

          {view === 'workflows' && (
            <>
              <div className="af-toolbar" role="search">
                <input
                  type="search"
                  className="wx-input af-search"
                  placeholder="Search name, description, trigger…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label="Search workflows"
                />
                <label className="wx-caption">
                  Status
                  <select
                    className="wx-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as WorkflowStatus | 'all')}
                    aria-label="Filter by status"
                  >
                    <option value="all">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
                <label className="wx-caption">
                  Trigger
                  <select
                    className="wx-select"
                    value={triggerFilter}
                    onChange={e => setTriggerFilter(e.target.value as TriggerType | 'all')}
                    aria-label="Filter by trigger type"
                  >
                    <option value="all">All triggers</option>
                    <option value="keyword">Keyword</option>
                    <option value="intent">Intent</option>
                    <option value="event">Event</option>
                  </select>
                </label>
                {filtersActive && (
                  <button type="button" className="wx-link-btn wx-body-sm" onClick={resetFilters}>
                    Clear all
                  </button>
                )}
              </div>
              <p className="wx-caption" role="status" aria-live="polite">
                {`${workflows.length} of ${totalCount} workflows`}
                {searching && ' · searching…'}
              </p>
              {workflows.length === 0 && query === '' && !filtersActive ? (
                <EmptyState
                  title="No workflows yet"
                  body="Automate repetitive conversations, lead updates, and actions. Start from a template or a blank canvas."
                  action={
                    <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
                      Create Workflow
                    </Button>
                  }
                />
              ) : workflows.length === 0 ? (
                <EmptyState
                  title={
                    query !== ''
                      ? `No workflows match “${query}”`
                      : 'No workflows match these filters'
                  }
                  body="Try another term or clear the filters."
                  action={
                    <Button variant="secondary" size="md" onClick={resetFilters}>
                      Clear search & filters
                    </Button>
                  }
                />
              ) : (
                <ul className="wx-list">
                  {workflows.map(w => (
                    <li
                      key={w.id}
                      className="wx-list__row"
                      style={{
                        alignItems: 'flex-start',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 8,
                        background: 'var(--surface)',
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <Link
                            to={`/automations/${w.id}`}
                            className="wx-label"
                            style={{ fontSize: 15 }}
                          >
                            {w.name}
                          </Link>
                          <WorkflowStatusBadge status={w.status} />
                          <TriggerBadge type={w.trigger.type} />
                        </span>
                        <span className="wx-body-sm" style={{ display: 'block' }}>
                          {w.description || 'No description.'}
                        </span>
                        <span className="wx-caption">
                          Trigger: {w.trigger.type} “{w.trigger.value || '—'}” · {w.steps.length}{' '}
                          {w.steps.length === 1 ? 'step' : 'steps'} · last run {w.lastRun} · updated{' '}
                          {w.updated}
                        </span>
                      </span>
                      <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/automations/${w.id}?tab=workflow`)}
                        >
                          Open builder
                        </Button>
                        {w.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWorkflowStatus(w.id, 'disabled')}
                          >
                            Disable
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWorkflowStatus(w.id, 'active')}
                          >
                            Enable
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(w.id)}
                          aria-label={`Delete ${w.name}`}
                        >
                          Delete
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {view === 'executions' && (
            <>
              <h2 className="wx-h2">Recent runs</h2>
              <label className="wx-caption" style={{ maxWidth: 240 }}>
                Status
                <select
                  className="wx-select"
                  value={executionFilter}
                  onChange={e => setExecutionFilter(e.target.value as 'all')}
                  aria-label="Filter executions by status"
                >
                  <option value="all">All runs</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              {executions.length === 0 ? (
                <EmptyState
                  title="No runs yet"
                  body="Executions appear here after a workflow fires. Test a workflow to preview one."
                />
              ) : (
                <ul className="wx-list">
                  {executions.map(e => (
                    <li key={e.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                      <ExecutionStatusBadge status={e.status} />
                      <span style={{ flex: 1 }}>
                        <button
                          type="button"
                          className="wx-link-btn wx-body"
                          style={{ fontWeight: 600 }}
                          onClick={() => setRunId(e.id)}
                          aria-label={`Open run ${e.id} of ${e.workflowName}`}
                        >
                          {e.workflowName} · {e.id}
                        </button>
                        <span className="wx-caption" style={{ display: 'block' }}>
                          {e.triggerLabel} · {e.leadName} · started {e.started} · {e.duration}
                        </span>
                        {e.error && (
                          <span className="wx-field__error" style={{ display: 'block' }}>
                            {e.error}
                          </span>
                        )}
                      </span>
                      {e.status === 'failed' && (
                        <Button variant="secondary" size="sm" onClick={() => retryExecution(e.id)}>
                          Retry
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {view === 'templates' && (
            <>
              <h2 className="wx-h2">Start from a template</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 12,
                }}
              >
                {templates.map(t => (
                  <div
                    key={t.id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <strong className="wx-h3">{t.name}</strong>
                    <span className="wx-body-sm">{t.description}</span>
                    <span className="wx-caption">
                      Trigger: {t.trigger.type} “{t.trigger.value}” · {t.stepCount}
                    </span>
                    <span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          navigate(`/automations/${instantiateTemplate(t.id)}?tab=workflow`)
                        }
                      >
                        Use template
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {createOpen && (
        <CreateWorkflowModal
          onClose={() => setCreateOpen(false)}
          onCreated={(name, description, trigger) =>
            data.createWorkflow({ name, description, trigger })
          }
        />
      )}
      {deleteId && (
        <ConfirmDialog
          title="Delete this workflow?"
          body="Its steps, trigger, and draft changes are removed. Past executions stay in history. This cannot be undone."
          confirmLabel="Delete workflow"
          danger
          onConfirm={() => {
            deleteWorkflow(deleteId)
            setDeleteId(null)
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {activeRun && (
        <ExecutionDrawer
          execution={activeRun}
          onRetry={() => retryExecution(activeRun.id)}
          onClose={() => setRunId(null)}
        />
      )}
    </section>
  )
}
