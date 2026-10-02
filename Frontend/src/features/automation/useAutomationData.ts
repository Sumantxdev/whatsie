import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { executionMock, templateMock, workflowMock } from './mock'
import type {
  Execution,
  ExecutionStatus,
  Step,
  StepRun,
  StepType,
  Trigger,
  TriggerType,
  Workflow,
  WorkflowStatus,
} from './types'

/* Mock automation store. No backend, queues, or webhooks. Test runs and
   retries are simulated with timers and labelled as such in the UI. */

export type AutomationListStatus = 'loading' | 'ready' | 'empty' | 'error'

let stepCounter = 0
const newId = (): string => `s-local-${Date.now()}-${(stepCounter += 1)}`

export function blankStep(type: StepType): Step {
  const base = { id: newId(), type, yes: [], no: [] } as Step
  switch (type) {
    case 'message':
      return { ...base, message: { text: '' } }
    case 'wait':
      return { ...base, wait: { amount: 1, unit: 'hours' as const } }
    case 'condition':
      return { ...base, condition: { variable: 'lead.status', operator: 'equals', value: '' } }
    case 'api_call':
      return { ...base, api: { method: 'GET', url: 'https://', headers: [], body: '' } }
    case 'update_lead':
      return { ...base, lead: { status: 'no-change', assignee: '', addTags: '' } }
  }
}

function mapSteps(steps: Step[], id: string, fn: (s: Step) => Step): Step[] {
  return steps.map(s => {
    if (s.id === id) return fn(s)
    if (s.type === 'condition' && (s.yes.length > 0 || s.no.length > 0)) {
      return { ...s, yes: mapSteps(s.yes, id, fn), no: mapSteps(s.no, id, fn) }
    }
    return s
  })
}

function removeStep(steps: Step[], id: string): Step[] {
  return steps
    .filter(s => s.id !== id)
    .map(s =>
      s.type === 'condition' ? { ...s, yes: removeStep(s.yes, id), no: removeStep(s.no, id) } : s
    )
}

function moveStep(steps: Step[], id: string, dir: -1 | 1): Step[] {
  const i = steps.findIndex(s => s.id === id)
  if (i >= 0) {
    const j = i + dir
    if (j < 0 || j >= steps.length) return steps
    const copy = [...steps]
    const [item] = copy.splice(i, 1)
    if (item) copy.splice(j, 0, item)
    return copy
  }
  return steps.map(s =>
    s.type === 'condition'
      ? { ...s, yes: moveStep(s.yes, id, dir), no: moveStep(s.no, id, dir) }
      : s
  )
}

export function stepError(step: Step): string | undefined {
  switch (step.type) {
    case 'message':
      if (step.message === undefined || step.message.text.trim() === '')
        return 'Message text is required.'
      if (step.message.text.length > 2000) return 'Keep under 2000 characters (WhatsApp limit).'
      return undefined
    case 'wait':
      if (step.wait === undefined || !(step.wait.amount > 0))
        return 'Delay must be greater than zero.'
      return undefined
    case 'condition':
      if (step.condition === undefined || step.condition.value.trim() === '')
        return 'Condition needs a value to compare.'
      return undefined
    case 'api_call': {
      if (step.api === undefined) return 'API configuration is required.'
      try {
        const u = new URL(step.api.url.trim())
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'URL must use http(s)://…'
      } catch {
        return 'Enter a valid URL.'
      }
      return undefined
    }
    case 'update_lead':
      if (step.lead === undefined) return 'Lead update is required.'
      if (
        step.lead.status === 'no-change' &&
        step.lead.assignee.trim() === '' &&
        step.lead.addTags.trim() === ''
      ) {
        return 'Change at least one lead property.'
      }
      return undefined
  }
}

export function workflowIssues(w: Workflow): Array<{ stepId: string | null; message: string }> {
  const issues: Array<{ stepId: string | null; message: string }> = []
  if (w.trigger.value.trim() === '')
    issues.push({ stepId: null, message: 'Trigger needs a value.' })
  if (w.steps.length === 0) issues.push({ stepId: null, message: 'Add at least one step.' })
  const walk = (steps: Step[]): void => {
    steps.forEach(s => {
      const e = stepError(s)
      if (e !== undefined) issues.push({ stepId: s.id, message: e })
      if (s.type === 'condition') walk([...s.yes, ...s.no])
    })
  }
  walk(w.steps)
  return issues
}

export function useAutomationData(workflowId?: string): {
  listStatus: AutomationListStatus
  searching: boolean
  query: string
  setQuery: (q: string) => void
  statusFilter: WorkflowStatus | 'all'
  setStatusFilter: (s: WorkflowStatus | 'all') => void
  triggerFilter: TriggerType | 'all'
  setTriggerFilter: (t: TriggerType | 'all') => void
  resetFilters: () => void
  workflows: Workflow[]
  totalCount: number
  stats: { total: number; active: number; draft: number; failed24h: number; runs24h: number }
  createWorkflow: (input: { name: string; description: string; trigger: Trigger }) => string
  duplicateWorkflow: (id: string) => string
  deleteWorkflow: (id: string) => void
  setWorkflowStatus: (id: string, s: WorkflowStatus) => void
  workflow: Workflow | null
  detailNotFound: boolean
  dirty: boolean
  saving: boolean
  savedAt: string | null
  updateTrigger: (t: Trigger) => void
  updateMeta: (patch: Partial<Pick<Workflow, 'name' | 'description'>>) => void
  addStep: (
    parentId: string | null,
    branch: 'main' | 'yes' | 'no',
    type: StepType,
    afterId?: string | null
  ) => string
  updateStep: (id: string, fn: (s: Step) => Step) => void
  removeStepById: (id: string) => void
  moveStepById: (id: string, dir: -1 | 1) => void
  saveWorkflow: () => void
  discardWorkflow: () => void
  executions: Execution[]
  executionFilter: ExecutionStatus | 'all'
  setExecutionFilter: (s: ExecutionStatus | 'all') => void
  retryExecution: (id: string) => void
  simulateTest: (input: string) => StepRun[]
  templates: typeof templateMock
  instantiateTemplate: (id: string) => string
  reload: () => void
} {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [store, setStore] = useState<Workflow[]>(workflowMock)
  const [runs, setRuns] = useState<Execution[]>(executionMock)
  const [query, setQuery] = useState('')
  const [confirmedQuery, setConfirmedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all')
  const [triggerFilter, setTriggerFilter] = useState<TriggerType | 'all'>('all')
  const [executionFilter, setExecutionFilter] = useState<ExecutionStatus | 'all'>('all')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const timers = useRef<number[]>([])
  const storeRef = useRef<Workflow[]>(store)
  const taken = useRef(false)
  const snapshot = useRef<Workflow[] | null>(null)
  const [baseline, setBaseline] = useState<Workflow[] | null>(null)

  const listKey = `${demo ?? 'live'}:${nonce}`
  useEffect(() => {
    if (demo === 'loading') return
    const t = window.setTimeout(() => setReadyKey(listKey), 450)
    return () => window.clearTimeout(t)
  }, [demo, nonce, listKey])

  useEffect(() => {
    if (query === confirmedQuery) return
    const t = window.setTimeout(() => setConfirmedQuery(query), 300)
    return () => window.clearTimeout(t)
  }, [query, confirmedQuery])

  useEffect(() => {
    storeRef.current = store
  }, [store])

  useEffect(() => () => timers.current.forEach(t => window.clearTimeout(t)), [])

  const reload = useCallback(() => setNonce(n => n + 1), [])
  const searching = query.trim() !== '' && query !== confirmedQuery

  const resetFilters = useCallback(() => {
    setQuery('')
    setStatusFilter('all')
    setTriggerFilter('all')
  }, [])

  const workflows = useMemo(() => {
    const q = confirmedQuery.trim().toLowerCase()
    return store.filter(w => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false
      if (triggerFilter !== 'all' && w.trigger.type !== triggerFilter) return false
      if (
        q !== '' &&
        !`${w.name} ${w.description} ${w.trigger.type} ${w.trigger.value}`.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [store, confirmedQuery, statusFilter, triggerFilter])

  const stats = useMemo(() => {
    const failed24h = runs.filter(r => r.status === 'failed').length
    const runs24h = store.reduce((sum, w) => sum + w.runs24h, 0)
    return {
      total: store.length,
      active: store.filter(w => w.status === 'active').length,
      draft: store.filter(w => w.status === 'draft').length,
      failed24h,
      runs24h,
    }
  }, [store, runs])

  const workflow = useMemo(() => store.find(w => w.id === workflowId) ?? null, [store, workflowId])
  const dirty = useMemo(() => {
    if (!workflow || !baseline) return false
    const base = baseline.find(b => b.id === workflow.id)
    return base !== undefined && JSON.stringify(base) !== JSON.stringify(workflow)
  }, [workflow, baseline])

  const touch = useCallback(() => {
    if (!taken.current) {
      taken.current = true
      snapshot.current = storeRef.current
      setBaseline(storeRef.current)
    }
    setSavedAt(null)
  }, [])

  const patchWorkflow = useCallback(
    (id: string, fn: (w: Workflow) => Workflow) => {
      touch()
      setStore(prev => prev.map(w => (w.id === id ? fn(w) : w)))
    },
    [touch]
  )

  const createWorkflow = useCallback(
    (input: { name: string; description: string; trigger: Trigger }): string => {
      const id = `wf-${Date.now()}`
      setStore(prev => [
        ...prev,
        {
          id,
          name: input.name,
          description: input.description,
          status: 'draft',
          trigger: input.trigger,
          steps: [],
          updated: 'just now',
          runs24h: 0,
          failRate: '—',
          lastRun: 'never',
        },
      ])
      return id
    },
    []
  )

  const duplicateWorkflow = useCallback((id: string): string => {
    const src = storeRef.current.find(w => w.id === id)
    const copyId = `wf-${Date.now()}`
    if (src) {
      const clone: Workflow = JSON.parse(
        JSON.stringify({
          ...src,
          id: copyId,
          name: `${src.name} (copy)`,
          status: 'draft' as const,
          updated: 'just now',
          runs24h: 0,
          lastRun: 'never',
        })
      )
      setStore(prev => [...prev, clone])
    }
    return copyId
  }, [])

  const deleteWorkflow = useCallback((id: string) => {
    setStore(prev => prev.filter(w => w.id !== id))
  }, [])

  const setWorkflowStatus = useCallback((id: string, s: WorkflowStatus) => {
    setStore(prev => prev.map(w => (w.id === id ? { ...w, status: s } : w)))
  }, [])

  const updateTrigger = useCallback(
    (t: Trigger) => {
      if (workflowId) patchWorkflow(workflowId, w => ({ ...w, trigger: t }))
    },
    [workflowId, patchWorkflow]
  )
  const updateMeta = useCallback(
    (p: Partial<Pick<Workflow, 'name' | 'description'>>) => {
      if (workflowId) patchWorkflow(workflowId, w => ({ ...w, ...p }))
    },
    [workflowId, patchWorkflow]
  )

  const addStep = useCallback(
    (
      parentId: string | null,
      branch: 'main' | 'yes' | 'no',
      type: StepType,
      afterId?: string | null
    ): string => {
      const step = blankStep(type)
      if (!workflowId) return step.id
      patchWorkflow(workflowId, w => {
        if (parentId === null) {
          const steps = [...w.steps]
          const at = afterId ? steps.findIndex(s => s.id === afterId) + 1 : steps.length
          steps.splice(at < 0 ? steps.length : at, 0, step)
          return { ...w, steps }
        }
        return {
          ...w,
          steps: mapSteps(w.steps, parentId, s => {
            if (s.type !== 'condition') return s
            const lane = branch === 'no' ? [...s.no] : [...s.yes]
            const at = afterId ? lane.findIndex(x => x.id === afterId) + 1 : lane.length
            lane.splice(at < 0 ? lane.length : at, 0, step)
            return branch === 'no' ? { ...s, no: lane } : { ...s, yes: lane }
          }),
        }
      })
      return step.id
    },
    [workflowId, patchWorkflow]
  )

  const updateStep = useCallback(
    (id: string, fn: (s: Step) => Step) => {
      if (workflowId) patchWorkflow(workflowId, w => ({ ...w, steps: mapSteps(w.steps, id, fn) }))
    },
    [workflowId, patchWorkflow]
  )
  const removeStepById = useCallback(
    (id: string) => {
      if (workflowId) patchWorkflow(workflowId, w => ({ ...w, steps: removeStep(w.steps, id) }))
    },
    [workflowId, patchWorkflow]
  )
  const moveStepById = useCallback(
    (id: string, dir: -1 | 1) => {
      if (workflowId) patchWorkflow(workflowId, w => ({ ...w, steps: moveStep(w.steps, id, dir) }))
    },
    [workflowId, patchWorkflow]
  )

  const saveWorkflow = useCallback(() => {
    setSaving(true)
    timers.current.push(
      window.setTimeout(() => {
        setSaving(false)
        setSavedAt('just now')
        setBaseline(null)
        snapshot.current = null
        taken.current = false
        setStore(prev => prev.map(w => (w.id === workflowId ? { ...w, updated: 'just now' } : w)))
      }, 600)
    )
  }, [workflowId])

  const discardWorkflow = useCallback(() => {
    if (snapshot.current) setStore(snapshot.current)
    snapshot.current = null
    taken.current = false
    setBaseline(null)
    setSavedAt(null)
  }, [])

  const executions = useMemo(() => {
    const scoped = workflowId ? runs.filter(r => r.workflowId === workflowId) : runs
    return executionFilter === 'all' ? scoped : scoped.filter(r => r.status === executionFilter)
  }, [runs, workflowId, executionFilter])

  const retryExecution = useCallback((id: string) => {
    setRuns(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'running', error: undefined } : r))
    )
    timers.current.push(
      window.setTimeout(() => {
        setRuns(prev =>
          prev.map(r =>
            r.id === id
              ? {
                  ...r,
                  status: 'completed',
                  duration: '41s',
                  steps: r.steps.map(s => ({ ...s, status: 'done' as const, error: undefined })),
                }
              : r
          )
        )
      }, 1500)
    )
  }, [])

  const simulateTest = useCallback(
    (input: string): StepRun[] => {
      const w = storeRef.current.find(x => x.id === workflowId)
      if (!w) return []
      const out: StepRun[] = []
      const q = input.toLowerCase()
      const walk = (steps: Step[]): void => {
        steps.forEach(s => {
          if (s.type === 'condition' && s.condition) {
            const hit =
              s.condition.variable === 'message.text' && s.condition.operator === 'contains'
                ? q.includes(s.condition.value.toLowerCase())
                : true
            out.push({
              stepId: s.id,
              label: `Condition → ${hit ? 'Yes' : 'No'}`,
              status: 'done',
              detail: `Matched branch: ${hit ? 'Yes' : 'No'} (simulated)`,
            })
            walk(hit ? s.yes : s.no)
          } else if (s.type === 'wait' && s.wait) {
            out.push({
              stepId: s.id,
              label: `Wait ${s.wait.amount} ${s.wait.unit}`,
              status: 'done',
              detail: 'Delay simulated — not actually waited',
            })
          } else if (s.type === 'api_call' && s.api) {
            const bad = s.api.url.includes('fail')
            out.push({
              stepId: s.id,
              label: `API ${s.api.method}`,
              status: bad ? 'failed' : 'done',
              detail: bad ? undefined : '200 · mock response',
              error: bad ? 'Connection refused (simulated)' : undefined,
            })
          } else if (s.type === 'update_lead' && s.lead) {
            out.push({
              stepId: s.id,
              label: `Update Lead → ${s.lead.status}`,
              status: 'done',
              detail: 'CRM write simulated',
            })
          } else {
            out.push({
              stepId: s.id,
              label: 'Send Message',
              status: 'done',
              detail: 'Delivery simulated',
            })
          }
        })
      }
      walk(w.steps)
      return out
    },
    [workflowId]
  )

  const instantiateTemplate = useCallback((id: string): string => {
    const t = templateMock.find(x => x.id === id)
    const newId = `wf-${Date.now()}`
    if (!t) return newId
    const seed = workflowMock.find(w => w.name === t.name)
    const steps: Step[] = seed ? JSON.parse(JSON.stringify(seed.steps)) : []
    setStore(prev => [
      ...prev,
      {
        id: newId,
        name: t.name,
        description: t.description,
        status: 'draft',
        trigger: { ...t.trigger },
        steps,
        updated: 'just now',
        runs24h: 0,
        failRate: '—',
        lastRun: 'never',
      },
    ])
    return newId
  }, [])

  const listReady = readyKey === listKey
  let listStatus: AutomationListStatus = 'ready'
  if (demo === 'loading' || !listReady) listStatus = 'loading'
  else if (demo === 'error') listStatus = 'error'
  else if (demo === 'empty') listStatus = 'empty'
  const visible = demo === 'empty' ? [] : workflows
  if (listStatus === 'ready' && visible.length === 0) listStatus = 'empty'

  return {
    listStatus,
    searching,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    triggerFilter,
    setTriggerFilter,
    resetFilters,
    workflows: visible,
    totalCount: store.length,
    stats,
    createWorkflow,
    duplicateWorkflow,
    deleteWorkflow,
    setWorkflowStatus,
    workflow,
    detailNotFound: workflowId !== undefined && listReady && demo !== 'error' && !workflow,
    dirty,
    saving,
    savedAt,
    updateTrigger,
    updateMeta,
    addStep,
    updateStep,
    removeStepById,
    moveStepById,
    saveWorkflow,
    discardWorkflow,
    executions,
    executionFilter,
    setExecutionFilter,
    retryExecution,
    simulateTest,
    templates: templateMock,
    instantiateTemplate,
    reload,
  }
}
