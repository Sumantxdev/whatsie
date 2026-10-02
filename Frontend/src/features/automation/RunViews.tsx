import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/design-system/components/buttons'
import { Drawer, Modal } from '@/design-system/components/overlays'
import { TRIGGER_EVENTS } from './types'
import type { Execution, StepRun, Trigger, Workflow } from './types'
import { ExecutionStatusBadge } from './automationUi'

/* Mock test run: trigger input → progressive simulated step results.
   Everything is labelled simulated; nothing executes. */

export function TestRunModal({
  workflow,
  simulate,
  onClose,
}: {
  workflow: Workflow
  simulate: (input: string) => StepRun[]
  onClose: () => void
}): React.JSX.Element {
  const [input, setInput] = useState('')
  const [started, setStarted] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const [results, setResults] = useState<StepRun[]>([])
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(t => window.clearTimeout(t)), [])

  const t: Trigger = workflow.trigger
  const failed = results.slice(0, revealed).some(r => r.status === 'failed')

  const run = (): void => {
    const out = simulate(input)
    setResults(out)
    setRevealed(0)
    setStarted(true)
    out.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setRevealed(i + 1), 500 * (i + 1)))
    })
  }

  return (
    <Modal
      title={`Test · ${workflow.name}`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            {started ? 'Close' : 'Cancel'}
          </Button>
          {!started && (
            <Button
              variant="primary"
              size="md"
              onClick={run}
              disabled={t.type !== 'event' && input.trim() === ''}
            >
              Run simulation
            </Button>
          )}
          {started && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setStarted(false)
                setRevealed(0)
                setResults([])
              }}
            >
              Run again
            </Button>
          )}
        </>
      }
    >
      <p className="wx-body-sm" role="note" style={{ marginBottom: 12 }}>
        Simulated run — steps are evaluated locally, waits are skipped, no messages or API calls
        leave this browser.
      </p>
      {!started && (
        <>
          {t.type === 'keyword' && (
            <div className="wx-field">
              <label className="wx-field__label" htmlFor="test-input">
                Incoming message *
              </label>
              <input
                id="test-input"
                className="wx-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Try something ${t.match === 'exact' ? 'exactly equal to' : 'containing'} “${t.value}”…`}
              />
            </div>
          )}
          {t.type === 'intent' && (
            <div className="wx-field">
              <label className="wx-field__label" htmlFor="test-input">
                Classified intent
              </label>
              <select
                id="test-input"
                className="wx-select"
                value={input}
                onChange={e => setInput(e.target.value)}
              >
                <option value="">Select an intent…</option>
                <option value={t.value}>{t.value} (this workflow’s intent)</option>
                <option value="greeting">greeting</option>
                <option value="opt_out">opt_out</option>
              </select>
            </div>
          )}
          {t.type === 'event' && (
            <div className="wx-field">
              <label className="wx-field__label" htmlFor="test-input">
                Firing event
              </label>
              <select
                id="test-input"
                className="wx-select"
                value={input || t.value}
                onChange={e => setInput(e.target.value)}
              >
                {TRIGGER_EVENTS.map(ev => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
      {started && (
        <div role="status" aria-label="Simulated execution results">
          {results.length === 0 && (
            <p className="wx-body-sm">No steps to run — add a step first.</p>
          )}
          {results.slice(0, revealed).map(r => (
            <div key={r.stepId} className="af-runstep">
              <span aria-hidden="true">{r.status === 'failed' ? '✕' : '✓'}</span>
              <span style={{ flex: 1 }}>
                <span className="wx-body-sm" style={{ display: 'block', fontWeight: 600 }}>
                  {r.label}
                </span>
                {r.detail && <span className="wx-caption">{r.detail} (simulated)</span>}
                {r.error && (
                  <span className="wx-field__error" style={{ display: 'block' }} role="alert">
                    {r.error}
                  </span>
                )}
              </span>
            </div>
          ))}
          {revealed < results.length && <p className="wx-body-sm">Running…</p>}
          {revealed >= results.length && results.length > 0 && (
            <p className="wx-body-sm" role="status" style={{ marginTop: 8 }}>
              {failed
                ? 'Simulation finished with a failure — fix the flagged step and run again.'
                : 'Simulation finished successfully.'}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

export function ExecutionDrawer({
  execution,
  onRetry,
  onClose,
}: {
  execution: Execution
  onRetry: () => void
  onClose: () => void
}): React.JSX.Element {
  return (
    <Drawer title={`Run ${execution.id}`} onClose={onClose} large>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <ExecutionStatusBadge status={execution.status} />
        <span className="wx-body-sm">
          {execution.workflowName} · {execution.triggerLabel}
        </span>
      </div>
      <p className="wx-body-sm" style={{ marginBottom: 4 }}>
        Lead:{' '}
        {execution.leadId ? (
          <Link to={`/contacts/${execution.leadId}`}>{execution.leadName}</Link>
        ) : (
          execution.leadName
        )}
        {execution.conversationId && (
          <>
            {' '}
            · <Link to={`/inbox/${execution.conversationId}`}>Open conversation →</Link>
          </>
        )}
      </p>
      <p className="wx-caption" style={{ marginBottom: 16 }}>
        Started {execution.started} · duration {execution.duration}
      </p>
      {execution.error && (
        <p role="alert" className="wx-field__error" style={{ marginBottom: 12 }}>
          {execution.error}
        </p>
      )}
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {execution.steps.map(s => (
          <li key={s.stepId} className="af-runstep">
            <span aria-hidden="true">
              {s.status === 'failed'
                ? '✕'
                : s.status === 'done'
                  ? '✓'
                  : s.status === 'running'
                    ? '…'
                    : s.status === 'skipped'
                      ? '–'
                      : '○'}
            </span>
            <span style={{ flex: 1 }}>
              <span className="wx-body-sm" style={{ display: 'block', fontWeight: 600 }}>
                {s.label}
              </span>
              <span className="wx-caption">
                Status: {s.status}
                {s.detail ? ` · ${s.detail}` : ''}
              </span>
              {s.error && (
                <span className="wx-field__error" style={{ display: 'block' }} role="alert">
                  {s.error}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      {execution.status === 'failed' && (
        <p style={{ marginTop: 16 }}>
          <Button variant="primary" size="md" onClick={onRetry}>
            Retry run
          </Button>
        </p>
      )}
      {execution.status === 'running' && (
        <p className="wx-caption" style={{ marginTop: 16 }}>
          Live progress would stream here once the backend is connected.
        </p>
      )}
    </Drawer>
  )
}
