import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { homeMock } from './mock'
import type { HomeSnapshot } from './types'

/* Simulated fetch for shell-stage verification. No backend.
   ?demo=loading|empty|error|partial drives each visual state. */

export type HomeStatus = 'loading' | 'ready' | 'empty' | 'error' | 'partial'

export interface HomeData {
  status: HomeStatus
  snapshot: HomeSnapshot | null
  failedSections: string[]
  reload: () => void
}

export function useHomeData(): HomeData {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const key = `${demo ?? 'live'}:${nonce}`

  useEffect(() => {
    if (demo === 'loading') return
    const t = window.setTimeout(() => setReadyKey(key), 450)
    return () => window.clearTimeout(t)
  }, [demo, nonce, key])

  const reload = useCallback(() => setNonce(n => n + 1), [])
  const delayed = readyKey === key

  if (demo === 'loading' || !delayed)
    return { status: 'loading', snapshot: null, failedSections: [], reload }
  if (demo === 'error') return { status: 'error', snapshot: null, failedSections: ['all'], reload }
  if (demo === 'empty') {
    return {
      status: 'empty',
      snapshot: {
        ...homeMock,
        metrics: [],
        attention: [],
        conversations: [],
        activity: [],
        executions: [],
        funnel: [],
      },
      failedSections: [],
      reload,
    }
  }
  if (demo === 'partial')
    return { status: 'partial', snapshot: homeMock, failedSections: ['channels'], reload }
  return { status: 'ready', snapshot: homeMock, failedSections: [], reload }
}
