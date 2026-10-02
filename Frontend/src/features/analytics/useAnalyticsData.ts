import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { analyticsMock } from './mock'
import type { RangeDataset, TimeRange } from './types'

/* Mock analytics store. Range switches datasets; refresh only bumps the
   timestamp (never claims live data). ?demo drives state verification. */

export type AnalyticsStatus = 'loading' | 'ready' | 'empty' | 'error'

export function useAnalyticsData(): {
  status: AnalyticsStatus
  failedSections: string[]
  range: TimeRange
  setRange: (r: TimeRange) => void
  customNote: string | null
  applyCustom: (from: string, to: string) => void
  lastUpdated: string
  refreshing: boolean
  refresh: () => void
  data: RangeDataset
  reload: () => void
} {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const partial = demo !== null && demo.startsWith('partial-') ? demo.replace('partial-', '') : null
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [range, setRange] = useState<TimeRange>('7d')
  const [customNote, setCustomNote] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState('2 minutes ago')
  const [refreshing, setRefreshing] = useState(false)

  const listKey = `${demo ?? 'live'}:${nonce}:${range}`
  useEffect(() => {
    if (demo === 'loading') return
    const t = window.setTimeout(() => setReadyKey(listKey), 450)
    return () => window.clearTimeout(t)
  }, [demo, nonce, listKey])

  const reload = useCallback(() => setNonce(n => n + 1), [])

  const refresh = useCallback(() => {
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setLastUpdated('just now')
    }, 800)
  }, [])

  const applyCustom = useCallback((from: string, to: string) => {
    setRange('custom')
    setCustomNote(from !== '' && to !== '' ? `${from} → ${to} (mock — showing last 30 days)` : null)
    setNonce(n => n + 1)
  }, [])

  const effective: Exclude<TimeRange, 'custom'> =
    range === 'today' ? 'today' : range === '7d' ? '7d' : '30d'
  const base = analyticsMock[effective]
  const data: RangeDataset =
    demo === 'empty'
      ? {
          ...base,
          kpis: [],
          messages: [],
          funnel: [],
          movements: [],
          agents: [],
          aiSeries: [],
          tokenSeries: [],
          execSeries: [],
          topWorkflows: [],
          channels: base.channels.map(c => ({ ...c, messages: 0, conversations: 0 })),
        }
      : base

  const listReady = readyKey === listKey
  let status: AnalyticsStatus = 'ready'
  if (demo === 'loading' || !listReady) status = 'loading'
  else if (demo === 'error') status = 'error'
  else if (demo === 'empty') status = 'empty'

  return {
    status,
    failedSections: partial === null ? [] : [partial],
    range,
    setRange,
    customNote,
    applyCustom,
    lastUpdated,
    refreshing,
    refresh,
    data,
    reload,
  }
}
