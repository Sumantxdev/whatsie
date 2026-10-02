import { Link } from 'react-router'
import type { CSSProperties } from 'react'
import { Camera, MessageCircle, MessageSquare, Send } from 'lucide-react'
import { PageHeader } from '@/app/shell/PageHeader'
import { Avatar, Badge, DataList, Metric, StatusIndicator } from '@/design-system/components/data'
import { Alert, EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { Icon } from '@/design-system/components/icons'
import { channelTheme } from '@/features/channels/platforms'
import type { AttentionItem, ChannelHealth } from './types'
import { useHomeData } from './useHomeData'
import './HomePage.css'

/* Home: what happened + what needs attention. Overview only — details live in areas. */

function SectionHead({
  id,
  title,
  to,
  linkLabel,
}: {
  id: string
  title: string
  to: string
  linkLabel: string
}): React.JSX.Element {
  return (
    <div className="home-section-head">
      <h2 id={id} className="wx-h2">
        {title}
      </h2>
      <Link to={to} className="wx-link-btn wx-body-sm" aria-label={linkLabel}>
        View all
      </Link>
    </div>
  )
}

function attentionTone(severity: AttentionItem['severity']): 'danger' | 'warning' | 'info' {
  return severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'info'
}

function channelStatus(state: ChannelHealth['state']): {
  indicator: 'active' | 'processing' | 'warning' | 'error' | 'idle'
  label: string
} {
  switch (state) {
    case 'connected':
      return { indicator: 'active', label: 'Connected' }
    case 'connecting':
    case 'reconnecting':
      return {
        indicator: 'processing',
        label: state === 'connecting' ? 'Connecting' : 'Reconnecting',
      }
    case 'degraded':
      return { indicator: 'warning', label: 'Degraded' }
    case 'auth-issue':
      return { indicator: 'error', label: 'Auth issue' }
    case 'disconnected':
    default:
      return { indicator: 'error', label: 'Disconnected' }
  }
}

const CHANNEL_ICONS = {
  whatsapp: MessageCircle,
  instagram: Camera,
  telegram: Send,
  messenger: MessageSquare,
} as const

/* Centralized execution status themes for Workflow Activity rows. One row
   component reads from here — never inline per-status styles. */

export interface ExecutionTheme {
  accent: string
  background: string
  border: string
  hover: string
}

export const EXECUTION_THEMES = {
  failed: {
    accent: '#DC2626',
    background: '#FEF2F2',
    border: '#FECACA',
    hover: '#FEE2E2',
  },
  in_progress: {
    accent: '#7C3AED',
    background: '#FAF5FF',
    border: '#DDD6FE',
    hover: '#F3E8FF',
  },
  completed: {
    accent: '#16A34A',
    background: '#F0FDF4',
    border: '#BBF7D0',
    hover: '#DCFCE7',
  },
} as const satisfies Record<string, ExecutionTheme>

export function executionTheme(status: string): ExecutionTheme | undefined {
  return (EXECUTION_THEMES as Record<string, ExecutionTheme>)[status]
}

function LoadingView(): React.JSX.Element {
  return (
    <div className="home" aria-label="Loading dashboard">
      <Skeleton height={38} width="45%" />
      <Skeleton height={18} width="65%" />
      <div className="home-metrics">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} height={110} />
        ))}
      </div>
      <Skeleton height={140} />
      <Skeleton height={220} />
    </div>
  )
}

export function HomePage(): React.JSX.Element {
  const { status, snapshot, failedSections, reload } = useHomeData()

  if (status === 'loading') return <LoadingView />

  if (status === 'error' || !snapshot) {
    return (
      <div className="home">
        <PageHeader title="Home" description="What needs attention in this workspace." />
        <ErrorState
          title="Dashboard failed to load"
          body="Check your connection and retry. Individual sections recover independently once loading resumes."
          onRetry={reload}
          requestId="home-500"
        />
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className="home">
        <PageHeader
          title={`Welcome to ${snapshot.workspaceName}`}
          description="Connect a channel to receive your first conversation. This checklist mirrors workspace setup."
          primaryAction={
            <Link to="/channels" className="wx-btn wx-btn--primary">
              Connect channel
            </Link>
          }
        />
        <div className="wx-card" aria-labelledby="setup-title">
          <h2 id="setup-title" className="wx-h2">
            Get started
          </h2>
          <ol
            className="wx-body"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingLeft: 20,
              margin: '12px 0 0',
            }}
          >
            <li>
              <Link to="/channels">Connect a messaging channel</Link> — WhatsApp, Instagram,
              Telegram…
            </li>
            <li>
              <Link to="/ai">Create an AI agent</Link> — behavior, knowledge, guardrails.
            </li>
            <li>
              <Link to="/automations">Create a workflow</Link> — welcome, follow-up, qualification.
            </li>
            <li>
              <Link to="/inbox">Open Inbox</Link> — first messages create leads automatically.
            </li>
          </ol>
        </div>
        <EmptyState
          title="No activity yet"
          body="Conversations, leads, AI runs, and executions will appear here once the workspace is set up."
        />
      </div>
    )
  }

  const channelsFailed = failedSections.includes('channels')
  const funnelMax = Math.max(...snapshot.funnel.map(f => f.count), 1)

  return (
    <div className="home">
      <PageHeader
        title={`Good afternoon — ${snapshot.workspaceName}`}
        description={`${snapshot.plan} workspace · snapshot across conversations, leads, AI, workflows, and channels.`}
        primaryAction={
          <Link to="/inbox" className="wx-btn wx-btn--primary">
            View Inbox
          </Link>
        }
        secondaryActions={
          <Link to="/channels" className="wx-btn wx-btn--secondary wx-btn--md">
            Connect channel
          </Link>
        }
      />

      {/* Attention */}
      <section
        aria-labelledby="attention-title"
        className="home-attention"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <h2 id="attention-title" className="wx-h2">
          Needs attention
        </h2>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {snapshot.attention.map(item => (
            <li key={item.id}>
              <Alert tone={attentionTone(item.severity)}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                  <span>
                    <Link to={item.to} aria-label={`${item.actionLabel}: ${item.title}`}>
                      {item.actionLabel} →
                    </Link>
                  </span>
                </span>
              </Alert>
            </li>
          ))}
        </ul>
      </section>

      {/* Snapshot metrics */}
      <section aria-labelledby="snapshot-title">
        <h2 id="snapshot-title" className="wx-h2" style={{ marginBottom: 12 }}>
          Workspace snapshot
        </h2>
        <div className="home-metrics">
          {snapshot.metrics.map(m => (
            <div key={m.id} className="home-metric">
              <Metric label={m.label} value={m.value} hint={m.hint} />
              <Link to={m.to} className="wx-link-btn wx-body-sm" aria-label={m.linkLabel}>
                {m.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="home-cols">
        <div className="home-col">
          {/* Conversations */}
          <section
            aria-labelledby="convos-title"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <SectionHead
              id="convos-title"
              title="Conversation activity"
              to="/inbox"
              linkLabel="Open Inbox"
            />
            <DataList>
              {snapshot.conversations.map(c => (
                <li key={c.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                  <Avatar name={c.name} size="sm" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      className="wx-label"
                      style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      {c.name}
                      <Badge tone="neutral">{c.platform}</Badge>
                      {c.status === 'closed' && <Badge tone="success">Resolved</Badge>}
                      {c.aiHandled && <Badge tone="ai">AI</Badge>}
                    </span>
                    <span
                      className="wx-body-sm"
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.preview}
                    </span>
                  </span>
                  <span className="wx-caption" style={{ textAlign: 'right' }}>
                    {c.time}
                    {c.unread > 0 && (
                      <span
                        className="wx-badge wx-badge--accent"
                        style={{ marginLeft: 8 }}
                        aria-label={`${c.unread} unread`}
                      >
                        {c.unread}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </DataList>
          </section>

          {/* Workflows */}
          <section
            aria-labelledby="wf-title"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <SectionHead
              id="wf-title"
              title="Workflow activity"
              to="/automations?view=executions"
              linkLabel="Open executions"
            />
            <p className="wx-body-sm">
              {snapshot.workflows.running} running · {snapshot.workflows.completed24h} completed in
              24h · {snapshot.workflows.failed24h} failed
            </p>
            <DataList className="home-exec-list">
              {snapshot.executions.map(e => {
                const theme = executionTheme(e.status)
                return (
                  <li
                    key={e.id}
                    className="home-exec"
                    style={
                      theme
                        ? ({
                            '--ex-bg': theme.background,
                            '--ex-border': theme.border,
                            '--ex-hover': theme.hover,
                            '--ex-accent': theme.accent,
                          } as CSSProperties)
                        : undefined
                    }
                  >
                    <span className="wx-badge home-exec-pill">
                      {e.status === 'in_progress' ? 'Running' : e.status}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span className="wx-label" style={{ display: 'block' }}>
                        {e.workflow}
                      </span>
                      <span className="wx-caption">{e.lead}</span>
                    </span>
                    <span className="wx-caption">{e.time}</span>
                  </li>
                )
              })}
            </DataList>
          </section>

          {/* Activity */}
          <section
            aria-labelledby="activity-title"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <SectionHead
              id="activity-title"
              title="Recent activity"
              to="/analytics"
              linkLabel="Open analytics"
            />
            <DataList>
              {snapshot.activity.map(a => (
                <li key={a.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                  <Badge tone="neutral">{a.kind.replace('_', ' ')}</Badge>
                  <span style={{ flex: 1 }}>
                    <span className="wx-body-sm" style={{ display: 'block' }}>
                      {a.text}
                    </span>
                    <span className="wx-caption">{a.context}</span>
                  </span>
                  <span className="wx-caption">{a.time}</span>
                </li>
              ))}
            </DataList>
          </section>
        </div>

        <div className="home-col">
          {/* CRM funnel */}
          <section
            aria-labelledby="crm-title"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <SectionHead
              id="crm-title"
              title="Lead pipeline"
              to="/contacts?view=pipeline"
              linkLabel="Open pipeline"
            />
            <div className="home-funnel">
              {snapshot.funnel.map(f => (
                <div key={f.stage} className="home-funnel-row">
                  <span
                    className="wx-caption"
                    style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}
                  >
                    {f.stage}
                  </span>
                  <div
                    className="home-funnel-bar"
                    role="img"
                    aria-label={`${f.stage}: ${f.count} leads`}
                  >
                    <div
                      className="home-funnel-fill"
                      style={{ width: `${Math.round((f.count / funnelMax) * 100)}%` }}
                    />
                  </div>
                  <span className="wx-label" style={{ textAlign: 'right' }}>
                    {f.count}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* AI */}
          <section
            aria-labelledby="ai-title"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <SectionHead
              id="ai-title"
              title="AI health"
              to="/ai?view=usage"
              linkLabel="Open AI usage"
            />
            <StatusIndicator
              state={
                snapshot.ai.status === 'healthy'
                  ? 'active'
                  : snapshot.ai.status === 'degraded'
                    ? 'warning'
                    : 'error'
              }
              label={
                snapshot.ai.status === 'healthy'
                  ? 'AI healthy'
                  : snapshot.ai.status === 'degraded'
                    ? 'AI degraded — fallbacks elevated'
                    : 'AI over quota — canned replies'
              }
            />
            <p className="wx-body-sm">
              {snapshot.ai.tokensUsed} / {snapshot.ai.tokenLimit} tokens ·{' '}
              {snapshot.ai.fallbackRate}
            </p>
            <p className="wx-caption">
              {snapshot.ai.takeovers} human takeovers · {snapshot.ai.errors} errors in 24h
            </p>
          </section>

          {/* Channels */}
          <section
            aria-labelledby="channels-title"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <SectionHead
              id="channels-title"
              title="Channel health"
              to="/channels"
              linkLabel="Open channels"
            />
            {channelsFailed ? (
              <ErrorState
                title="Channel health unavailable"
                body="Other sections are unaffected. Retry channel status."
                onRetry={reload}
                requestId="home-channels"
              />
            ) : (
              <DataList className="home-channel-list">
                {snapshot.channels.map(ch => {
                  const s = channelStatus(ch.state)
                  const PlatformIcon =
                    CHANNEL_ICONS[ch.platform as keyof typeof CHANNEL_ICONS] ?? MessageCircle
                  const theme = channelTheme(ch.platform)
                  return (
                    <li key={ch.id}>
                      <Link
                        to={`/channels/${ch.id}`}
                        className="home-channel"
                        style={
                          theme
                            ? ({
                                '--ch-bg': theme.background,
                                '--ch-border': theme.border,
                                '--ch-hover': theme.hover,
                                '--ch-accent': theme.accent,
                                '--ch-icon-bg': theme.iconBg,
                              } as CSSProperties)
                            : undefined
                        }
                        aria-label={`${ch.label}: ${s.label}, ${ch.detail}`}
                      >
                        <span className="home-channel-icon" aria-hidden="true">
                          <Icon icon={PlatformIcon} size="sm" />
                        </span>
                        <span className="home-channel-main">
                          <span className="wx-label" style={{ display: 'block' }}>
                            {ch.label}
                          </span>
                          <span className="wx-caption">{ch.detail}</span>
                        </span>
                        <span className="home-channel-status">
                          <StatusIndicator state={s.indicator} label={s.label} />
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </DataList>
            )}
          </section>

          {/* Quick actions */}
          <section
            aria-labelledby="quick-title"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <h2 id="quick-title" className="wx-h2">
              Quick actions
            </h2>
            <div className="home-quick">
              {snapshot.actions.map(a => (
                <Link
                  key={a.id}
                  to={a.to}
                  className="wx-btn wx-btn--secondary wx-btn--md"
                  aria-label={`${a.label}: ${a.hint}`}
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {status === 'partial' && (
        <Alert tone="warning">
          Some sections failed to load (channel health). Everything else is current.{' '}
          <Button variant="ghost" size="sm" onClick={reload}>
            Retry failed sections
          </Button>
        </Alert>
      )}
    </div>
  )
}
