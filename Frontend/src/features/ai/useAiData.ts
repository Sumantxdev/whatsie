import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { agentsMock, aiEventsMock, quotaMock, usageMock } from './mock'
import type { Agent, AgentStatus, AiEventKind, ModelTier, TestMessage } from './types'

/* Mock AI store. No backend, no model calls. Test replies are keyword-mapped. */

export type AiListStatus = 'loading' | 'ready' | 'empty' | 'error'

function mockReply(
  text: string,
  agent: Agent
): { text: string; sources?: string[]; kind: 'answer' | 'escalation' | 'error' } {
  const q = text.toLowerCase()
  if (/fail|broken/.test(q)) return { text: '', kind: 'error' }
  if (/human|person|agent/.test(q)) {
    return {
      text: 'Of course — bringing in a human now. They will have our full conversation for context.',
      kind: 'escalation',
    }
  }
  if (/price|cost|plan/.test(q)) {
    return {
      text:
        agent.knowledge.assignedIds.length > 0
          ? 'The starter pack is $49 with free Sunday delivery this month. (Pricing & plans · Top 40 FAQs)'
          : 'I do not have pricing knowledge assigned yet — ask your workspace admin to attach a source, or I can escalate.',
      sources:
        agent.knowledge.assignedIds.length > 0 ? ['Pricing & plans', 'Top 40 FAQs'] : undefined,
      kind: 'answer',
    }
  }
  return {
    text: `Understood. As ${agent.name}, I would answer from my instructions${agent.knowledge.assignedIds.length > 0 ? ' and assigned knowledge' : ''} — this is a mock reply for testing.`,
    kind: 'answer',
  }
}

let testCounter = 0

export function useAiData(agentId?: string): {
  listStatus: AiListStatus
  searching: boolean
  query: string
  setQuery: (q: string) => void
  statusFilter: AgentStatus | 'all'
  setStatusFilter: (s: AgentStatus | 'all') => void
  resetListFilters: () => void
  agents: Agent[]
  totalCount: number
  agent: Agent | null
  detailNotFound: boolean
  activityFailed: boolean
  dirty: boolean
  saving: boolean
  savedAt: string | null
  updateBehavior: (patch: Partial<Agent['behavior']>) => void
  updateModel: (tier: ModelTier) => void
  toggleKnowledge: (id: string) => void
  updateGuardrails: (patch: Partial<Agent['guardrails']>) => void
  setEscalation: (on: boolean) => void
  setEnabled: (on: boolean) => void
  save: () => void
  discard: () => void
  createAgent: (input: { name: string; purpose: string; tier: ModelTier }) => string
  deleteAgent: () => void
  testMessages: TestMessage[]
  testBusy: boolean
  sendTest: (text: string) => void
  clearTest: () => void
  events: typeof aiEventsMock
  eventFilter: AiEventKind | 'all'
  setEventFilter: (k: AiEventKind | 'all') => void
  usage: typeof usageMock
  quota: typeof quotaMock
  reload: () => void
} {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [store, setStore] = useState<Agent[]>(agentsMock)
  const [query, setQuery] = useState('')
  const [confirmedQuery, setConfirmedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all')
  const [baseline, setBaseline] = useState<Agent[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [testMessages, setTestMessages] = useState<TestMessage[]>([])
  const [testBusy, setTestBusy] = useState(false)
  const [eventFilter, setEventFilter] = useState<AiEventKind | 'all'>('all')
  const timers = useRef<number[]>([])
  const storeRef = useRef<Agent[]>(store)
  const baselineTaken = useRef(false)
  const baselineSnapshot = useRef<Agent[] | null>(null)

  useEffect(() => {
    storeRef.current = store
  }, [store])

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

  useEffect(() => () => timers.current.forEach(t => window.clearTimeout(t)), [])

  const reload = useCallback(() => setNonce(n => n + 1), [])
  const searching = query.trim() !== '' && query !== confirmedQuery

  const agents = useMemo(() => {
    const q = confirmedQuery.trim().toLowerCase()
    return store.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (q !== '' && !`${a.name} ${a.purpose}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [store, confirmedQuery, statusFilter])

  const agent = useMemo(() => store.find(a => a.id === agentId) ?? null, [store, agentId])
  const dirty = useMemo(() => {
    if (!agent || !baseline) return false
    const base = baseline.find(b => b.id === agent.id)
    return base !== undefined && JSON.stringify(base) !== JSON.stringify(agent)
  }, [agent, baseline])

  const patch = useCallback((id: string, fn: (a: Agent) => Agent) => {
    if (!baselineTaken.current) {
      baselineTaken.current = true
      baselineSnapshot.current = storeRef.current
      setBaseline(storeRef.current)
    }
    setStore(prev => prev.map(a => (a.id === id ? fn(a) : a)))
  }, [])

  const updateBehavior = useCallback(
    (p: Partial<Agent['behavior']>) => {
      if (agentId) patch(agentId, a => ({ ...a, behavior: { ...a.behavior, ...p } }))
    },
    [agentId, patch]
  )
  const updateModel = useCallback(
    (tier: ModelTier) => {
      if (agentId) patch(agentId, a => ({ ...a, model: { ...a.model, tier } }))
    },
    [agentId, patch]
  )
  const toggleKnowledge = useCallback(
    (id: string) => {
      if (agentId) {
        patch(agentId, a => ({
          ...a,
          knowledge: {
            assignedIds: a.knowledge.assignedIds.includes(id)
              ? a.knowledge.assignedIds.filter(k => k !== id)
              : [...a.knowledge.assignedIds, id],
          },
        }))
      }
    },
    [agentId, patch]
  )
  const updateGuardrails = useCallback(
    (p: Partial<Agent['guardrails']>) => {
      if (agentId) patch(agentId, a => ({ ...a, guardrails: { ...a.guardrails, ...p } }))
    },
    [agentId, patch]
  )
  const setEscalation = useCallback(
    (on: boolean) => {
      if (agentId) patch(agentId, a => ({ ...a, escalationEnabled: on }))
    },
    [agentId, patch]
  )
  const setEnabled = useCallback(
    (on: boolean) => {
      if (agentId) {
        patch(agentId, a => ({ ...a, status: on ? 'active' : 'inactive' }))
      }
    },
    [agentId, patch]
  )

  const save = useCallback(() => {
    setSaving(true)
    timers.current.push(
      window.setTimeout(() => {
        setSaving(false)
        setSavedAt('just now')
        setBaseline(null)
        baselineSnapshot.current = null
        baselineTaken.current = false
      }, 600)
    )
  }, [])
  const discard = useCallback(() => {
    if (baselineSnapshot.current) setStore(baselineSnapshot.current)
    baselineSnapshot.current = null
    baselineTaken.current = false
    setBaseline(null)
    setSavedAt(null)
  }, [])

  const createAgent = useCallback(
    (input: { name: string; purpose: string; tier: ModelTier }): string => {
      const id = `ag-${Date.now()}`
      setStore(prev => [
        ...prev,
        {
          id,
          name: input.name,
          purpose: input.purpose,
          status: 'configuring',
          channels: [],
          channelConnected: false,
          model: { tier: input.tier, availability: 'available', fallbackTier: 'tier-1' },
          knowledge: { assignedIds: [] },
          guardrails: {
            moderation: false,
            piiRedaction: true,
            blockedTopics: [],
            escalationThreshold: 'standard',
            fallbackMessage: '',
          },
          behavior: { instructions: '', tone: 'friendly', maxLength: 280 },
          escalationEnabled: false,
          lastActive: 'never',
          calls24h: 0,
          fallbackRate: '—',
          attention: [
            'No instructions yet',
            'No knowledge assigned',
            'Channel not connected',
            'Guardrails incomplete',
          ],
        },
      ])
      return id
    },
    []
  )

  const deleteAgent = useCallback(() => {
    if (!agentId) return
    setStore(prev => prev.filter(a => a.id !== agentId))
  }, [agentId])

  const sendTest = useCallback(
    (text: string) => {
      const current = store.find(a => a.id === agentId)
      if (!current || text.trim() === '') return
      testCounter += 1
      const userMsg: TestMessage = { id: `t-u-${testCounter}`, from: 'user', text: text.trim() }
      setTestMessages(prev => [...prev, userMsg])
      setTestBusy(true)
      timers.current.push(
        window.setTimeout(() => {
          const reply = mockReply(text, current)
          testCounter += 1
          if (reply.kind === 'error') {
            setTestMessages(prev => [
              ...prev,
              {
                id: `t-e-${testCounter}`,
                from: 'system',
                text: 'Test failed: mock model timeout. Retry — nothing was sent anywhere.',
              },
            ])
          } else if (reply.kind === 'escalation') {
            setTestMessages(prev => [
              ...prev,
              { id: `t-a-${testCounter}`, from: 'ai', text: reply.text },
              {
                id: `t-s-${testCounter}`,
                from: 'system',
                text: 'Escalation triggered → human takeover (mock)',
              },
            ])
          } else {
            setTestMessages(prev => [
              ...prev,
              { id: `t-a-${testCounter}`, from: 'ai', text: reply.text, sources: reply.sources },
            ])
          }
          setTestBusy(false)
        }, 1200)
      )
    },
    [agentId, store]
  )

  const clearTest = useCallback(() => setTestMessages([]), [])

  const listReady = readyKey === listKey
  let listStatus: AiListStatus = 'ready'
  if (demo === 'loading' || !listReady) listStatus = 'loading'
  else if (demo === 'error') listStatus = 'error'
  else if (demo === 'empty') listStatus = 'empty'
  const visible = demo === 'empty' ? [] : agents
  if (listStatus === 'ready' && visible.length === 0) listStatus = 'empty'

  const events = useMemo(() => {
    const scoped = agentId ? aiEventsMock.filter(e => e.agentId === agentId) : aiEventsMock
    return eventFilter === 'all' ? scoped : scoped.filter(e => e.kind === eventFilter)
  }, [agentId, eventFilter])

  return {
    listStatus,
    searching,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    resetListFilters: () => {
      setQuery('')
      setStatusFilter('all')
    },
    agents: visible,
    totalCount: store.length,
    agent,
    detailNotFound: agentId !== undefined && listReady && demo !== 'error' && !agent,
    activityFailed: demo === 'partial',
    dirty,
    saving,
    savedAt,
    updateBehavior,
    updateModel,
    toggleKnowledge,
    updateGuardrails,
    setEscalation,
    setEnabled,
    save,
    discard,
    createAgent,
    deleteAgent,
    testMessages,
    testBusy,
    sendTest,
    clearTest,
    events,
    eventFilter,
    setEventFilter,
    usage: usageMock,
    quota: quotaMock,
    reload,
  }
}
