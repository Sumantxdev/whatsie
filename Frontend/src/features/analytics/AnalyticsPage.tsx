import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Metric } from '@/design-system/components/data'
import { ChartCard, LineChart } from '@/design-system/components/charts'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { Modal } from '@/design-system/components/overlays'
import { MessagingView, LeadsView, AiView, AutomationView, ChannelsView } from './sections'
import type { TimeRange } from './types'
import { useAnalyticsData } from './useAnalyticsData'
import './Analytics.css'

/* Analytics: one page, six views driven by the shell contextual tabs
   (?view=). Global range + refresh; usage summary lives on overview. */

function CustomRangeModal({
  onClose,
  onApply,
}: {
  onClose: () => void
  onApply: (from: string, to: string) => void
}): React.JSX.Element {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  return (
    <Modal
      title="Custom range (mock)"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onApply(from, to)
              onClose()
            }}
            disabled={from === '' || to === ''}
          >
            Apply
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="wx-field">
          <label className="wx-field__label" htmlFor="an-from">
            From
          </label>
          <input
            id="an-from"
            type="date"
            className="wx-input"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>
        <div className="wx-field">
          <label className="wx-field__label" htmlFor="an-to">
            To
          </label>
          <input
            id="an-to"
            type="date"
            className="wx-input"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>
      </div>
      <p className="wx-caption" style={{ marginTop: 12 }}>
        Mock: any custom range shows the last-30-days dataset, labelled as such.
      </p>
    </Modal>
  )
}

export function AnalyticsPage(): React.JSX.Element {
  const data = useAnalyticsData()
  const [params] = useSearchParams()
  const view = params.get('view') ?? 'overview'
  const [customOpen, setCustomOpen] = useState(false)
  const {
    status,
    failedSections,
    range,
    setRange,
    customNote,
    applyCustom,
    lastUpdated,
    refreshing,
    refresh,
    data: d,
    reload,
  } = data

  return (
    <section
      aria-labelledby="an-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title="Analytics"
        description="Operational intelligence across messaging, leads, AI, automation, and channels."
        secondaryActions={
          <>
            <span className="wx-caption" role="status" aria-live="polite">
              Updated {lastUpdated}
              {refreshing ? ' · updating…' : ''}
            </span>
            <Button variant="secondary" size="md" onClick={refresh} loading={refreshing}>
              Refresh
            </Button>
          </>
        }
      />

      <div
        style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}
        role="group"
        aria-label="Time range"
      >
        <label className="wx-caption">
          Range
          <select
            className="wx-select"
            value={range}
            onChange={e => {
              const v = e.target.value as TimeRange
              if (v === 'custom') setCustomOpen(true)
              else setRange(v)
            }}
            aria-label="Time range"
            style={{ minWidth: 160 }}
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom…</option>
          </select>
        </label>
        {customNote !== null && <span className="wx-caption">{customNote}</span>}
      </div>

      {status === 'loading' ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          role="status"
          aria-label="Loading analytics"
        >
          <Skeleton height={110} />
          <Skeleton height={220} />
          <Skeleton height={220} />
        </div>
      ) : status === 'error' ? (
        <ErrorState
          title="Analytics failed to load"
          body="No data was lost. Retry to reload every section."
          onRetry={reload}
          requestId="an-all"
        />
      ) : status === 'empty' ? (
        <EmptyState
          title="No analytics yet"
          body="Connect a channel and let conversations flow — messaging, lead, AI, and automation metrics will appear here."
          action={
            <Link to="/channels" className="wx-btn wx-btn--primary wx-btn--md">
              Connect a channel
            </Link>
          }
        />
      ) : (
        <>
          {view === 'overview' && (
            <>
              <div className="an-kpis" role="group" aria-label="Key metrics">
                {d.kpis.map(k => (
                  <div key={k.id} className="an-kpi">
                    <Metric label={k.label} value={k.value} hint={`${k.delta} ${k.hint}`} />
                    <span
                      className={
                        k.direction === 'up'
                          ? 'an-delta-up'
                          : k.direction === 'down'
                            ? 'an-delta-down'
                            : 'an-delta-flat'
                      }
                    >
                      <Link to={k.to} className="wx-link-btn wx-body-sm" aria-label={k.linkLabel}>
                        {k.linkLabel} →
                      </Link>
                    </span>
                  </div>
                ))}
              </div>
              <div className="an-grid-2">
                <ChartCard title="Message activity" subtitle="Inbound vs outbound">
                  {failedSections.includes('messaging') ? (
                    <ErrorState
                      title="Message chart failed"
                      body="Other sections are unaffected."
                      onRetry={reload}
                      requestId="an-messaging"
                    />
                  ) : (
                    <LineChart
                      labels={d.messages.map(p => p.label)}
                      series={[
                        {
                          label: 'Inbound',
                          color: 'var(--accent-primary)',
                          values: d.messages.map(p => p.inbound),
                        },
                        {
                          label: 'Outbound',
                          color: 'var(--accent-ai)',
                          values: d.messages.map(p => p.outbound),
                        },
                      ]}
                      summary={`Message activity: ${d.usage.messages.toLocaleString()} total messages in range.`}
                    />
                  )}
                </ChartCard>
                <ChartCard
                  title="Usage vs quota (mock)"
                  subtitle="Tokens, calls, and cost"
                  action={
                    <Link to="/billing" className="wx-link-btn wx-body-sm">
                      Billing manages plan & invoices →
                    </Link>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p className="wx-label">
                      Tokens · {d.usage.tokens.toLocaleString()} · {d.usage.quotaPct}% of quota
                    </p>
                    <div
                      className={`an-bar${d.usage.quotaPct >= 80 ? ' an-bar--warn' : ''}`}
                      role="img"
                      aria-label={`Token quota ${d.usage.quotaPct} percent (mock)`}
                    >
                      <div style={{ width: `${Math.min(100, d.usage.quotaPct)}%` }} />
                    </div>
                    <p className="wx-body-sm">
                      Calls {d.usage.calls.toLocaleString()} · est. cost {d.usage.cost} (mock) ·
                      Usage informs AI and messaging cost.
                    </p>
                  </div>
                </ChartCard>
              </div>
            </>
          )}
          {view === 'messaging' && <MessagingView />}
          {view === 'leads' && <LeadsView />}
          {view === 'ai' && <AiView />}
          {view === 'automation' && <AutomationView />}
          {view === 'channels' && <ChannelsView />}
        </>
      )}

      {customOpen && (
        <CustomRangeModal onClose={() => setCustomOpen(false)} onApply={applyCustom} />
      )}
    </section>
  )
}
