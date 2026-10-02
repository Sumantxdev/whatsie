import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '@/design-system/components/data'
import { BarChart, ChartCard, DonutChart, LineChart } from '@/design-system/components/charts'
import { EmptyState, ErrorState } from '@/design-system/components/feedback'
import { useAnalyticsData } from './useAnalyticsData'
import './Analytics.css'

/* Detail views for the five contextual tabs. Each owns its filters, tables,
   empty/error states, and cross-links — failures never blank siblings. */

function SectionError({ id, onRetry }: { id: string; onRetry: () => void }): React.JSX.Element {
  return (
    <ErrorState
      title="Section failed to load"
      body="Other analytics are unaffected."
      onRetry={onRetry}
      requestId={`an-${id}`}
    />
  )
}

export function MessagingView(): React.JSX.Element {
  const { data: d, failedSections, reload } = useAnalyticsData()
  const [platform, setPlatform] = useState('all')
  const rows = useMemo(
    () => (platform === 'all' ? d.channels : d.channels.filter(c => c.platform === platform)),
    [d.channels, platform]
  )
  if (failedSections.includes('messaging')) return <SectionError id="messaging" onRetry={reload} />
  if (d.messages.length === 0) {
    return (
      <EmptyState
        title="No message activity"
        body="Messaging activity will appear once channels are active."
        action={
          <Link to="/channels" className="wx-btn wx-btn--primary wx-btn--md">
            Connect a channel
          </Link>
        }
      />
    )
  }
  const totalIn = d.messages.reduce((s, p) => s + p.inbound, 0)
  const totalOut = d.messages.reduce((s, p) => s + p.outbound, 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ChartCard
        title="Inbound vs outbound"
        subtitle={`${totalIn.toLocaleString()} in · ${totalOut.toLocaleString()} out`}
      >
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
          summary={`Inbound ${totalIn} and outbound ${totalOut} messages over the selected range.`}
        />
      </ChartCard>
      <ChartCard
        title="Conversations by channel"
        action={
          <label className="wx-caption">
            Highlight
            <select
              className="wx-select"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              aria-label="Highlight channel"
              style={{ minWidth: 150 }}
            >
              <option value="all">All channels</option>
              {d.channels.map(c => (
                <option key={c.platform} value={c.platform}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        }
      >
        <BarChart
          bars={rows.map(c => ({
            label: c.label,
            value: c.conversations,
            hint: c.connected ? undefined : 'not connected',
            color:
              platform !== 'all' && c.platform !== platform ? 'var(--border-strong)' : undefined,
          }))}
          summary="Conversation counts per channel for the selected range."
        />
        <p className="wx-caption">
          <Link to="/inbox">Open Inbox →</Link>
        </p>
      </ChartCard>
    </div>
  )
}

export function LeadsView(): React.JSX.Element {
  const { data: d, failedSections, reload } = useAnalyticsData()
  if (failedSections.includes('leads')) return <SectionError id="leads" onRetry={reload} />
  if (d.funnel.every(f => f.count === 0)) {
    return (
      <EmptyState
        title="No lead data"
        body="Lead activity will appear as conversations create and move leads."
        action={
          <Link to="/contacts" className="wx-btn wx-btn--secondary wx-btn--md">
            Open Contacts
          </Link>
        }
      />
    )
  }
  const max = Math.max(1, ...d.funnel.map(f => f.count))
  return (
    <div className="an-grid-2">
      <ChartCard title="Lifecycle funnel" subtitle="Factual stage counts, no scores">
        <div className="an-funnel">
          {d.funnel.map(f => (
            <div key={f.stage} className="an-funnel-row">
              <span
                className="wx-caption"
                style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}
              >
                {f.stage}
              </span>
              <div className="an-funnel-bar" role="img" aria-label={`${f.stage}: ${f.count} leads`}>
                <div
                  className="an-funnel-fill"
                  style={{ width: `${Math.round((f.count / max) * 100)}%` }}
                />
              </div>
              <span className="wx-label" style={{ textAlign: 'right' }}>
                {f.count}
              </span>
            </div>
          ))}
        </div>
        <p className="wx-caption">
          <Link to="/contacts?view=pipeline">Open pipeline →</Link>
        </p>
      </ChartCard>
      <ChartCard title="Stage distribution" subtitle="Share of each lifecycle stage">
        <DonutChart
          centerLabel="leads"
          summary={`Lead distribution: ${d.funnel.map(f => `${f.stage} ${f.count}`).join(', ')}.`}
          segments={d.funnel.map((f, i) => ({
            label: f.stage,
            value: f.count,
            color:
              [
                'var(--accent-primary)',
                'var(--accent-ai)',
                'var(--warning-text)',
                'var(--success-text)',
                'var(--text-muted)',
              ][i] ?? 'var(--text-muted)',
          }))}
        />
      </ChartCard>
      <ChartCard title="Recent lifecycle movement">
        <ul className="wx-list">
          {d.movements.map(m => (
            <li key={m.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
              <Badge tone="neutral">status</Badge>
              <span style={{ flex: 1 }}>
                <span className="wx-body-sm" style={{ display: 'block' }}>
                  {m.leadId ? <Link to={`/contacts/${m.leadId}`}>{m.leadName}</Link> : m.leadName}:{' '}
                  {m.text}
                </span>
                <span className="wx-caption">{m.time}</span>
              </span>
            </li>
          ))}
        </ul>
      </ChartCard>
    </div>
  )
}

export function AiView(): React.JSX.Element {
  const { data: d, failedSections, reload } = useAnalyticsData()
  const [agentFilter, setAgentFilter] = useState('all')
  const [sortDesc, setSortDesc] = useState(true)
  const rows = useMemo(() => {
    const list = agentFilter === 'all' ? d.agents : d.agents.filter(a => a.agentId === agentFilter)
    return [...list].sort((a, b) => (sortDesc ? b.calls - a.calls : a.calls - b.calls))
  }, [d.agents, agentFilter, sortDesc])
  if (failedSections.includes('ai')) return <SectionError id="ai" onRetry={reload} />
  if (d.agents.every(a => a.calls === 0)) {
    return (
      <EmptyState
        title="No AI usage"
        body="AI metrics will appear once AI agents handle conversations."
        action={
          <Link to="/ai" className="wx-btn wx-btn--secondary wx-btn--md">
            Open AI agents
          </Link>
        }
      />
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="an-grid-2">
        <ChartCard title="AI calls over time" subtitle="Includes fallbacks and failures">
          <LineChart
            labels={d.aiSeries.map(p => p.label)}
            series={[
              {
                label: 'AI calls',
                color: 'var(--accent-ai)',
                values: d.aiSeries.map(p => p.calls),
              },
            ]}
            summary="AI calls per period across all agents."
          />
        </ChartCard>
        <ChartCard title="Token usage over time" subtitle="Mock values, API-ready shape">
          <LineChart
            labels={d.tokenSeries.map(p => p.label)}
            series={[
              {
                label: 'Tokens',
                color: 'var(--accent-primary)',
                values: d.tokenSeries.map(p => p.tokens),
              },
            ]}
            summary="Token consumption per period across all agents."
          />
        </ChartCard>
      </div>
      <ChartCard
        title="Usage by agent"
        subtitle="Calls, tokens, est. cost (mock), latency, fallback"
        action={
          <label className="wx-caption">
            Agent
            <select
              className="wx-select"
              value={agentFilter}
              onChange={e => setAgentFilter(e.target.value)}
              aria-label="Filter by agent"
              style={{ minWidth: 170 }}
            >
              <option value="all">All agents</option>
              {d.agents.map(a => (
                <option key={a.agentId} value={a.agentId}>
                  {a.agentName}
                </option>
              ))}
            </select>
          </label>
        }
      >
        <div className="wx-table-wrap">
          <table className="wx-table">
            <caption className="wx-caption" style={{ textAlign: 'left', padding: '8px 16px' }}>
              Per-agent usage. Costs are mock values.
            </caption>
            <thead>
              <tr>
                <th scope="col">Agent</th>
                <th scope="col">
                  <button
                    type="button"
                    className="wx-link-btn"
                    onClick={() => setSortDesc(v => !v)}
                    aria-label={`Sort by calls, currently ${sortDesc ? 'descending' : 'ascending'}`}
                  >
                    Calls {sortDesc ? '↓' : '↑'}
                  </button>
                </th>
                <th scope="col">Tokens</th>
                <th scope="col">Est. cost</th>
                <th scope="col">Avg latency</th>
                <th scope="col">Fallback</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => (
                <tr key={a.agentId}>
                  <td>
                    <Link to={`/ai/${a.agentId}?tab=usage`} style={{ fontWeight: 600 }}>
                      {a.agentName}
                    </Link>
                  </td>
                  <td className="wx-body-sm">{a.calls.toLocaleString()}</td>
                  <td className="wx-body-sm">{a.tokens.toLocaleString()}</td>
                  <td className="wx-body-sm">{a.cost}</td>
                  <td className="wx-body-sm">{a.avgLatency}</td>
                  <td>
                    <Badge tone={parseFloat(a.fallbackRate) > 5 ? 'warning' : 'success'}>
                      {a.fallbackRate}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

export function AutomationView(): React.JSX.Element {
  const { data: d, failedSections, reload } = useAnalyticsData()
  if (failedSections.includes('automation'))
    return <SectionError id="automation" onRetry={reload} />
  if (d.execSeries.every(p => p.completed === 0 && p.failed === 0)) {
    return (
      <EmptyState
        title="No workflow executions"
        body="Execution analytics will appear after workflows run."
        action={
          <Link to="/automations" className="wx-btn wx-btn--secondary wx-btn--md">
            Open Automation
          </Link>
        }
      />
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ChartCard title="Executions over time" subtitle="Completed vs failed runs">
        <LineChart
          labels={d.execSeries.map(p => p.label)}
          series={[
            {
              label: 'Completed',
              color: 'var(--success-text)',
              values: d.execSeries.map(p => p.completed),
            },
            {
              label: 'Failed',
              color: 'var(--danger-text)',
              values: d.execSeries.map(p => p.failed),
            },
          ]}
          summary="Completed and failed workflow executions per period."
        />
      </ChartCard>
      <ChartCard title="Most active workflows" subtitle="Ranked explicitly by execution count">
        <div className="wx-table-wrap">
          <table className="wx-table">
            <caption className="wx-caption" style={{ textAlign: 'left', padding: '8px 16px' }}>
              Workflows by run count, most active first.
            </caption>
            <thead>
              <tr>
                <th scope="col">Workflow</th>
                <th scope="col">Runs</th>
                <th scope="col">Failed</th>
              </tr>
            </thead>
            <tbody>
              {d.topWorkflows.map(w => (
                <tr key={w.workflowId}>
                  <td>
                    <Link to={`/automations/${w.workflowId}`} style={{ fontWeight: 600 }}>
                      {w.workflowName}
                    </Link>
                  </td>
                  <td className="wx-body-sm">{w.runs.toLocaleString()}</td>
                  <td>
                    {w.failed === 0 ? (
                      <Badge tone="success">0</Badge>
                    ) : (
                      <Badge tone="danger">{w.failed}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}

export function ChannelsView(): React.JSX.Element {
  const { data: d, failedSections, reload } = useAnalyticsData()
  const [sortDesc, setSortDesc] = useState(true)
  const rows = useMemo(
    () =>
      [...d.channels].sort((a, b) =>
        sortDesc ? b.messages - a.messages : a.messages - b.messages
      ),
    [d.channels, sortDesc]
  )
  if (failedSections.includes('channels')) return <SectionError id="channels" onRetry={reload} />
  if (d.channels.every(c => c.messages === 0 && c.conversations === 0)) {
    return (
      <EmptyState
        title="No channel activity"
        body="Activity will appear after connected channels are used."
        action={
          <Link to="/channels" className="wx-btn wx-btn--secondary wx-btn--md">
            Open Channels
          </Link>
        }
      />
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ChartCard
        title="Messages by channel"
        subtitle="Activity only — connection health lives on each channel"
      >
        <BarChart
          bars={rows.map(c => ({
            label: c.label,
            value: c.messages,
            hint: c.connected ? undefined : 'not connected',
          }))}
          summary={`Messages per channel: ${rows.map(c => `${c.label} ${c.messages}`).join(', ')}.`}
        />
      </ChartCard>
      <ChartCard title="Channel detail">
        <div className="wx-table-wrap">
          <table className="wx-table">
            <caption className="wx-caption" style={{ textAlign: 'left', padding: '8px 16px' }}>
              Activity and connection state per platform.
            </caption>
            <thead>
              <tr>
                <th scope="col">Channel</th>
                <th scope="col">
                  <button
                    type="button"
                    className="wx-link-btn"
                    onClick={() => setSortDesc(v => !v)}
                    aria-label={`Sort by messages, currently ${sortDesc ? 'descending' : 'ascending'}`}
                  >
                    Messages {sortDesc ? '↓' : '↑'}
                  </button>
                </th>
                <th scope="col">Conversations</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.platform}>
                  <td>
                    <Link to={`/channels/${c.channelId}`} style={{ fontWeight: 600 }}>
                      {c.label}
                    </Link>
                  </td>
                  <td className="wx-body-sm">{c.messages.toLocaleString()}</td>
                  <td className="wx-body-sm">{c.conversations.toLocaleString()}</td>
                  <td>
                    <Badge tone={c.connected ? 'success' : 'neutral'}>
                      {c.connected ? 'Active' : 'Not connected'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
