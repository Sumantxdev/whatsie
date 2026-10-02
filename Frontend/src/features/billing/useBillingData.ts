import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { billingMock, billingSettingsMock, invoicesMock } from './mock'
import type { BillingSettings, Invoice, InvoiceStatus } from './types'

/* Mock billing store. No payment providers, APIs, or transactions.
   CSV export downloads locally generated mock content. */

export type BillingStatus = 'loading' | 'ready' | 'empty' | 'error'

export function useBillingData(): {
  status: BillingStatus
  failedSections: string[]
  searching: boolean
  invoiceQuery: string
  setInvoiceQuery: (q: string) => void
  invoiceStatus: InvoiceStatus | 'all'
  setInvoiceStatus: (s: InvoiceStatus | 'all') => void
  resetInvoiceFilters: () => void
  invoices: Invoice[]
  selectedInvoice: Invoice | null
  selectInvoice: (id: string | null) => void
  downloadInvoice: (id: string) => void
  settings: BillingSettings
  settingsDirty: boolean
  settingsSaving: boolean
  updateSettings: (patch: Partial<BillingSettings>) => void
  saveSettings: () => void
  discardSettings: () => void
  lastUpdated: string
  refreshing: boolean
  refresh: () => void
  reload: () => void
} {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [invoiceQuery, setInvoiceQuery] = useState('')
  const [confirmedQuery, setConfirmedQuery] = useState('')
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settings, setSettings] = useState<BillingSettings>(billingSettingsMock)
  const [settingsBaseline, setSettingsBaseline] = useState<BillingSettings | null>(null)
  const settingsRef = useRef(settings)
  const settingsTaken = useRef(false)
  const settingsSnapshot = useRef<BillingSettings | null>(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(billingMock.updatedAt)
  const [refreshing, setRefreshing] = useState(false)

  const listKey = `${demo ?? 'live'}:${nonce}`
  useEffect(() => {
    if (demo === 'loading') return
    const t = window.setTimeout(() => setReadyKey(listKey), 450)
    return () => window.clearTimeout(t)
  }, [demo, nonce, listKey])

  useEffect(() => {
    if (invoiceQuery === confirmedQuery) return
    const t = window.setTimeout(() => setConfirmedQuery(invoiceQuery), 300)
    return () => window.clearTimeout(t)
  }, [invoiceQuery, confirmedQuery])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const reload = useCallback(() => setNonce(n => n + 1), [])
  const searching = invoiceQuery.trim() !== '' && invoiceQuery !== confirmedQuery

  const resetInvoiceFilters = (): void => {
    setInvoiceQuery('')
    setInvoiceStatus('all')
  }

  const invoices = useMemo(() => {
    const q = confirmedQuery.trim().toLowerCase()
    return invoicesMock.filter(i => {
      if (invoiceStatus !== 'all' && i.status !== invoiceStatus) return false
      if (q !== '' && !`${i.id} ${i.period}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [confirmedQuery, invoiceStatus])

  const selectedInvoice = useMemo(
    () => (selectedId ? (invoicesMock.find(i => i.id === selectedId) ?? null) : null),
    [selectedId]
  )
  const selectInvoice = useCallback((id: string | null) => setSelectedId(id), [])

  const downloadInvoice = useCallback((id: string) => {
    const inv = invoicesMock.find(i => i.id === id)
    if (!inv) return
    const csv = [
      'invoice,period,date,amount,status,messages,tokens,calls',
      [inv.id, inv.period, inv.date, inv.amount, inv.status, inv.messages, inv.tokens, inv.calls]
        .map(v => `"${v}"`)
        .join(','),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${inv.id}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [])

  const settingsDirty =
    settingsBaseline !== null && JSON.stringify(settingsBaseline) !== JSON.stringify(settings)

  const updateSettings = useCallback((patch: Partial<BillingSettings>) => {
    if (!settingsTaken.current) {
      settingsTaken.current = true
      settingsSnapshot.current = settingsRef.current
      setSettingsBaseline(settingsRef.current)
    }
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const saveSettings = useCallback(() => {
    setSettingsSaving(true)
    window.setTimeout(() => {
      setSettingsSaving(false)
      setSettingsBaseline(null)
      settingsSnapshot.current = null
      settingsTaken.current = false
    }, 600)
  }, [])

  const discardSettings = useCallback(() => {
    if (settingsSnapshot.current) setSettings(settingsSnapshot.current)
    settingsSnapshot.current = null
    settingsTaken.current = false
    setSettingsBaseline(null)
  }, [])

  const refresh = useCallback(() => {
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setLastUpdated('just now')
    }, 800)
  }, [])

  const listReady = readyKey === listKey
  let status: BillingStatus = 'ready'
  if (demo === 'loading' || !listReady) status = 'loading'
  else if (demo === 'error') status = 'error'
  else if (demo === 'empty') status = 'empty'

  return {
    status,
    failedSections:
      demo !== null && demo.startsWith('partial-') ? [demo.replace('partial-', '')] : [],
    searching,
    invoiceQuery,
    setInvoiceQuery,
    invoiceStatus,
    setInvoiceStatus,
    resetInvoiceFilters,
    invoices: demo === 'empty' ? [] : invoices,
    selectedInvoice,
    selectInvoice,
    downloadInvoice,
    settings,
    settingsDirty,
    settingsSaving,
    updateSettings,
    saveSettings,
    discardSettings,
    lastUpdated,
    refreshing,
    refresh,
    reload,
  }
}
