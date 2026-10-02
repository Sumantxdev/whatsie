import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { kbActivityMock, kbMock } from './mock'
import type { KbActivity, KbSource, KbSourceType, KbStatus, NewSourceInput } from './types'

/* Mock KB store. No backend, uploads, or embeddings. Processing transitions
   are simulated with timers; a real API would replace these seams. */

export type KbListStatus = 'loading' | 'ready' | 'empty' | 'error'

let kbCounter = 0

export function useKbData(sourceId?: string): {
  listStatus: KbListStatus
  searching: boolean
  query: string
  setQuery: (q: string) => void
  typeFilter: KbSourceType | 'all'
  setTypeFilter: (t: KbSourceType | 'all') => void
  statusFilter: KbStatus | 'all'
  setStatusFilter: (s: KbStatus | 'all') => void
  agentFilter: string
  setAgentFilter: (id: string) => void
  showArchived: boolean
  setShowArchived: (v: boolean) => void
  resetFilters: () => void
  sources: KbSource[]
  totalCount: number
  stats: {
    total: number
    indexed: number
    processing: number
    attention: number
    agentsUsing: number
  }
  source: KbSource | null
  detailNotFound: boolean
  dirty: boolean
  saving: boolean
  savedAt: string | null
  updateMeta: (patch: Partial<Pick<KbSource, 'title' | 'description' | 'tags'>>) => void
  saveMeta: () => void
  discardMeta: () => void
  retryProcessing: () => void
  archiveSource: () => void
  restoreSource: () => void
  deleteSource: () => void
  toggleAgent: (agentId: string) => void
  createSource: (input: NewSourceInput) => string
  activities: KbActivity[]
  reload: () => void
} {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [store, setStore] = useState<KbSource[]>(kbMock)
  const [query, setQuery] = useState('')
  const [confirmedQuery, setConfirmedQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<KbSourceType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<KbStatus | 'all'>('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [baseline, setBaseline] = useState<KbSource[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const timers = useRef<number[]>([])
  const storeRef = useRef<KbSource[]>(store)
  const taken = useRef(false)
  const snapshot = useRef<KbSource[] | null>(null)

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
    setTypeFilter('all')
    setStatusFilter('all')
    setAgentFilter('all')
  }, [])

  const sources = useMemo(() => {
    const q = confirmedQuery.trim().toLowerCase()
    return store.filter(s => {
      if (!showArchived && s.archived) return false
      if (showArchived && !s.archived) return false
      if (typeFilter !== 'all' && s.type !== typeFilter) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (agentFilter !== 'all' && !s.agentIds.includes(agentFilter)) return false
      if (
        q !== '' &&
        !`${s.title} ${s.description} ${s.type} ${s.tags.join(' ')}`.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [store, confirmedQuery, typeFilter, statusFilter, agentFilter, showArchived])

  const stats = useMemo(() => {
    const live = store.filter(s => !s.archived)
    const agents = new Set<string>()
    live.forEach(s => s.agentIds.forEach(a => agents.add(a)))
    return {
      total: live.length,
      indexed: live.filter(s => s.status === 'indexed').length,
      processing: live.filter(s => s.status === 'processing').length,
      attention: live.filter(s => s.status === 'failed' || s.status === 'empty').length,
      agentsUsing: agents.size,
    }
  }, [store])

  const source = useMemo(() => store.find(s => s.id === sourceId) ?? null, [store, sourceId])
  const dirty = useMemo(() => {
    if (!source || !baseline) return false
    const base = baseline.find(b => b.id === source.id)
    return base !== undefined && JSON.stringify(base) !== JSON.stringify(source)
  }, [source, baseline])

  const touch = useCallback(() => {
    if (!taken.current) {
      taken.current = true
      snapshot.current = storeRef.current
      setBaseline(storeRef.current)
    }
    setSavedAt(null)
  }, [])

  const updateMeta = useCallback(
    (patch: Partial<Pick<KbSource, 'title' | 'description' | 'tags'>>) => {
      if (!sourceId) return
      touch()
      setStore(prev => prev.map(s => (s.id === sourceId ? { ...s, ...patch } : s)))
    },
    [sourceId, touch]
  )

  const saveMeta = useCallback(() => {
    setSaving(true)
    timers.current.push(
      window.setTimeout(() => {
        setSaving(false)
        setSavedAt('just now')
        setBaseline(null)
        snapshot.current = null
        taken.current = false
      }, 600)
    )
  }, [])

  const discardMeta = useCallback(() => {
    if (snapshot.current) setStore(snapshot.current)
    snapshot.current = null
    taken.current = false
    setBaseline(null)
    setSavedAt(null)
  }, [])

  const retryProcessing = useCallback(() => {
    if (!sourceId) return
    touch()
    setStore(prev =>
      prev.map(s =>
        s.id === sourceId ? { ...s, status: 'processing', progress: 8, error: undefined } : s
      )
    )
    timers.current.push(
      window.setTimeout(() => {
        setStore(prev =>
          prev.map(s =>
            s.id === sourceId
              ? {
                  ...s,
                  status: 'indexed',
                  progress: undefined,
                  updated: 'just now',
                  docs: s.docs.map(d => ({ ...d, state: 'indexed' as const })),
                }
              : s
          )
        )
      }, 1800)
    )
  }, [sourceId, touch])

  const archiveSource = useCallback(() => {
    if (!sourceId) return
    setStore(prev => prev.map(s => (s.id === sourceId ? { ...s, archived: true } : s)))
  }, [sourceId])

  const restoreSource = useCallback(() => {
    if (!sourceId) return
    setStore(prev => prev.map(s => (s.id === sourceId ? { ...s, archived: false } : s)))
  }, [sourceId])

  const deleteSource = useCallback(() => {
    if (!sourceId) return
    setStore(prev => prev.filter(s => s.id !== sourceId))
  }, [sourceId])

  const toggleAgent = useCallback(
    (agentId: string) => {
      if (!sourceId) return
      touch()
      setStore(prev =>
        prev.map(s =>
          s.id === sourceId
            ? {
                ...s,
                agentIds: s.agentIds.includes(agentId)
                  ? s.agentIds.filter(a => a !== agentId)
                  : [...s.agentIds, agentId],
              }
            : s
        )
      )
    },
    [sourceId, touch]
  )

  const createSource = useCallback((input: NewSourceInput): string => {
    kbCounter += 1
    const id = `k-new-${Date.now()}-${kbCounter}`
    const fresh: KbSource = {
      id,
      title: input.title,
      type: input.type,
      description: input.description,
      tags: input.tags,
      status: 'processing',
      progress: 5,
      updated: 'just now',
      docs: [],
      agentIds: [],
    }
    setStore(prev => [fresh, ...prev])
    timers.current.push(
      window.setTimeout(() => {
        setStore(prev => prev.map(s => (s.id === id ? { ...s, progress: 55 } : s)))
      }, 900)
    )
    timers.current.push(
      window.setTimeout(() => {
        setStore(prev =>
          prev.map(s =>
            s.id === id
              ? {
                  ...s,
                  status: s.type === 'text' || s.type === 'faq' ? 'indexed' : s.status,
                  progress: s.status === 'indexed' ? undefined : 90,
                  updated: 'just now',
                }
              : s
          )
        )
      }, 1800)
    )
    timers.current.push(
      window.setTimeout(() => {
        setStore(prev =>
          prev.map(s =>
            s.id === id && s.status === 'processing'
              ? { ...s, status: 'indexed', progress: undefined, updated: 'just now' }
              : s
          )
        )
      }, 3000)
    )
    return id
  }, [])

  const listReady = readyKey === listKey
  let listStatus: KbListStatus = 'ready'
  if (demo === 'loading' || !listReady) listStatus = 'loading'
  else if (demo === 'error') listStatus = 'error'
  else if (demo === 'empty') listStatus = 'empty'
  const visible = demo === 'empty' ? [] : sources
  if (listStatus === 'ready' && visible.length === 0) listStatus = 'empty'

  const activities = useMemo(
    () => (sourceId ? kbActivityMock.filter(a => a.sourceId === sourceId) : kbActivityMock),
    [sourceId]
  )

  return {
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
    sources: visible,
    totalCount: store.filter(s => !s.archived).length,
    stats,
    source,
    detailNotFound: sourceId !== undefined && listReady && demo !== 'error' && !source,
    dirty,
    saving,
    savedAt,
    updateMeta,
    saveMeta,
    discardMeta,
    retryProcessing,
    archiveSource,
    restoreSource,
    deleteSource,
    toggleAgent,
    createSource,
    activities,
    reload,
  }
}
