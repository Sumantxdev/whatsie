import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { CRM_ME, crmMock } from './mock'
import { STAGE_ORDER, emptyCrmFilters } from './types'
import type { CrmFilters, CrmRecord, SortKey, Stage } from './types'

/* Mock CRM store. No backend. Covers list/filter/sort/bulk/import/detail/notes.
   Realtime seam: stage/assign/message events would patch the same store. */

export type CrmListStatus = 'loading' | 'ready' | 'empty' | 'error'
export type ImportPhase = 'idle' | 'uploading' | 'processing' | 'success' | 'partial' | 'failure'

export interface ImportResult {
  phase: ImportPhase
  progress: number
  added: number
  failedRows: string[]
}

const stageRank = (s: Stage): number => STAGE_ORDER.indexOf(s)

function matches(r: CrmRecord, f: CrmFilters): boolean {
  if (f.stage !== 'all' && r.stage !== f.stage) return false
  if (f.channel !== 'all' && r.channel !== f.channel) return false
  if (f.tag !== 'all' && !r.tags.includes(f.tag)) return false
  if (f.assignee === 'mine' && r.assignedTo !== CRM_ME) return false
  else if (f.assignee === 'unassigned' && r.assignedTo !== null) return false
  else if (!['all', 'mine', 'unassigned'].includes(f.assignee) && r.assignedTo !== f.assignee)
    return false
  if (f.query.trim() !== '') {
    const q = f.query.trim().toLowerCase()
    const hay = `${r.name} ${r.phone} ${r.email ?? ''} ${r.tags.join(' ')}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

function sortRecords(list: CrmRecord[], sort: SortKey): CrmRecord[] {
  const copy = [...list]
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    case 'newest':
      return copy.sort((a, b) => b.createdSort - a.createdSort)
    case 'stage':
      return copy.sort(
        (a, b) => stageRank(a.stage) - stageRank(b.stage) || a.lastActivitySort - b.lastActivitySort
      )
    case 'recent':
    default:
      return copy.sort((a, b) => a.lastActivitySort - b.lastActivitySort)
  }
}

let noteCounter = 0

export function useCrmData(contactId?: string): {
  listStatus: CrmListStatus
  searching: boolean
  filters: CrmFilters
  setFilters: (p: Partial<CrmFilters>) => void
  resetFilters: () => void
  sort: SortKey
  setSort: (s: SortKey) => void
  records: CrmRecord[]
  totalCount: number
  allTags: string[]
  selection: string[]
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
  bulkAssign: (member: string | null) => void
  bulkStage: (stage: Stage) => void
  stageOne: (id: string, stage: Stage) => void
  bulkTag: (tag: string) => void
  bulkDelete: () => void
  bulkExport: () => string | null
  importState: ImportResult
  startImport: (fileName: string) => void
  resetImport: () => void
  addRecord: (input: { name: string; phone: string; email?: string }) => string
  record: CrmRecord | null
  detailNotFound: boolean
  activityFailed: boolean
  savingNote: boolean
  addNote: (text: string) => void
  addTag: (tag: string) => void
  removeTag: (tag: string) => void
  setStage: (stage: Stage, source?: 'manual' | 'workflow' | 'ai') => void
  setAssignee: (member: string | null) => void
  deleteRecord: () => void
  reload: () => void
} {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [store, setStore] = useState<CrmRecord[]>(crmMock)
  const [filters, setFilterState] = useState<CrmFilters>(emptyCrmFilters)
  const [sort, setSort] = useState<SortKey>('recent')
  const [selection, setSelection] = useState<string[]>([])
  const [confirmedQuery, setConfirmedQuery] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [importState, setImportState] = useState<ImportResult>({
    phase: 'idle',
    progress: 0,
    added: 0,
    failedRows: [],
  })
  const [exportUrl, setExportUrl] = useState<string | null>(null)
  const timers = useRef<number[]>([])

  const listKey = `${demo ?? 'live'}:${nonce}`
  useEffect(() => {
    if (demo === 'loading') return
    const t = window.setTimeout(() => setReadyKey(listKey), 450)
    return () => window.clearTimeout(t)
  }, [demo, nonce, listKey])

  useEffect(() => {
    if (filters.query === confirmedQuery) return
    const t = window.setTimeout(() => setConfirmedQuery(filters.query), 300)
    return () => window.clearTimeout(t)
  }, [filters.query, confirmedQuery])

  useEffect(() => () => timers.current.forEach(t => window.clearTimeout(t)), [])
  useEffect(
    () => () => {
      if (exportUrl) URL.revokeObjectURL(exportUrl)
    },
    [exportUrl]
  )

  const reload = useCallback(() => setNonce(n => n + 1), [])
  const setFilters = useCallback(
    (p: Partial<CrmFilters>) => setFilterState(prev => ({ ...prev, ...p })),
    []
  )
  const resetFilters = useCallback(() => setFilterState(emptyCrmFilters), [])

  const searching = filters.query.trim() !== '' && filters.query !== confirmedQuery

  const filtered = useMemo(
    () =>
      sortRecords(
        store.filter(r => matches(r, filters)),
        sort
      ),
    [store, filters, sort]
  )
  const allTags = useMemo(() => Array.from(new Set(store.flatMap(r => r.tags))).sort(), [store])
  const record = useMemo(() => store.find(r => r.id === contactId) ?? null, [store, contactId])

  const listReady = readyKey === listKey
  let listStatus: CrmListStatus = 'ready'
  if (demo === 'loading' || !listReady) listStatus = 'loading'
  else if (demo === 'error') listStatus = 'error'
  else if (demo === 'empty') listStatus = 'empty'
  const visible = demo === 'empty' ? [] : filtered
  if (listStatus === 'ready' && visible.length === 0) listStatus = 'empty'
  const activityFailed = demo === 'partial'

  const toggleSelect = useCallback((id: string) => {
    setSelection(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]))
  }, [])
  const toggleSelectAll = useCallback(() => {
    setSelection(prev => (prev.length === filtered.length ? [] : filtered.map(r => r.id)))
  }, [filtered])
  const clearSelection = useCallback(() => setSelection([]), [])

  const stampActivity = (r: CrmRecord, text: string): CrmRecord => ({
    ...r,
    lastActivity: 'just now',
    lastActivitySort: 0,
    activity: [
      {
        id: `a-${Date.now()}`,
        kind: 'status',
        text,
        source: 'manual',
        actor: CRM_ME,
        time: 'just now',
      },
      ...r.activity,
    ],
  })

  const bulkAssign = useCallback(
    (member: string | null) => {
      setStore(prev => prev.map(r => (selection.includes(r.id) ? { ...r, assignedTo: member } : r)))
    },
    [selection]
  )
  const bulkStage = useCallback(
    (stage: Stage) => {
      setStore(prev =>
        prev.map(r =>
          selection.includes(r.id) ? stampActivity({ ...r, stage }, `Moved to ${stage} (bulk)`) : r
        )
      )
    },
    [selection]
  )
  const stageOne = useCallback((id: string, stage: Stage) => {
    setStore(prev =>
      prev.map(r =>
        r.id === id ? stampActivity({ ...r, stage }, `Moved to ${stage} (pipeline)`) : r
      )
    )
  }, [])
  const bulkTag = useCallback(
    (tag: string) => {
      const clean = tag.trim().toLowerCase().replace(/\s+/g, '-')
      if (!clean) return
      setStore(prev =>
        prev.map(r =>
          selection.includes(r.id) && !r.tags.includes(clean)
            ? { ...r, tags: [...r.tags, clean] }
            : r
        )
      )
    },
    [selection]
  )
  const bulkDelete = useCallback(() => {
    setStore(prev => prev.filter(r => !selection.includes(r.id)))
    setSelection([])
  }, [selection])

  const bulkExport = useCallback((): string | null => {
    const rows = store.filter(r => selection.includes(r.id))
    if (rows.length === 0) return null
    const csv = [
      'name,phone,email,stage,assigned',
      ...rows.map(r =>
        [r.name, r.phone, r.email ?? '', r.stage, r.assignedTo ?? ''].map(v => `"${v}"`).join(',')
      ),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    setExportUrl(url)
    return url
  }, [store, selection])

  const startImport = useCallback((fileName: string) => {
    setImportState({ phase: 'uploading', progress: 10, added: 0, failedRows: [] })
    const mode = /fail/i.test(fileName)
      ? 'failure'
      : /partial/i.test(fileName)
        ? 'partial'
        : 'success'
    timers.current.push(
      window.setTimeout(
        () => setImportState({ phase: 'uploading', progress: 65, added: 0, failedRows: [] }),
        500
      )
    )
    timers.current.push(
      window.setTimeout(
        () => setImportState({ phase: 'processing', progress: 90, added: 0, failedRows: [] }),
        1000
      )
    )
    timers.current.push(
      window.setTimeout(() => {
        if (mode === 'failure') {
          setImportState({ phase: 'failure', progress: 100, added: 0, failedRows: [] })
          return
        }
        const newcomers: CrmRecord[] = [
          {
            id: `l-imp-${Date.now()}-a`,
            name: 'Rita Gomez',
            phone: '+1 415 555 0119',
            channel: 'whatsapp',
            stage: 'new',
            assignedTo: null,
            tags: ['imported'],
            lastActivity: 'just now',
            lastActivitySort: 0,
            createdSort: 99,
            notes: [],
            customFields: [],
            conversations: [],
            activity: [
              {
                id: `a-${Date.now()}`,
                kind: 'message',
                text: 'Imported from CSV',
                source: 'manual',
                actor: CRM_ME,
                time: 'just now',
              },
            ],
          },
        ]
        if (mode === 'success') {
          newcomers.push({
            id: `l-imp-${Date.now()}-b`,
            name: 'Leo Martins',
            phone: '+55 11 90000 1122',
            channel: 'instagram',
            stage: 'new',
            assignedTo: null,
            tags: ['imported'],
            lastActivity: 'just now',
            lastActivitySort: 0,
            createdSort: 99,
            notes: [],
            customFields: [],
            conversations: [],
            activity: [
              {
                id: `a-${Date.now()}-b`,
                kind: 'message',
                text: 'Imported from CSV',
                source: 'manual',
                actor: CRM_ME,
                time: 'just now',
              },
            ],
          })
          setStore(prev => [...newcomers, ...prev])
          setImportState({ phase: 'success', progress: 100, added: 2, failedRows: [] })
        } else {
          setStore(prev => [...newcomers, ...prev])
          setImportState({
            phase: 'partial',
            progress: 100,
            added: 1,
            failedRows: ['Row 4: missing phone — skipped'],
          })
        }
      }, 1600)
    )
  }, [])
  const resetImport = useCallback(
    () => setImportState({ phase: 'idle', progress: 0, added: 0, failedRows: [] }),
    []
  )

  const addRecord = useCallback(
    (input: { name: string; phone: string; email?: string }): string => {
      const id = `l-${Date.now()}`
      setStore(prev => [
        {
          id,
          name: input.name,
          phone: input.phone,
          email: input.email || undefined,
          channel: 'whatsapp',
          stage: 'new',
          assignedTo: null,
          tags: [],
          lastActivity: 'just now',
          lastActivitySort: 0,
          createdSort: 100,
          notes: [],
          customFields: [],
          conversations: [],
          activity: [
            {
              id: `a-${Date.now()}`,
              kind: 'message',
              text: 'Contact created manually',
              source: 'manual',
              actor: CRM_ME,
              time: 'just now',
            },
          ],
        },
        ...prev,
      ])
      return id
    },
    []
  )

  const addNote = useCallback(
    (text: string) => {
      if (!contactId || text.trim() === '') return
      setSavingNote(true)
      noteCounter += 1
      const note = {
        id: `n-${Date.now()}-${noteCounter}`,
        author: CRM_ME,
        time: 'just now',
        text: text.trim(),
      }
      timers.current.push(
        window.setTimeout(() => {
          setStore(prev =>
            prev.map(r =>
              r.id === contactId
                ? {
                    ...r,
                    notes: [note, ...r.notes],
                    activity: [
                      {
                        id: `a-${Date.now()}`,
                        kind: 'note',
                        text: `Note added by ${CRM_ME}`,
                        source: 'manual',
                        actor: CRM_ME,
                        time: 'just now',
                      },
                      ...r.activity,
                    ],
                  }
                : r
            )
          )
          setSavingNote(false)
        }, 500)
      )
    },
    [contactId]
  )

  const addTag = useCallback(
    (tag: string) => {
      if (!contactId) return
      const clean = tag.trim().toLowerCase().replace(/\s+/g, '-')
      if (!clean) return
      setStore(prev =>
        prev.map(r =>
          r.id === contactId && !r.tags.includes(clean) ? { ...r, tags: [...r.tags, clean] } : r
        )
      )
    },
    [contactId]
  )
  const removeTag = useCallback(
    (tag: string) => {
      if (!contactId) return
      setStore(prev =>
        prev.map(r => (r.id === contactId ? { ...r, tags: r.tags.filter(t => t !== tag) } : r))
      )
    },
    [contactId]
  )
  const setStage = useCallback(
    (stage: Stage, source: 'manual' | 'workflow' | 'ai' = 'manual') => {
      if (!contactId) return
      setStore(prev =>
        prev.map(r => {
          if (r.id !== contactId) return r
          const actor =
            source === 'manual'
              ? CRM_ME
              : source === 'workflow'
                ? 'Active workflow'
                : 'AI classifier'
          return {
            ...r,
            stage,
            lastActivity: 'just now',
            lastActivitySort: 0,
            activity: [
              {
                id: `a-${Date.now()}`,
                kind: 'status',
                text: `Moved ${r.stage} → ${stage} · ${source}`,
                source,
                actor,
                time: 'just now',
              },
              ...r.activity,
            ],
          }
        })
      )
    },
    [contactId]
  )
  const setAssignee = useCallback(
    (member: string | null) => {
      if (!contactId) return
      setStore(prev =>
        prev.map(r =>
          r.id === contactId
            ? {
                ...r,
                assignedTo: member,
                activity: [
                  {
                    id: `a-${Date.now()}`,
                    kind: 'assign',
                    text: member ? `Assigned to ${member}` : 'Unassigned',
                    source: 'manual',
                    actor: CRM_ME,
                    time: 'just now',
                  },
                  ...r.activity,
                ],
              }
            : r
        )
      )
    },
    [contactId]
  )
  const deleteRecord = useCallback(() => {
    if (!contactId) return
    setStore(prev => prev.filter(r => r.id !== contactId))
  }, [contactId])

  return {
    listStatus,
    searching,
    filters,
    setFilters,
    resetFilters,
    sort,
    setSort,
    records: visible,
    totalCount: store.length,
    allTags,
    selection,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    bulkAssign,
    bulkStage,
    stageOne,
    bulkTag,
    bulkDelete,
    bulkExport,
    importState,
    startImport,
    resetImport,
    addRecord,
    record,
    detailNotFound: contactId !== undefined && listStatus === 'ready' && !record,
    activityFailed,
    savingNote,
    addNote,
    addTag,
    removeTag,
    setStage,
    setAssignee,
    deleteRecord,
    reload,
  }
}
