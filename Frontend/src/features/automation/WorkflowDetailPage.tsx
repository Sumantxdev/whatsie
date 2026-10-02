import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { KeyValue } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog, Popover } from '@/design-system/components/overlays'
import { Tabs } from '@/design-system/components/tabs'
import { NodeInspector, TriggerFields } from './NodeInspector'
import { ExecutionDrawer, TestRunModal } from './RunViews'
import { WorkflowCanvas } from './WorkflowCanvas'
import type { Execution, Step } from './types'
import { ExecutionStatusBadge, WorkflowStatusBadge } from './automationUi'
import { useAutomationData, workflowIssues } from './useAutomationData'
import './Automation.css'

/* Workflow detail: Overview / Workflow (visual builder) / Activity / Settings.
   Dirty-guarded save; failures stay section-local. */

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
]

export function WorkflowDetailPage(): React.JSX.Element {
  const { workflowId } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = params.get('tab') ?? 'overview'
  const activeTab = TABS.some(t => t.id === tab) ? tab : 'overview'
  const data = useAutomationData(workflowId)
  const { workflow, detailNotFound, listStatus } = data
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [testOpen, setTestOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)

  const issues = useMemo(() => (workflow ? workflowIssues(workflow) : []), [workflow])
  const invalidIds = useMemo(
    () => new Set(issues.map(i => i.stepId).filter((x): x is string => x !== null)),
    [issues]
  )

  if (listStatus === 'loading') {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        role="status"
        aria-label="Loading workflow"
      >
        <Skeleton height={38} width="40%" />
        <Skeleton height={120} />
        <Skeleton height={240} />
      </div>
    )
  }

  if (detailNotFound || (!workflow && listStatus === 'ready')) {
    return (
      <EmptyState
        title="Workflow not found"
        body="It may have been deleted or belong to another workspace."
        action={
          <Link to="/automations" className="wx-btn wx-btn--secondary wx-btn--md">
            Back to Automation
          </Link>
        }
      />
    )
  }

  if (listStatus === 'error' || !workflow) {
    return (
      <ErrorState
        title="Workflow failed to load"
        body="Retry to reload this workflow."
        onRetry={data.reload}
        requestId="af-detail"
      />
    )
  }

  const selectedStep: Step | null =
    selectedId === null || selectedId === 'trigger'
      ? null
      : (function find(steps: Step[]): Step | null {
          for (const s of steps) {
            if (s.id === selectedId) return s
            if (s.type === 'condition') {
              const hit = find(s.yes) ?? find(s.no)
              if (hit) return hit
            }
          }
          return null
        })(workflow.steps)

  const activeRun: Execution | null = runId
    ? (data.executions.find(e => e.id === runId) ?? null)
    : null
  const canActivate = issues.length === 0

  const toolbar = (
    <div
      style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
      role="toolbar"
      aria-label="Workflow actions"
    >
      <WorkflowStatusBadge status={workflow.status} />
      {data.dirty && <span className="wx-badge wx-badge--info">Unsaved changes</span>}
      {data.saving && <span className="wx-body-sm">Saving…</span>}
      {!data.saving && data.savedAt && !data.dirty && (
        <span className="wx-caption">Saved {data.savedAt}</span>
      )}
      {data.dirty && (
        <>
          <Button variant="secondary" size="sm" onClick={data.discardWorkflow}>
            Discard
          </Button>
          <Button variant="primary" size="sm" onClick={data.saveWorkflow} loading={data.saving}>
            Save
          </Button>
        </>
      )}
      <Button variant="secondary" size="sm" onClick={() => setTestOpen(true)}>
        Test
      </Button>
      {workflow.status === 'active' ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => data.setWorkflowStatus(workflow.id, 'disabled')}
        >
          Disable
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={() => data.setWorkflowStatus(workflow.id, 'active')}
          disabled={!canActivate}
          title={canActivate ? undefined : 'Fix configuration issues first'}
        >
          Activate
        </Button>
      )}
      <Popover
        label="More workflow actions"
        trigger={
          <Button variant="ghost" size="sm" aria-label="More workflow actions">
            ···
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
          <button
            type="button"
            className="wx-list__row wx-body-sm"
            onClick={() =>
              navigate(`/automations/${data.duplicateWorkflow(workflow.id)}?tab=workflow`)
            }
          >
            Duplicate
          </button>
          <button
            type="button"
            className="wx-list__row wx-body-sm"
            onClick={() => setDeleteOpen(true)}
          >
            Delete…
          </button>
        </div>
      </Popover>
    </div>
  )

  return (
    <section
      aria-labelledby="wf-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title={workflow.name}
        description={workflow.description || 'No description.'}
        breadcrumbs={[{ label: 'Automation', to: '/automations' }, { label: workflow.name }]}
      />
      {toolbar}

      {issues.length > 0 && (
        <div
          role="alert"
          style={{
            background: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
          }}
        >
          <strong className="wx-body-sm" style={{ color: 'var(--warning-text)' }}>
            {issues.length} configuration {issues.length === 1 ? 'issue' : 'issues'} — activation is
            blocked until these are fixed:
          </strong>
          <ul
            className="wx-body-sm"
            style={{ margin: '4px 0 0', paddingLeft: 18, color: 'var(--warning-text)' }}
          >
            {issues.map((iss, i) => (
              <li key={i}>{iss.message}</li>
            ))}
          </ul>
        </div>
      )}

      <Tabs
        items={TABS}
        activeId={activeTab}
        label="Workflow sections"
        onChange={id => {
          const next = new URLSearchParams(params)
          next.set('tab', id)
          setParams(next, { preventScrollReset: true })
        }}
      />

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
          <KeyValue
            items={[
              { key: 'Status', value: <WorkflowStatusBadge status={workflow.status} /> },
              {
                key: 'Trigger',
                value: `${workflow.trigger.type} “${workflow.trigger.value || '—'}”`,
              },
              { key: 'Steps', value: `${workflow.steps.length} top-level steps` },
              { key: 'Runs · 24h', value: `${workflow.runs24h} · fail rate ${workflow.failRate}` },
              { key: 'Last run', value: workflow.lastRun },
              { key: 'Updated', value: workflow.updated },
            ]}
          />
          <h3 className="wx-h3">Recent activity</h3>
          {data.executions.slice(0, 3).length === 0 ? (
            <p className="wx-caption">
              No runs yet — test the workflow or wait for the trigger to fire.
            </p>
          ) : (
            <ul className="wx-list">
              {data.executions.slice(0, 3).map(e => (
                <li key={e.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                  <ExecutionStatusBadge status={e.status} />
                  <span style={{ flex: 1 }}>
                    <button
                      type="button"
                      className="wx-link-btn wx-body-sm"
                      style={{ fontWeight: 600 }}
                      onClick={() => setRunId(e.id)}
                    >
                      Run {e.id} · {e.leadName}
                    </button>
                    <span className="wx-caption" style={{ display: 'block' }}>
                      Started {e.started} · {e.duration}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <span>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                const next = new URLSearchParams(params)
                next.set('tab', 'workflow')
                setParams(next, { preventScrollReset: true })
              }}
            >
              Open builder
            </Button>
          </span>
        </div>
      )}

      {activeTab === 'workflow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="wx-body-sm">
            Select any node to configure it. <span aria-hidden="true">↓</span> Add steps on any
            connection; conditions split into Yes / No lanes.
          </p>
          <WorkflowCanvas
            workflow={workflow}
            selectedId={selectedId}
            invalidIds={invalidIds}
            onSelect={setSelectedId}
            onAdd={(parentId, branch, type, afterId) => {
              const id = data.addStep(parentId, branch, type, afterId ?? undefined)
              setSelectedId(id)
            }}
          />
        </div>
      )}

      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label className="wx-caption" style={{ maxWidth: 240 }}>
            Status
            <select
              className="wx-select"
              value={data.executionFilter}
              onChange={e => data.setExecutionFilter(e.target.value as 'all')}
              aria-label="Filter runs by status"
            >
              <option value="all">All runs</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          {data.executions.length === 0 ? (
            <EmptyState
              title="No runs for this filter"
              body="Runs appear after the trigger fires. Test the workflow to preview one."
            />
          ) : (
            <ul className="wx-list">
              {data.executions.map(e => (
                <li key={e.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                  <ExecutionStatusBadge status={e.status} />
                  <span style={{ flex: 1 }}>
                    <button
                      type="button"
                      className="wx-link-btn wx-body-sm"
                      style={{ fontWeight: 600 }}
                      onClick={() => setRunId(e.id)}
                      aria-label={`Open run ${e.id}`}
                    >
                      Run {e.id} · {e.leadName}
                    </button>
                    <span className="wx-caption" style={{ display: 'block' }}>
                      Started {e.started} · {e.duration}
                    </span>
                    {e.error && (
                      <span className="wx-field__error" style={{ display: 'block' }}>
                        {e.error}
                      </span>
                    )}
                  </span>
                  {e.status === 'failed' && (
                    <Button variant="secondary" size="sm" onClick={() => data.retryExecution(e.id)}>
                      Retry
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor="wf-name">
              Workflow name
            </label>
            <input
              id="wf-name"
              className="wx-input"
              value={workflow.name}
              onChange={e => data.updateMeta({ name: e.target.value })}
            />
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor="wf-desc">
              Description
            </label>
            <textarea
              id="wf-desc"
              className="wx-textarea"
              rows={2}
              value={workflow.description}
              onChange={e => data.updateMeta({ description: e.target.value })}
            />
          </div>
          <div>
            <p className="wx-field__label" style={{ marginBottom: 8 }}>
              Trigger
            </p>
            <TriggerFields
              trigger={workflow.trigger}
              onChange={data.updateTrigger}
              idPrefix="wf-settings"
            />
          </div>
          <div>
            <p className="wx-field__label" style={{ marginBottom: 8 }}>
              State
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant={workflow.status === 'active' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => data.setWorkflowStatus(workflow.id, 'active')}
                disabled={!canActivate && workflow.status !== 'active'}
                title={
                  !canActivate && workflow.status !== 'active'
                    ? 'Fix configuration issues first'
                    : undefined
                }
              >
                Active
              </Button>
              <Button
                variant={workflow.status === 'disabled' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => data.setWorkflowStatus(workflow.id, 'disabled')}
              >
                Disabled
              </Button>
            </div>
            {!canActivate && workflow.status !== 'active' && (
              <p className="wx-caption" style={{ marginTop: 8 }}>
                Activation is blocked by configuration issues listed above the tabs.
              </p>
            )}
          </div>
          <div>
            <p className="wx-field__label" style={{ marginBottom: 8 }}>
              Danger zone
            </p>
            <Button variant="destructive" size="md" onClick={() => setDeleteOpen(true)}>
              Delete workflow
            </Button>
          </div>
        </div>
      )}

      {selectedId === 'trigger' && (
        <NodeInspector
          key="trigger"
          title="Edit trigger"
          step={null}
          trigger={workflow.trigger}
          onTriggerChange={data.updateTrigger}
          onClose={() => setSelectedId(null)}
        />
      )}
      {selectedStep && (
        <NodeInspector
          key={selectedStep.id}
          title={
            selectedStep.type === 'message'
              ? 'Edit message step'
              : selectedStep.type === 'wait'
                ? 'Edit wait step'
                : selectedStep.type === 'condition'
                  ? 'Edit condition'
                  : selectedStep.type === 'api_call'
                    ? 'Edit API call'
                    : 'Edit lead update'
          }
          step={selectedStep}
          trigger={null}
          onSaveStep={s => data.updateStep(selectedStep.id, () => s)}
          onMove={dir => data.moveStepById(selectedStep.id, dir)}
          onDelete={() => data.removeStepById(selectedStep.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
      {testOpen && (
        <TestRunModal
          workflow={workflow}
          simulate={data.simulateTest}
          onClose={() => setTestOpen(false)}
        />
      )}
      {deleteOpen && (
        <ConfirmDialog
          title={`Delete “${workflow.name}”?`}
          body="Steps, trigger, and draft changes are removed. Past executions stay in history. This cannot be undone."
          confirmLabel="Delete workflow"
          danger
          onConfirm={() => {
            data.deleteWorkflow(workflow.id)
            navigate('/automations')
          }}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
      {activeRun && (
        <ExecutionDrawer
          execution={activeRun}
          onRetry={() => data.retryExecution(activeRun.id)}
          onClose={() => setRunId(null)}
        />
      )}
    </section>
  )
}
