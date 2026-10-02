import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Badge, KeyValue, Metric } from '@/design-system/components/data'
import { ChartCard, LineChart } from '@/design-system/components/charts'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { Drawer } from '@/design-system/components/overlays'
import { Tabs } from '@/design-system/components/tabs'
import { billingAgentsMock, billingMock, usageSeriesMock } from './mock'
import { InvoiceStatusBadge } from './billingUi'
import type { Invoice, InvoiceStatus } from './types'
import { useBillingData } from './useBillingData'
import './Billing.css'

/* Billing: overview, usage, invoices, settings via in-page tabs.
   Costs are mock values in project convention — no pricing formula invented. */

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'usage', label: 'Usage' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'settings', label: 'Settings' },
]

export function BillingPage(): React.JSX.Element {
  const data = useBillingData()
  const [tab, setTab] = useState('overview')
  const {
    status,
    failedSections,
    searching,
    invoiceQuery,
    setInvoiceQuery,
    invoiceStatus,
    setInvoiceStatus,
    resetInvoiceFilters,
    invoices,
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
  } = data
  const s = billingMock

  return (
    <section
      aria-labelledby="bi-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title="Billing"
        description="Manage billing information and understand workspace usage. All amounts are mock values."
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

      {status === 'loading' ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          role="status"
          aria-label="Loading billing"
        >
          <Skeleton height={110} />
          <Skeleton height={220} />
          <Skeleton height={220} />
        </div>
      ) : status === 'error' ? (
        <ErrorState
          title="Billing failed to load"
          body="No charges were made. Retry to reload usage and invoices."
          onRetry={reload}
          requestId="bi-all"
        />
      ) : status === 'empty' ? (
        <EmptyState
          title="No billing data yet"
          body="Usage information will appear once the workspace generates activity. Connect a channel to get started."
          action={
            <Link to="/channels" className="wx-btn wx-btn--primary wx-btn--md">
              Connect a channel
            </Link>
          }
        />
      ) : (
        <>
          <Tabs items={TABS} activeId={tab} label="Billing sections" onChange={setTab} />

          {tab === 'overview' && (
            <>
              <p className="wx-body-sm">
                Current period: <strong>{s.period}</strong> · Pro workspace · token quota 100K/month
                (per architecture).
              </p>
              <div className="bi-kpis" role="group" aria-label="Current usage">
                <div className="bi-kpi">
                  <Metric
                    label="Messages"
                    value={s.messages.total.toLocaleString()}
                    hint="This period"
                  />
                  <Link to="/analytics?view=messaging" className="wx-link-btn wx-body-sm">
                    Message activity →
                  </Link>
                </div>
                <div className="bi-kpi">
                  <Metric label="AI calls" value={s.aiCalls.toLocaleString()} hint="This period" />
                  <Link to="/analytics?view=ai" className="wx-link-btn wx-body-sm">
                    AI analytics →
                  </Link>
                </div>
                <div className="bi-kpi">
                  <Metric
                    label="AI tokens"
                    value={s.aiTokens.toLocaleString()}
                    hint="82% of quota"
                  />
                  <Link to="/ai?view=usage" className="wx-link-btn wx-body-sm">
                    AI usage →
                  </Link>
                </div>
                <div className="bi-kpi">
                  <Metric label="Total cost (mock)" value={s.totalCost} hint="This period" />
                  <Link to="/analytics?view=ai" className="wx-link-btn wx-body-sm">
                    Cost breakdown →
                  </Link>
                </div>
              </div>
              <div className="bi-grid-2">
                <ChartCard title="Usage by category" subtitle="Messaging vs AI (mock)">
                  <KeyValue
                    items={[
                      {
                        key: 'Messaging',
                        value: `${s.messages.total.toLocaleString()} messages · ${s.messages.sent.toLocaleString()} sent / ${s.messages.received.toLocaleString()} received`,
                      },
                      {
                        key: 'AI',
                        value: `${s.aiCalls.toLocaleString()} calls · ${s.aiTokens.toLocaleString()} tokens · ${s.totalCost}`,
                      },
                    ]}
                  />
                  <p className="wx-caption">
                    Messaging and AI are reported separately. No per-message or per-token price is
                    defined — costs are mock totals.
                  </p>
                </ChartCard>
                <ChartCard
                  title="Token quota (mock)"
                  subtitle={`${s.quota.tier} · architecture-defined`}
                >
                  <p className="wx-label">
                    {s.quota.tokensUsed.toLocaleString()} / {s.quota.tokensLimit.toLocaleString()}{' '}
                    tokens (82%)
                  </p>
                  <div
                    className="bi-bar bi-bar--warn"
                    role="img"
                    aria-label="Token quota 82 percent used (mock)"
                  >
                    <div style={{ width: '82%' }} />
                  </div>
                  <p className="wx-body-sm">
                    Approaching the monthly quota. Over-quota handling follows the
                    architecture&apos;s cost controls — AI falls back rather than failing silently.
                  </p>
                  <p className="wx-caption">
                    <Link to="/ai?view=usage">Review AI usage →</Link>
                  </p>
                </ChartCard>
              </div>
              <ChartCard
                title="Recent invoices"
                action={
                  <button
                    type="button"
                    className="wx-link-btn wx-body-sm"
                    onClick={() => setTab('invoices')}
                  >
                    All invoices →
                  </button>
                }
              >
                <ul className="wx-list">
                  {data.invoices.slice(0, 3).map(i => (
                    <li key={i.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                      <InvoiceStatusBadge status={i.status} />
                      <span style={{ flex: 1 }}>
                        <button
                          type="button"
                          className="wx-link-btn wx-body-sm"
                          style={{ fontWeight: 600 }}
                          onClick={() => selectInvoice(i.id)}
                          aria-label={`Open ${i.id}`}
                        >
                          {i.id} · {i.period}
                        </button>
                        <span className="wx-caption" style={{ display: 'block' }}>
                          {i.date} · {i.amount}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </ChartCard>
            </>
          )}

          {tab === 'usage' &&
            (failedSections.includes('usage') ? (
              <ErrorState
                title="Usage failed to load"
                body="Invoices and settings below are unaffected."
                onRetry={reload}
                requestId="bi-usage"
              />
            ) : (
              <>
                <div className="bi-grid-2">
                  <ChartCard title="Messages over time" subtitle="Total per day (mock)">
                    <LineChart
                      labels={usageSeriesMock.map(p => p.label)}
                      series={[
                        {
                          label: 'Messages',
                          color: 'var(--accent-primary)',
                          values: usageSeriesMock.map(p => p.messages),
                        },
                      ]}
                      summary={`Messages per day, total ${s.messages.total.toLocaleString()} for the period.`}
                    />
                  </ChartCard>
                  <ChartCard
                    title="Cost over time (mock)"
                    subtitle="Daily totals, no pricing formula"
                  >
                    <LineChart
                      labels={usageSeriesMock.map(p => p.label)}
                      series={[
                        {
                          label: 'Cost $',
                          color: 'var(--accent-ai)',
                          values: usageSeriesMock.map(p => p.cost),
                        },
                      ]}
                      summary="Mock daily cost totals for the period."
                    />
                  </ChartCard>
                </div>
                <ChartCard
                  title="Message direction (period totals)"
                  subtitle="Reporting only — no separate billing treatment implied"
                >
                  <KeyValue
                    items={[
                      { key: 'Sent', value: s.messages.sent.toLocaleString() },
                      { key: 'Received', value: s.messages.received.toLocaleString() },
                      { key: 'Total', value: s.messages.total.toLocaleString() },
                    ]}
                  />
                  <p className="wx-caption">
                    <Link to="/analytics?view=messaging">Message analytics →</Link>
                  </p>
                </ChartCard>
                <ChartCard
                  title="AI usage by agent"
                  subtitle="Mock costs · links to agent detail"
                  action={
                    <Link to="/ai?view=usage" className="wx-link-btn wx-body-sm">
                      AI usage →
                    </Link>
                  }
                >
                  <div className="wx-table-wrap">
                    <table className="wx-table">
                      <caption
                        className="wx-caption"
                        style={{ textAlign: 'left', padding: '8px 16px' }}
                      >
                        Calls, tokens, and mock cost per agent.
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Agent</th>
                          <th scope="col">Calls</th>
                          <th scope="col">Tokens</th>
                          <th scope="col">Cost (mock)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingAgentsMock.map(a => (
                          <tr key={a.agentId}>
                            <td>
                              <Link to={`/ai/${a.agentId}?tab=usage`} style={{ fontWeight: 600 }}>
                                {a.agentName}
                              </Link>
                            </td>
                            <td className="wx-body-sm">{a.calls.toLocaleString()}</td>
                            <td className="wx-body-sm">{a.tokens.toLocaleString()}</td>
                            <td className="wx-body-sm">{a.cost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ChartCard>
              </>
            ))}

          {tab === 'invoices' &&
            (failedSections.includes('invoices') ? (
              <ErrorState
                title="Invoices failed to load"
                body="Usage and settings above are unaffected."
                onRetry={reload}
                requestId="bi-invoices"
              />
            ) : (
              <>
                <div className="bi-toolbar" role="search">
                  <input
                    type="search"
                    className="wx-input bi-search"
                    placeholder="Search invoice ID or period…"
                    value={invoiceQuery}
                    onChange={e => setInvoiceQuery(e.target.value)}
                    aria-label="Search invoices"
                  />
                  <label className="wx-caption">
                    Status
                    <select
                      className="wx-select"
                      value={invoiceStatus}
                      onChange={e => setInvoiceStatus(e.target.value as InvoiceStatus | 'all')}
                      aria-label="Filter by invoice status"
                    >
                      <option value="all">All statuses</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="draft">Draft</option>
                    </select>
                  </label>
                  {(invoiceQuery !== '' || invoiceStatus !== 'all') && (
                    <button
                      type="button"
                      className="wx-link-btn wx-body-sm"
                      onClick={resetInvoiceFilters}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="wx-caption" role="status" aria-live="polite">
                  {`${invoices.length} invoices`}
                  {searching && ' · searching…'}
                </p>
                {searching ? (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                    role="status"
                    aria-label="Searching invoices"
                  >
                    <Skeleton height={56} />
                    <Skeleton height={56} />
                  </div>
                ) : invoices.length === 0 && (invoiceQuery !== '' || invoiceStatus !== 'all') ? (
                  <EmptyState
                    title={
                      invoiceQuery !== ''
                        ? `No results for “${invoiceQuery}”`
                        : 'No invoices with this status'
                    }
                    body="Try another term or status."
                    action={
                      <Button variant="secondary" size="md" onClick={resetInvoiceFilters}>
                        Clear search & filters
                      </Button>
                    }
                  />
                ) : invoices.length === 0 ? (
                  <EmptyState
                    title="No invoices"
                    body="Invoices will appear here when billing records exist."
                  />
                ) : (
                  <>
                    <div className="wx-table-wrap bi-tablewrap">
                      <table className="wx-table">
                        <caption
                          className="wx-caption"
                          style={{ textAlign: 'left', padding: '8px 16px' }}
                        >
                          Invoices are mock records.
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Invoice</th>
                            <th scope="col">Period</th>
                            <th scope="col">Date</th>
                            <th scope="col">Amount (mock)</th>
                            <th scope="col">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(i => (
                            <tr key={i.id}>
                              <td>
                                <button
                                  type="button"
                                  className="wx-link-btn"
                                  style={{ fontWeight: 600 }}
                                  onClick={() => selectInvoice(i.id)}
                                  aria-label={`Open ${i.id}`}
                                >
                                  {i.id}
                                </button>
                              </td>
                              <td className="wx-body-sm">{i.period}</td>
                              <td className="wx-body-sm">{i.date}</td>
                              <td className="wx-body-sm">{i.amount}</td>
                              <td>
                                <InvoiceStatusBadge status={i.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ul className="bi-cards">
                      {invoices.map(i => (
                        <li key={i.id} className="bi-card">
                          <span
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center',
                              flexWrap: 'wrap',
                            }}
                          >
                            <button
                              type="button"
                              className="wx-link-btn wx-body"
                              style={{ fontWeight: 600 }}
                              onClick={() => selectInvoice(i.id)}
                            >
                              {i.id}
                            </button>
                            <InvoiceStatusBadge status={i.status} />
                          </span>
                          <span className="wx-caption">
                            {i.period} · {i.date} · {i.amount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ))}

          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
              <div className="wx-field">
                <label className="wx-field__label" htmlFor="bi-name">
                  Billing name
                </label>
                <input
                  id="bi-name"
                  className="wx-input"
                  value={settings.billingName}
                  onChange={e => updateSettings({ billingName: e.target.value })}
                />
              </div>
              <div className="wx-field">
                <label className="wx-field__label" htmlFor="bi-email">
                  Billing contact email
                </label>
                <input
                  id="bi-email"
                  type="email"
                  className="wx-input"
                  value={settings.contactEmail}
                  onChange={e => updateSettings({ contactEmail: e.target.value })}
                  aria-describedby="bi-email-hint"
                />
                <p id="bi-email-hint" className="wx-caption">
                  Invoices and billing notices go here (mock — nothing is sent).
                </p>
              </div>
              <label className="wx-check-row">
                <input
                  type="checkbox"
                  checked={settings.invoiceEmail}
                  onChange={e => updateSettings({ invoiceEmail: e.target.checked })}
                />
                <span>
                  <span className="wx-label">Email invoices when issued</span>
                  <span className="wx-caption" style={{ display: 'block' }}>
                    Mock preference — no emails are sent.
                  </span>
                </span>
              </label>
              {settingsDirty && (
                <span style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" size="md" onClick={discardSettings}>
                    Discard
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={saveSettings}
                    loading={settingsSaving}
                  >
                    Save settings
                  </Button>
                </span>
              )}
              <div>
                <p className="wx-field__label" style={{ marginBottom: 8 }}>
                  Payment method
                </p>
                <p className="wx-body-sm">No payment method connected.</p>
                <p className="wx-caption">
                  Provider integration (e.g. card payments) lands later — this area is a reserved
                  placeholder, not a functional form.
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  disabled
                  title="Payment provider integration is not available in this mock"
                >
                  Add payment method
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedInvoice && (
        <InvoiceDrawer
          invoice={selectedInvoice}
          onClose={() => selectInvoice(null)}
          onDownload={() => downloadInvoice(selectedInvoice.id)}
        />
      )}
    </section>
  )
}

function InvoiceDrawer({
  invoice: inv,
  onClose,
  onDownload,
}: {
  invoice: Invoice
  onClose: () => void
  onDownload: () => void
}): React.JSX.Element {
  return (
    <Drawer title={inv.id} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <InvoiceStatusBadge status={inv.status} />
        <KeyValue
          items={[
            { key: 'Period', value: inv.period },
            { key: 'Date', value: inv.date },
            { key: 'Amount (mock)', value: inv.amount },
            { key: 'Messages', value: inv.messages.toLocaleString() },
            { key: 'AI tokens', value: inv.tokens.toLocaleString() },
            { key: 'AI calls', value: inv.calls.toLocaleString() },
          ]}
        />
        {inv.status === 'failed' && (
          <p role="alert" className="wx-field__error">
            This payment failed (mock). Contact billing support to retry — no payment action exists
            in this mock.
          </p>
        )}
        {inv.status === 'draft' && (
          <p className="wx-caption">Draft — not issued. Totals update until the period closes.</p>
        )}
        {inv.status === 'pending' && (
          <p className="wx-caption">Pending — totals update until the period closes.</p>
        )}
        <span style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="md" onClick={onDownload}>
            Download CSV (mock)
          </Button>
          {inv.status === 'failed' && <Badge tone="danger">Needs attention</Badge>}
        </span>
      </div>
    </Drawer>
  )
}
