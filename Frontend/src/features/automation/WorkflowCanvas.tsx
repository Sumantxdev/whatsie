import { Popover } from '@/design-system/components/overlays'
import { STEP_META } from './types'
import type { Step, StepType, Trigger, Workflow } from './types'
import { StepTypeBadge, TriggerBadge } from './automationUi'
import './Automation.css'

/* Structured vertical canvas: trigger → steps → (condition Yes/No lanes).
   Add-step affordances sit on every connection; reorder via inspector.
   Keyboard-first: every node and add control is a real button. */

function stepSummary(s: Step): string {
  switch (s.type) {
    case 'message':
      return s.message && s.message.text.trim() !== ''
        ? s.message.text.slice(0, 80)
        : 'Empty message'
    case 'wait':
      return s.wait ? `Wait ${s.wait.amount} ${s.wait.unit}` : 'Wait'
    case 'condition':
      return s.condition
        ? `IF ${s.condition.variable} ${s.condition.operator} “${s.condition.value || '…'}”`
        : 'Condition'
    case 'api_call':
      return s.api ? `${s.api.method} ${s.api.url || '…'}` : 'API Call'
    case 'update_lead': {
      if (!s.lead) return 'Update Lead'
      const parts: string[] = []
      if (s.lead.status !== 'no-change') parts.push(`→ ${s.lead.status}`)
      if (s.lead.assignee.trim() !== '') parts.push(`owner: ${s.lead.assignee}`)
      if (s.lead.addTags.trim() !== '') parts.push(`+${s.lead.addTags}`)
      return parts.length > 0 ? `Update Lead ${parts.join(' · ')}` : 'Update Lead (no changes)'
    }
  }
}

function StepMenu({
  onPick,
  label,
}: {
  onPick: (t: StepType) => void
  label: string
}): React.JSX.Element {
  return (
    <Popover
      label={label}
      trigger={
        <button type="button" className="af-add-btn" aria-label={label}>
          +
        </button>
      }
    >
      <div className="af-stepmenu" role="menu" aria-label="Add step">
        {(Object.keys(STEP_META) as StepType[]).map(t => (
          <button key={t} type="button" role="menuitem" onClick={() => onPick(t)}>
            <span className="wx-label">{STEP_META[t].label}</span>
            <span className="wx-caption">{STEP_META[t].hint}</span>
          </button>
        ))}
      </div>
    </Popover>
  )
}

export function WorkflowCanvas({
  workflow,
  selectedId,
  invalidIds,
  onSelect,
  onAdd,
}: {
  workflow: Workflow
  selectedId: string | null
  invalidIds: Set<string>
  onSelect: (id: string | null) => void
  onAdd: (
    parentId: string | null,
    branch: 'main' | 'yes' | 'no',
    type: StepType,
    afterId?: string | null
  ) => void
}): React.JSX.Element {
  const renderLane = (
    steps: Step[],
    parentId: string | null,
    branch: 'main' | 'yes' | 'no'
  ): React.JSX.Element => (
    <>
      {steps.length === 0 && (
        <div className="af-add">
          <StepMenu
            onPick={t => onAdd(parentId, branch, t, null)}
            label={branch === 'main' ? 'Add first step' : `Add step to ${branch} branch`}
          />
        </div>
      )}
      {steps.map((s, i) => (
        <div key={s.id}>
          {renderStep(s)}
          <div className="af-link" aria-hidden="true" />
          <div className="af-add">
            <StepMenu
              onPick={t => onAdd(parentId, branch, t, s.id)}
              label={`Add step after step ${i + 1}${branch === 'main' ? '' : ` in ${branch} branch`}`}
            />
          </div>
          {i < steps.length - 1 && <div className="af-link" aria-hidden="true" />}
        </div>
      ))}
    </>
  )

  const renderStep = (s: Step): React.JSX.Element => {
    const invalid = invalidIds.has(s.id)
    return (
      <div>
        <button
          type="button"
          className="af-node"
          data-selected={String(selectedId === s.id)}
          data-invalid={String(invalid)}
          onClick={() => onSelect(s.id)}
          aria-label={`${STEP_META[s.type].label}: ${stepSummary(s)}${invalid ? ' (needs attention)' : ''}`}
          aria-current={selectedId === s.id ? 'true' : undefined}
        >
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StepTypeBadge type={s.type} />
            {invalid && <span className="wx-badge wx-badge--danger">Needs attention</span>}
          </span>
          <span className="wx-body">{stepSummary(s)}</span>
        </button>
        {s.type === 'condition' && (
          <div className="af-branches" role="group" aria-label="Condition branches">
            <div className="af-branch">
              <span className="af-branch-label wx-badge wx-badge--success">Yes</span>
              {renderLane(s.yes, s.id, 'yes')}
            </div>
            <div className="af-branch">
              <span className="af-branch-label wx-badge wx-badge--neutral">No</span>
              {renderLane(s.no, s.id, 'no')}
            </div>
          </div>
        )}
      </div>
    )
  }

  const t: Trigger = workflow.trigger
  return (
    <div className="af-canvas" role="group" aria-label={`Workflow flow for ${workflow.name}`}>
      <button
        type="button"
        className="af-node af-node--trigger"
        data-selected={String(selectedId === 'trigger')}
        data-invalid={String(t.value.trim() === '')}
        onClick={() => onSelect('trigger')}
        aria-label={`Trigger: ${t.type} ${t.value || '(not configured)'}`}
      >
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="wx-badge wx-badge--accent">Trigger</span>
          <TriggerBadge type={t.type} />
          {t.value.trim() === '' && (
            <span className="wx-badge wx-badge--danger">Needs attention</span>
          )}
        </span>
        <span className="wx-body">
          {t.type === 'keyword' && `When a message contains “${t.value || '…'}”`}
          {t.type === 'intent' && `When intent is “${t.value || '…'}”`}
          {t.type === 'event' && `When event “${t.value || '…'}” occurs`}
        </span>
      </button>
      <div className="af-link" aria-hidden="true" />
      {workflow.steps.length === 0 ? (
        <div className="af-add">
          <StepMenu onPick={type => onAdd(null, 'main', type, null)} label="Add first step" />
        </div>
      ) : (
        renderLane(workflow.steps, null, 'main')
      )}
    </div>
  )
}
