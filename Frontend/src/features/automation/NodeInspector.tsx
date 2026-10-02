import { useState } from 'react'
import { Button } from '@/design-system/components/buttons'
import { Drawer } from '@/design-system/components/overlays'
import { TRIGGER_EVENTS } from './types'
import type { Step, Trigger, TriggerType } from './types'
import { stepError } from './useAutomationData'

/* Contextual inspector: trigger or one step. Draft-edits locally, validates,
   then saves. Delete / reorder live in the footer. Temporary drawer only. */

export function TriggerFields({
  trigger,
  onChange,
  idPrefix,
}: {
  trigger: Trigger
  onChange: (t: Trigger) => void
  idPrefix: string
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="wx-field">
        <label className="wx-field__label" htmlFor={`${idPrefix}-ttype`}>
          Trigger type
        </label>
        <select
          id={`${idPrefix}-ttype`}
          className="wx-select"
          value={trigger.type}
          onChange={e => onChange({ ...trigger, type: e.target.value as TriggerType })}
        >
          <option value="keyword">Keyword — match message text</option>
          <option value="intent">Intent — match classified intent</option>
          <option value="event">Event — react to platform events</option>
        </select>
      </div>
      {trigger.type === 'keyword' && (
        <>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${idPrefix}-tval`}>
              Keyword *
            </label>
            <input
              id={`${idPrefix}-tval`}
              className="wx-input"
              value={trigger.value}
              onChange={e => onChange({ ...trigger, value: e.target.value })}
              placeholder="pricing"
            />
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${idPrefix}-tmatch`}>
              Matching
            </label>
            <select
              id={`${idPrefix}-tmatch`}
              className="wx-select"
              value={trigger.match ?? 'contains'}
              onChange={e =>
                onChange({ ...trigger, match: e.target.value as 'contains' | 'exact' })
              }
            >
              <option value="contains">Contains — fires anywhere in the message</option>
              <option value="exact">Exact — fires on exact match only</option>
            </select>
          </div>
        </>
      )}
      {trigger.type === 'intent' && (
        <div className="wx-field">
          <label className="wx-field__label" htmlFor={`${idPrefix}-tval`}>
            Intent name *
          </label>
          <input
            id={`${idPrefix}-tval`}
            className="wx-input"
            value={trigger.value}
            onChange={e => onChange({ ...trigger, value: e.target.value })}
            placeholder="pricing_inquiry"
          />
          <p className="wx-caption">
            Must match an intent from classification, e.g. pricing_inquiry.
          </p>
        </div>
      )}
      {trigger.type === 'event' && (
        <div className="wx-field">
          <label className="wx-field__label" htmlFor={`${idPrefix}-tval`}>
            Event *
          </label>
          <select
            id={`${idPrefix}-tval`}
            className="wx-select"
            value={trigger.value}
            onChange={e => onChange({ ...trigger, value: e.target.value })}
          >
            <option value="">Select an event…</option>
            {TRIGGER_EVENTS.map(ev => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </div>
      )}
      {trigger.value.trim() === '' && (
        <p role="alert" className="wx-field__error">
          Trigger needs a value.
        </p>
      )}
    </div>
  )
}

function StepFields({
  step,
  onChange,
  idPrefix,
}: {
  step: Step
  onChange: (s: Step) => void
  idPrefix: string
}): React.JSX.Element {
  switch (step.type) {
    case 'message': {
      const len = step.message?.text.length ?? 0
      return (
        <div className="wx-field">
          <label className="wx-field__label" htmlFor={`${idPrefix}-text`}>
            Message text *
          </label>
          <textarea
            id={`${idPrefix}-text`}
            className="wx-textarea"
            rows={4}
            value={step.message?.text ?? ''}
            onChange={e => onChange({ ...step, message: { text: e.target.value } })}
            placeholder="Hi {name}! …"
          />
          <p className="wx-caption">
            {len} / 2000 characters · {'{name}'} and {'{phone}'} are filled per lead.
          </p>
        </div>
      )
    }
    case 'wait':
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="wx-field" style={{ flex: 1 }}>
            <label className="wx-field__label" htmlFor={`${idPrefix}-amount`}>
              Delay *
            </label>
            <input
              id={`${idPrefix}-amount`}
              type="number"
              min={1}
              className="wx-input"
              value={step.wait?.amount ?? 1}
              onChange={e =>
                onChange({
                  ...step,
                  wait: { amount: Number(e.target.value), unit: step.wait?.unit ?? 'hours' },
                })
              }
            />
          </div>
          <div className="wx-field" style={{ flex: 1 }}>
            <label className="wx-field__label" htmlFor={`${idPrefix}-unit`}>
              Unit
            </label>
            <select
              id={`${idPrefix}-unit`}
              className="wx-select"
              value={step.wait?.unit ?? 'hours'}
              onChange={e =>
                onChange({
                  ...step,
                  wait: {
                    amount: step.wait?.amount ?? 1,
                    unit: e.target.value as NonNullable<Step['wait']>['unit'],
                  },
                })
              }
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        </div>
      )
    case 'condition':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="wx-body-sm">
            IF [variable] [operator] [value] — matching messages take Yes, others take No.
          </p>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${idPrefix}-var`}>
              Variable
            </label>
            <select
              id={`${idPrefix}-var`}
              className="wx-select"
              value={step.condition?.variable ?? 'lead.status'}
              onChange={e =>
                onChange({
                  ...step,
                  condition: {
                    variable: e.target.value as NonNullable<Step['condition']>['variable'],
                    operator: step.condition?.operator ?? 'equals',
                    value: step.condition?.value ?? '',
                  },
                })
              }
            >
              <option value="lead.status">lead.status</option>
              <option value="message.text">message.text</option>
              <option value="contact.tag">contact.tag</option>
              <option value="conversation.state">conversation.state</option>
            </select>
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${idPrefix}-op`}>
              Operator
            </label>
            <select
              id={`${idPrefix}-op`}
              className="wx-select"
              value={step.condition?.operator ?? 'equals'}
              onChange={e =>
                onChange({
                  ...step,
                  condition: {
                    variable: step.condition?.variable ?? 'lead.status',
                    operator: e.target.value as NonNullable<Step['condition']>['operator'],
                    value: step.condition?.value ?? '',
                  },
                })
              }
            >
              <option value="equals">equals</option>
              <option value="contains">contains</option>
              <option value="is">is</option>
            </select>
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${idPrefix}-cval`}>
              Value *
            </label>
            <input
              id={`${idPrefix}-cval`}
              className="wx-input"
              value={step.condition?.value ?? ''}
              onChange={e =>
                onChange({
                  ...step,
                  condition: {
                    variable: step.condition?.variable ?? 'lead.status',
                    operator: step.condition?.operator ?? 'equals',
                    value: e.target.value,
                  },
                })
              }
              placeholder="qualified"
            />
          </div>
        </div>
      )
    case 'api_call': {
      const headers = step.api?.headers ?? []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="wx-caption">
            Mock only — nothing is sent. Secrets are never shown; paste placeholders.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="wx-field" style={{ width: 130 }}>
              <label className="wx-field__label" htmlFor={`${idPrefix}-method`}>
                Method
              </label>
              <select
                id={`${idPrefix}-method`}
                className="wx-select"
                value={step.api?.method ?? 'GET'}
                onChange={e =>
                  onChange({
                    ...step,
                    api: {
                      method: e.target.value as NonNullable<Step['api']>['method'],
                      url: step.api?.url ?? '',
                      headers,
                      body: step.api?.body ?? '',
                    },
                  })
                }
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="wx-field" style={{ flex: 1 }}>
              <label className="wx-field__label" htmlFor={`${idPrefix}-url`}>
                URL *
              </label>
              <input
                id={`${idPrefix}-url`}
                className="wx-input"
                inputMode="url"
                value={step.api?.url ?? ''}
                onChange={e =>
                  onChange({
                    ...step,
                    api: {
                      method: step.api?.method ?? 'GET',
                      url: e.target.value,
                      headers,
                      body: step.api?.body ?? '',
                    },
                  })
                }
                placeholder="https://crm.example.com/api/…"
              />
            </div>
          </div>
          <div>
            <p className="wx-field__label">Headers</p>
            {headers.length === 0 && <p className="wx-caption">None.</p>}
            {headers.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  className="wx-input"
                  placeholder="Header"
                  value={h.key}
                  aria-label={`Header ${i + 1} name`}
                  onChange={e =>
                    onChange({
                      ...step,
                      api: {
                        method: step.api?.method ?? 'GET',
                        url: step.api?.url ?? '',
                        headers: headers.map((x, j) =>
                          j === i ? { ...x, key: e.target.value } : x
                        ),
                        body: step.api?.body ?? '',
                      },
                    })
                  }
                />
                <input
                  className="wx-input"
                  placeholder="Value"
                  value={h.value}
                  aria-label={`Header ${i + 1} value`}
                  onChange={e =>
                    onChange({
                      ...step,
                      api: {
                        method: step.api?.method ?? 'GET',
                        url: step.api?.url ?? '',
                        headers: headers.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x
                        ),
                        body: step.api?.body ?? '',
                      },
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange({
                      ...step,
                      api: {
                        method: step.api?.method ?? 'GET',
                        url: step.api?.url ?? '',
                        headers: headers.filter((_, j) => j !== i),
                        body: step.api?.body ?? '',
                      },
                    })
                  }
                  aria-label={`Remove header ${i + 1}`}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onChange({
                  ...step,
                  api: {
                    method: step.api?.method ?? 'GET',
                    url: step.api?.url ?? '',
                    headers: [...headers, { key: '', value: '' }],
                    body: step.api?.body ?? '',
                  },
                })
              }
            >
              Add header
            </Button>
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${idPrefix}-body`}>
              Body (JSON)
            </label>
            <textarea
              id={`${idPrefix}-body`}
              className="wx-textarea wx-mono"
              rows={3}
              value={step.api?.body ?? ''}
              onChange={e =>
                onChange({
                  ...step,
                  api: {
                    method: step.api?.method ?? 'GET',
                    url: step.api?.url ?? '',
                    headers,
                    body: e.target.value,
                  },
                })
              }
              placeholder={'{\n  "phone": "{phone}"\n}'}
            />
          </div>
        </div>
      )
    }
    case 'update_lead':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${idPrefix}-stage`}>
              Lead stage
            </label>
            <select
              id={`${idPrefix}-stage`}
              className="wx-select"
              value={step.lead?.status ?? 'no-change'}
              onChange={e =>
                onChange({
                  ...step,
                  lead: {
                    status: e.target.value as NonNullable<Step['lead']>['status'],
                    assignee: step.lead?.assignee ?? '',
                    addTags: step.lead?.addTags ?? '',
                  },
                })
              }
            >
              <option value="no-change">No change</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${idPrefix}-owner`}>
              Assign owner
            </label>
            <input
              id={`${idPrefix}-owner`}
              className="wx-input"
              value={step.lead?.assignee ?? ''}
              onChange={e =>
                onChange({
                  ...step,
                  lead: {
                    status: step.lead?.status ?? 'no-change',
                    assignee: e.target.value,
                    addTags: step.lead?.addTags ?? '',
                  },
                })
              }
              placeholder="Leave blank to keep current owner"
            />
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor={`${idPrefix}-tags`}>
              Add tags (comma-separated)
            </label>
            <input
              id={`${idPrefix}-tags`}
              className="wx-input"
              value={step.lead?.addTags ?? ''}
              onChange={e =>
                onChange({
                  ...step,
                  lead: {
                    status: step.lead?.status ?? 'no-change',
                    assignee: step.lead?.assignee ?? '',
                    addTags: e.target.value,
                  },
                })
              }
              placeholder="hot-lead, vip"
            />
          </div>
        </div>
      )
  }
}

export function NodeInspector({
  title,
  step,
  trigger,
  onTriggerChange,
  onSaveStep,
  onMove,
  onDelete,
  onClose,
}: {
  title: string
  step: Step | null
  trigger: Trigger | null
  onTriggerChange?: (t: Trigger) => void
  onSaveStep?: (s: Step) => void
  onMove?: (dir: -1 | 1) => void
  onDelete?: () => void
  onClose: () => void
}): React.JSX.Element {
  const [draftStep, setDraftStep] = useState<Step | null>(step)
  const [draftTrigger, setDraftTrigger] = useState<Trigger | null>(trigger)
  const [error, setError] = useState<string | undefined>()

  const save = (): void => {
    if (draftStep && onSaveStep) {
      const e = stepError(draftStep)
      if (e !== undefined) {
        setError(e)
        return
      }
      onSaveStep(draftStep)
      onClose()
    } else if (draftTrigger && onTriggerChange) {
      if (draftTrigger.value.trim() === '') {
        setError('Trigger needs a value.')
        return
      }
      onTriggerChange(draftTrigger)
      onClose()
    }
  }

  return (
    <Drawer title={title} onClose={onClose}>
      {draftTrigger && (
        <TriggerFields trigger={draftTrigger} onChange={setDraftTrigger} idPrefix="insp-trig" />
      )}
      {draftStep && step && (
        <StepFields step={draftStep} onChange={setDraftStep} idPrefix={`insp-${step.id}`} />
      )}
      {error && (
        <p role="alert" className="wx-field__error" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
        {onDelete && (
          <Button
            variant="destructive"
            size="md"
            onClick={() => {
              onDelete()
              onClose()
            }}
          >
            Delete
          </Button>
        )}
        {onMove && (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onMove(-1)}
              aria-label="Move step up"
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onMove(1)}
              aria-label="Move step down"
            >
              ↓
            </Button>
          </>
        )}
        <span style={{ flex: 1 }} />
        <Button variant="secondary" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={save}>
          Save
        </Button>
      </div>
    </Drawer>
  )
}
