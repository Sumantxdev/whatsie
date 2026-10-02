import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ME, inboxMock } from './mock'
import type {
  AssignFilter,
  ChannelFilter,
  HandlingFilter,
  InboxConversation,
  InboxFilters,
  InboxMessage,
  LifecycleFilter,
  LifecycleState,
} from './types'

/* Mock inbox store. No backend. Timers simulate send/delivery/AI transitions.
   Realtime seam: call applyEvent(evt) from a future socket handler to update
   list, unread, thread, delivery, assignment, and lifecycle the same way. */

export type ListStatus = 'loading' | 'ready' | 'empty' | 'error'
export type PaneStatus = 'loading' | 'ready' | 'error'

let sendCounter = 0

function queueToFilter(view: string | null): Partial<InboxFilters> {
  switch (view) {
    case 'mine':
      return { assign: 'mine' }
    case 'unassigned':
      return { assign: 'unassigned' }
    case 'ai':
      return { handling: 'ai' }
    case 'resolved':
      return { lifecycle: 'closed' }
    default:
      return {}
  }
}

function matches(c: InboxConversation, f: InboxFilters): boolean {
  if (f.channel !== 'all' && c.platform !== f.channel) return false
  if (f.lifecycle !== 'all' && c.lifecycle !== f.lifecycle) return false
  if (f.assign === 'mine' && c.assignedTo !== ME) return false
  if (f.assign === 'unassigned' && c.assignedTo !== null) return false
  if (f.handling === 'ai' && !c.aiHandling) return false
  if (f.handling === 'human' && c.aiHandling) return false
  if (f.query.trim() !== '') {
    const q = f.query.trim().toLowerCase()
    const hay = `${c.name} ${c.preview} ${c.tags.join(' ')}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

export interface InboxData {
  listStatus: ListStatus
  searching: boolean
  filters: InboxFilters
  setFilters: (patch: Partial<InboxFilters>) => void
  resetFilters: () => void
  conversations: InboxConversation[]
  totalCount: number
  selected: InboxConversation | null
  threadStatus: PaneStatus
  contactStatus: PaneStatus
  aiProcessing: boolean
  composerLocked: { locked: boolean; reason?: string }
  send: (text: string) => void
  retryMessage: (id: string) => void
  attachMock: () => void
  takeOver: () => void
  returnToAi: () => void
  assign: (member: string | null) => void
  setLifecycle: (next: LifecycleState) => void
  addTag: (tag: string) => void
  clearReply: () => void
  replyTo: { id: string; preview: string } | null
  setReplyTo: (r: { id: string; preview: string } | null) => void
  reload: () => void
}

export function useInboxData(selectedId: string | undefined): InboxData {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const queueView = params.get('view')
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [store, setStore] = useState<InboxConversation[]>(inboxMock)
  const [filters, setFilterState] = useState<InboxFilters>({
    query: '',
    channel: 'all',
    lifecycle: 'all',
    assign: 'all',
    handling: 'all',
  })
  const [replyTo, setReplyTo] = useState<{ id: string; preview: string } | null>(null)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [threadKey, setThreadKey] = useState<string | null>(null)
  const [confirmedQuery, setConfirmedQuery] = useState('')
  const timers = useRef<number[]>([])

  const listKey = `${demo ?? 'live'}:${nonce}`
  useEffect(() => {
    if (demo === 'loading') return
    const t = window.setTimeout(() => setReadyKey(listKey), 450)
    return () => window.clearTimeout(t)
  }, [demo, nonce, listKey])

  useEffect(() => {
    if (selectedId === undefined) return
    const t = window.setTimeout(() => setThreadKey(selectedId), 350)
    return () => window.clearTimeout(t)
  }, [selectedId])

  useEffect(() => {
    if (filters.query === confirmedQuery) return
    const t = window.setTimeout(() => setConfirmedQuery(filters.query), 300)
    return () => window.clearTimeout(t)
  }, [filters.query, confirmedQuery])
  const searching = filters.query.trim() !== '' && filters.query !== confirmedQuery

  useEffect(() => () => timers.current.forEach(t => window.clearTimeout(t)), [])

  const reload = useCallback(() => setNonce(n => n + 1), [])
  const setFilters = useCallback(
    (patch: Partial<InboxFilters>) => setFilterState(prev => ({ ...prev, ...patch })),
    []
  )
  const resetFilters = useCallback(
    () =>
      setFilterState({
        query: '',
        channel: 'all',
        lifecycle: 'all',
        assign: 'all',
        handling: 'all',
      }),
    []
  )

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  const patchConvo = useCallback((id: string, fn: (c: InboxConversation) => InboxConversation) => {
    setStore(prev => prev.map(c => (c.id === id ? fn(c) : c)))
  }, [])

  const pushMessage = useCallback(
    (convoId: string, msg: InboxMessage) => {
      patchConvo(convoId, c => ({
        ...c,
        messages: [...c.messages, msg],
        preview: msg.text,
        time: 'now',
        unread: 0,
      }))
    },
    [patchConvo]
  )

  const advanceOutbound = useCallback(
    (convoId: string, msgId: string, aiReply: boolean) => {
      later(800, () =>
        patchConvo(convoId, c => ({
          ...c,
          messages: c.messages.map(m => (m.id === msgId ? { ...m, delivery: 'sent' } : m)),
        }))
      )
      later(1600, () =>
        patchConvo(convoId, c => ({
          ...c,
          messages: c.messages.map(m => (m.id === msgId ? { ...m, delivery: 'delivered' } : m)),
        }))
      )
      later(2600, () =>
        patchConvo(convoId, c => ({
          ...c,
          messages: c.messages.map(m => (m.id === msgId ? { ...m, delivery: 'read' } : m)),
        }))
      )
      if (aiReply) {
        later(3000, () => setAiProcessing(true))
        later(4600, () => {
          setAiProcessing(false)
          pushMessage(convoId, {
            id: `m-ai-${Date.now()}`,
            direction: 'inbound',
            sender: 'ai',
            type: 'text',
            text: 'Thanks — noted. Anything else I can help with?',
            time: 'now',
            delivery: 'read',
            aiTag: 'AI · Tier 1',
          })
        })
      }
    },
    [later, patchConvo, pushMessage]
  )

  const send = useCallback(
    (text: string) => {
      if (!selectedId) return
      const convo = store.find(c => c.id === selectedId)
      if (!convo || convo.lifecycle === 'closed') return
      sendCounter += 1
      const id = `m-out-${sendCounter}-${Date.now()}`
      const willFail = /fail/i.test(text)
      pushMessage(selectedId, {
        id,
        direction: 'outbound',
        sender: 'agent',
        agentName: ME,
        type: 'text',
        text,
        time: 'now',
        delivery: 'sending',
        replyTo: replyTo ?? undefined,
      })
      setReplyTo(null)
      if (willFail) {
        later(1200, () =>
          patchConvo(selectedId, c => ({
            ...c,
            messages: c.messages.map(m =>
              m.id === id
                ? {
                    ...m,
                    delivery: 'failed',
                    failureReason:
                      'Send failed: network timeout. Retry is safe — no duplicate will be created.',
                  }
                : m
            ),
          }))
        )
        return
      }
      advanceOutbound(selectedId, id, convo.aiHandling)
    },
    [selectedId, store, pushMessage, replyTo, later, patchConvo, advanceOutbound]
  )

  const retryMessage = useCallback(
    (id: string) => {
      if (!selectedId) return
      const convo = store.find(c => c.id === selectedId)
      patchConvo(selectedId, c => ({
        ...c,
        messages: c.messages.map(m =>
          m.id === id ? { ...m, delivery: 'retrying', failureReason: undefined } : m
        ),
      }))
      later(1200, () => advanceOutbound(selectedId, id, convo?.aiHandling ?? false))
    },
    [selectedId, store, patchConvo, later, advanceOutbound]
  )

  const attachMock = useCallback(() => {
    if (!selectedId) return
    const id = `m-att-${Date.now()}`
    pushMessage(selectedId, {
      id,
      direction: 'outbound',
      sender: 'agent',
      agentName: ME,
      type: 'image',
      text: 'Site photo',
      time: 'now',
      delivery: 'sending',
      attachment: {
        id: `a-${Date.now()}`,
        kind: 'image',
        name: 'site-photo.jpg',
        size: '412 KB',
        state: 'uploading',
        progress: 30,
      },
    })
    later(1400, () =>
      patchConvo(selectedId, c => ({
        ...c,
        messages: c.messages.map(m =>
          m.id === id
            ? {
                ...m,
                delivery: 'sent',
                attachment: m.attachment
                  ? { ...m.attachment, state: 'uploaded', progress: 100 }
                  : m.attachment,
              }
            : m
        ),
      }))
    )
  }, [selectedId, pushMessage, later, patchConvo])

  const takeOver = useCallback(() => {
    if (!selectedId) return
    patchConvo(selectedId, c => ({ ...c, aiHandling: false }))
    pushMessage(selectedId, {
      id: `m-sys-${Date.now()}`,
      direction: 'outbound',
      sender: 'system',
      type: 'text',
      text: `${ME} took over from AI · human handling`,
      time: 'now',
      delivery: 'sent',
    })
  }, [selectedId, patchConvo, pushMessage])

  const returnToAi = useCallback(() => {
    if (!selectedId) return
    patchConvo(selectedId, c => ({ ...c, aiHandling: true }))
    pushMessage(selectedId, {
      id: `m-sys-${Date.now()}`,
      direction: 'outbound',
      sender: 'system',
      type: 'text',
      text: 'AI handling resumed',
      time: 'now',
      delivery: 'sent',
    })
  }, [selectedId, patchConvo, pushMessage])

  const assign = useCallback(
    (member: string | null) => {
      if (!selectedId) return
      patchConvo(selectedId, c => ({ ...c, assignedTo: member }))
    },
    [selectedId, patchConvo]
  )

  const setLifecycle = useCallback(
    (next: LifecycleState) => {
      if (!selectedId) return
      patchConvo(selectedId, c => ({ ...c, lifecycle: next, unread: 0 }))
      pushMessage(selectedId, {
        id: `m-sys-${Date.now()}`,
        direction: 'outbound',
        sender: 'system',
        type: 'text',
        text:
          next === 'closed' ? `${ME} resolved the conversation` : `Conversation reopened · ${next}`,
        time: 'now',
        delivery: 'sent',
      })
    },
    [selectedId, patchConvo, pushMessage]
  )

  const addTag = useCallback(
    (tag: string) => {
      if (!selectedId) return
      const clean = tag.trim().toLowerCase().replace(/\s+/g, '-')
      if (!clean) return
      patchConvo(selectedId, c => (c.tags.includes(clean) ? c : { ...c, tags: [...c.tags, clean] }))
    },
    [selectedId, patchConvo]
  )

  const clearReply = useCallback(() => setReplyTo(null), [])

  const effective: InboxFilters = useMemo(
    () => ({ ...filters, ...queueToFilter(queueView) }),
    [filters, queueView]
  )
  const filtered = useMemo(() => store.filter(c => matches(c, effective)), [store, effective])
  const selected = useMemo(() => store.find(c => c.id === selectedId) ?? null, [store, selectedId])

  // Mark read on select (realtime seam: same path a read-receipt event would take).
  useEffect(() => {
    if (!selectedId || !selected || selected.unread === 0) return
    const t = window.setTimeout(() => {
      setStore(prev => prev.map(c => (c.id === selectedId ? { ...c, unread: 0 } : c)))
    }, 600)
    return () => window.clearTimeout(t)
  }, [selectedId, selected])

  const listReady = readyKey === listKey
  let listStatus: ListStatus = 'ready'
  if (demo === 'loading' || !listReady) listStatus = 'loading'
  else if (demo === 'error') listStatus = 'error'
  else if (demo === 'empty') listStatus = 'empty'

  const visible = demo === 'empty' ? [] : filtered
  if (listStatus === 'ready' && visible.length === 0) listStatus = 'empty'

  const threadStatus: PaneStatus =
    selectedId === undefined ? 'ready' : threadKey === selectedId ? 'ready' : 'loading'
  const contactStatus: PaneStatus = demo === 'partial' ? 'error' : 'ready'

  const composerLocked =
    selected?.lifecycle === 'closed'
      ? { locked: true, reason: 'This conversation is resolved. Reopen to reply.' }
      : { locked: false }

  return {
    listStatus,
    searching,
    filters,
    setFilters,
    resetFilters,
    conversations: visible,
    totalCount: store.length,
    selected,
    threadStatus,
    contactStatus,
    aiProcessing,
    composerLocked,
    send,
    retryMessage,
    attachMock,
    takeOver,
    returnToAi,
    assign,
    setLifecycle,
    addTag,
    clearReply,
    replyTo,
    setReplyTo,
    reload,
  }
}

export type { ChannelFilter, LifecycleFilter, AssignFilter, HandlingFilter, LifecycleState }
