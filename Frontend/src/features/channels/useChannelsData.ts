import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { channelsMock } from './mock'
import { PLATFORMS } from './platforms'
import type { Channel, ConnectionState, PlatformId } from './types'

/* Mock channel store. No platform APIs, webhooks, or OAuth. The connect flow
   is a local state machine; timers simulate progress and are labelled mock. */

export type ChannelListStatus = 'loading' | 'ready' | 'empty' | 'error'

export interface ConnectDraft {
  platform: PlatformId
  name: string
  account: string
  secret: string
}

export function useChannelsData(channelId?: string): {
  listStatus: ChannelListStatus
  searching: boolean
  query: string
  setQuery: (q: string) => void
  statusFilter: ConnectionState | 'all'
  setStatusFilter: (s: ConnectionState | 'all') => void
  resetFilters: () => void
  channels: Channel[]
  statusById: Record<string, ConnectionState>
  totalCount: number
  stats: { total: number; connected: number; attention: number; active24h: number }
  channel: Channel | null
  detailNotFound: boolean
  saving: boolean
  savedAt: string | null
  updateFields: (fields: Channel['fields']) => void
  renameChannel: (name: string) => void
  saveSettings: () => void
  discardSettings: () => void
  dirty: boolean
  setEnabled: (on: boolean) => void
  setAgent: (agentId: string | null) => void
  disconnect: () => void
  retryConnection: () => void
  retryHealth: () => void
  healthChecking: boolean
  startConnect: (draft: ConnectDraft) => void
  connecting: { platform: PlatformId; progress: number } | null
  connectError: string | null
  cancelConnect: () => void
  retryConnect: () => void
  reload: () => void
} {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [store, setStore] = useState<Channel[]>(channelsMock)
  const [query, setQuery] = useState('')
  const [confirmedQuery, setConfirmedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ConnectionState | 'all'>('all')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [healthChecking, setHealthChecking] = useState(false)
  const [connecting, setConnecting] = useState<{ platform: PlatformId; progress: number } | null>(
    null
  )
  const [connectError, setConnectError] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<ConnectDraft | null>(null)
  const timers = useRef<number[]>([])
  const storeRef = useRef<Channel[]>(store)
  const taken = useRef(false)
  const snapshot = useRef<Channel[] | null>(null)
  const [baseline, setBaseline] = useState<Channel[] | null>(null)

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
  }, [])

  const channels = useMemo(() => {
    const q = confirmedQuery.trim().toLowerCase()
    return store.filter(c => {
      const pname = PLATFORMS.find(p => p.id === c.id)?.name ?? c.id
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (q !== '' && !`${pname} ${c.name} ${c.account}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [store, confirmedQuery, statusFilter])

  const statusById = useMemo(
    () => Object.fromEntries(store.map(c => [c.id, c.status])) as Record<string, ConnectionState>,
    [store]
  )

  const stats = useMemo(() => {
    const connected = store.filter(c => c.status === 'connected' || c.status === 'attention').length
    const attention = store.filter(c => c.status === 'attention' || c.status === 'error').length
    const active24h = store.reduce((sum, c) => sum + c.conversations24h, 0)
    return { total: store.length, connected, attention, active24h }
  }, [store])

  const channel = useMemo(() => store.find(c => c.id === channelId) ?? null, [store, channelId])
  const dirty = useMemo(() => {
    if (!channel || !baseline) return false
    const base = baseline.find(b => b.id === channel.id)
    return base !== undefined && JSON.stringify(base) !== JSON.stringify(channel)
  }, [channel, baseline])

  const touch = useCallback(() => {
    if (!taken.current) {
      taken.current = true
      snapshot.current = storeRef.current
      setBaseline(storeRef.current)
    }
    setSavedAt(null)
  }, [])

  const patchChannel = useCallback(
    (id: PlatformId, fn: (c: Channel) => Channel) => {
      touch()
      setStore(prev => prev.map(c => (c.id === id ? fn(c) : c)))
    },
    [touch]
  )

  const updateFields = useCallback(
    (fields: Channel['fields']) => {
      if (channelId) patchChannel(channelId as PlatformId, c => ({ ...c, fields }))
    },
    [channelId, patchChannel]
  )

  const renameChannel = useCallback(
    (name: string) => {
      if (channelId) patchChannel(channelId as PlatformId, c => ({ ...c, name }))
    },
    [channelId, patchChannel]
  )

  const saveSettings = useCallback(() => {
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

  const discardSettings = useCallback(() => {
    if (snapshot.current) setStore(snapshot.current)
    snapshot.current = null
    taken.current = false
    setBaseline(null)
    setSavedAt(null)
  }, [])

  const setEnabled = useCallback(
    (on: boolean) => {
      if (!channelId) return
      const id = channelId as PlatformId
      const current = storeRef.current.find(c => c.id === id)
      if (!current || current.status === 'not-connected') return
      if (on && current.status === 'disabled') {
        setStore(prev =>
          prev.map(c =>
            c.id === id
              ? {
                  ...c,
                  enabled: true,
                  status: 'connected',
                  statusDetail: 'Reconnected · just now',
                  health: 'healthy' as const,
                }
              : c
          )
        )
      } else if (!on && current.status !== 'disabled') {
        setStore(prev =>
          prev.map(c =>
            c.id === id
              ? {
                  ...c,
                  enabled: false,
                  status: 'disabled',
                  statusDetail: 'Disabled by you · just now',
                  health: 'unknown' as const,
                }
              : c
          )
        )
      }
    },
    [channelId]
  )

  const setAgent = useCallback(
    (agentId: string | null) => {
      if (channelId) patchChannel(channelId as PlatformId, c => ({ ...c, agentId }))
    },
    [channelId, patchChannel]
  )

  const disconnect = useCallback(() => {
    if (!channelId) return
    const id = channelId as PlatformId
    const def = PLATFORMS.find(p => p.id === id)
    setStore(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              name: '',
              account: '',
              status: 'not-connected',
              statusDetail: 'Never connected',
              health: 'unknown',
              checks: [],
              fields: [],
              agentId: null,
              enabled: false,
              connectedAt: '—',
              lastActivity: '—',
              conversations24h: 0,
              activity: [
                ...c.activity,
                {
                  id: `a-${Date.now()}`,
                  kind: 'disconnected' as const,
                  text: `Disconnected from ${def?.name ?? id}`,
                  time: 'just now',
                  status: 'warn' as const,
                },
              ],
            }
          : c
      )
    )
  }, [channelId])

  const finishConnect = useCallback(
    (platform: PlatformId, draft: ConnectDraft, failed: boolean) => {
      const def = PLATFORMS.find(p => p.id === platform)
      setStore(prev =>
        prev.map(c =>
          c.id === platform
            ? failed
              ? {
                  ...c,
                  status: 'error',
                  statusDetail: 'Connection failed — token rejected (mock)',
                  health: 'down' as const,
                }
              : {
                  ...c,
                  name: draft.name,
                  account: draft.account,
                  status: 'connected',
                  statusDetail: 'Connected · just now (mock)',
                  health: 'healthy' as const,
                  enabled: true,
                  connectedAt: 'just now',
                  lastActivity: 'just now',
                  checks: [
                    {
                      id: 'conn',
                      label: 'Adapter connection',
                      state: 'healthy' as const,
                      detail: 'Reachable · 90ms (mock)',
                    },
                    {
                      id: 'rx',
                      label: 'Receiving',
                      state: 'healthy' as const,
                      detail: `Webhook ${def?.webhook ?? ''} delivering`,
                    },
                    {
                      id: 'tx',
                      label: 'Sending',
                      state: 'healthy' as const,
                      detail: 'Queue draining normally',
                    },
                    {
                      id: 'platform',
                      label: 'Platform availability',
                      state: 'healthy' as const,
                      detail: 'No incidents reported',
                    },
                  ],
                  activity: [
                    {
                      id: `a-${Date.now()}`,
                      kind: 'connected' as const,
                      text: `Connected to ${def?.name ?? platform} (mock — no real account linked)`,
                      time: 'just now',
                      status: 'ok' as const,
                    },
                    ...c.activity,
                  ],
                }
            : c
        )
      )
    },
    []
  )

  const runConnect = useCallback(
    (draft: ConnectDraft) => {
      setConnecting({ platform: draft.platform, progress: 8 })
      setConnectError(null)
      const failed = /fail/i.test(draft.name)
      timers.current.push(
        window.setTimeout(() => setConnecting({ platform: draft.platform, progress: 55 }), 700)
      )
      timers.current.push(
        window.setTimeout(() => {
          setConnecting(null)
          if (failed) {
            setConnectError(
              'Connection failed: the token was rejected (mock). Check the value and retry — your input was preserved.'
            )
            setPendingDraft(draft)
          } else {
            setPendingDraft(null)
            finishConnect(draft.platform, draft, false)
          }
        }, 1600)
      )
    },
    [finishConnect]
  )

  const startConnect = useCallback(
    (draft: ConnectDraft) => {
      setPendingDraft(draft)
      runConnect(draft)
    },
    [runConnect]
  )

  const cancelConnect = useCallback(() => {
    timers.current.forEach(t => window.clearTimeout(t))
    timers.current = []
    setConnecting(null)
    setConnectError(null)
  }, [])

  const retryConnect = useCallback(() => {
    if (pendingDraft) runConnect(pendingDraft)
  }, [pendingDraft, runConnect])

  const retryConnection = useCallback(() => {
    if (!channelId) return
    const id = channelId as PlatformId
    const current = storeRef.current.find(c => c.id === id)
    if (!current) return
    setStore(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              status: 'connected',
              statusDetail: 'Reconnected · just now (mock)',
              health: 'healthy' as const,
            }
          : c
      )
    )
  }, [channelId])

  const retryHealth = useCallback(() => {
    setHealthChecking(true)
    timers.current.push(window.setTimeout(() => setHealthChecking(false), 900))
  }, [])

  const listReady = readyKey === listKey
  let listStatus: ChannelListStatus = 'ready'
  if (demo === 'loading' || !listReady) listStatus = 'loading'
  else if (demo === 'error') listStatus = 'error'
  else if (demo === 'empty') listStatus = 'empty'
  const visible = demo === 'empty' ? [] : channels
  if (listStatus === 'ready' && visible.length === 0) listStatus = 'empty'

  return {
    listStatus,
    searching,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    resetFilters,
    channels: visible,
    statusById,
    totalCount: store.length,
    stats,
    channel,
    detailNotFound: channelId !== undefined && listReady && demo !== 'error' && !channel,
    saving,
    savedAt,
    updateFields,
    renameChannel,
    saveSettings,
    discardSettings,
    dirty,
    setEnabled,
    setAgent,
    disconnect,
    retryConnection,
    retryHealth,
    healthChecking,
    startConnect,
    connecting,
    connectError,
    cancelConnect,
    retryConnect,
    reload,
  }
}
