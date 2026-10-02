import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Badge, KeyValue } from '@/design-system/components/data'
import { EmptyState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog } from '@/design-system/components/overlays'
import { Tabs } from '@/design-system/components/tabs'
import { agentsMock } from '../ai/mock'
import { CapabilityBadge, ConnectionBadge, HealthBadge } from './channelUi'
import { platformName } from './platforms'
import type { PlatformId } from './types'
import { useChannelsData } from './useChannelsData'
import './Channels.css'

/* Channel detail: overview, activity, configuration, settings.
   Cross-links to Inbox threads and AI agents; failures stay section-local. */

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'settings', label: 'Settings' },
]

const INBOX_BY_PLATFORM: Record<PlatformId, Array<{ id: string; label: string }>> = {
  whatsapp: [
    { id: 'c-maya', label: 'Maya Rao' },
    { id: 'c-priya', label: 'Priya Nair' },
  ],
  telegram: [{ id: 'c-tom', label: 'Tom Becker' }],
  discord: [
    { id: 'c-dev', label: 'Dev Patel' },
    { id: 'c-sofia', label: 'Sofia Marino' },
  ],
  messenger: [{ id: 'c-lena', label: 'Lena Ortiz' }],
  instagram: [{ id: 'c-ana', label: 'Ana Silva' }],
  teams: [{ id: 'c-kenji', label: 'Kenji Sato' }],
  twitch: [{ id: 'c-omar', label: 'Omar Farouk' }],
  twitter: [{ id: 'c-grace', label: 'Grace Lee' }],
}

export function ChannelDetailPage(): React.JSX.Element {
  const { channelId } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = params.get('tab') ?? 'overview'
  const activeTab = TABS.some(t => t.id === tab) ? tab : 'overview'
  const data = useChannelsData(channelId)
  const { channel, detailNotFound, listStatus } = data
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [fieldDrafts, setFieldDrafts] = useState<Record<string, string> | null>(null)

  if (listStatus === 'loading') {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        role="status"
        aria-label="Loading channel"
      >
        <Skeleton height={38} width="40%" />
        <Skeleton height={120} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (detailNotFound || !channel) {
    return (
      <EmptyState
        title="Channel not found"
        body="It may belong to another workspace."
        action={
          <Link to="/channels" className="wx-btn wx-btn--secondary wx-btn--md">
            Back to Channels
          </Link>
        }
      />
    )
  }

  const agent = agentsMock.find(a => a.id === channel.agentId) ?? null
  const threads = INBOX_BY_PLATFORM[channel.id] ?? []
  const drafts = fieldDrafts ?? Object.fromEntries(channel.fields.map(f => [f.key, f.value]))
  const fieldsDirty =
    fieldDrafts !== null &&
    JSON.stringify(Object.fromEntries(channel.fields.map(f => [f.key, f.value]))) !==
      JSON.stringify(fieldDrafts)

  const saveConfig = (): void => {
    if (!fieldDrafts) return
    data.updateFields(channel.fields.map(f => ({ ...f, value: fieldDrafts[f.key] ?? f.value })))
    data.saveSettings()
    setFieldDrafts(null)
  }

  return (
    <section
      aria-labelledby="ch-detail-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title={channel.name || platformName(channel.id)}
        description={channel.account || platformName(channel.id)}
        breadcrumbs={[
          { label: 'Channels', to: '/channels' },
          { label: channel.name || platformName(channel.id) },
        ]}
        primaryAction={
          channel.status === 'error' ? (
            <Button variant="primary" size="md" onClick={data.retryConnection}>
              Reconnect
            </Button>
          ) : channel.status === 'disabled' ? (
            <Button variant="primary" size="md" onClick={() => data.setEnabled(true)}>
              Enable
            </Button>
          ) : channel.status === 'connected' || channel.status === 'attention' ? (
            <Button variant="secondary" size="md" onClick={() => data.setEnabled(false)}>
              Disable
            </Button>
          ) : undefined
        }
      />

      <div
        style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
        role="status"
        aria-label="Channel status"
      >
        <ConnectionBadge status={channel.status} />
        {channel.status !== 'not-connected' && <HealthBadge health={channel.health} />}
        <span className="wx-caption">{channel.statusDetail}</span>
        {data.saving && <span className="wx-body-sm">Saving…</span>}
        {!data.saving && data.savedAt && !data.dirty && (
          <span className="wx-caption">Saved {data.savedAt}</span>
        )}
      </div>

      {channel.status === 'error' && (
        <div
          role="alert"
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <strong className="wx-body-sm" style={{ color: 'var(--danger-text)' }}>
            Connection issue
          </strong>
          <span className="wx-body-sm" style={{ color: 'var(--danger-text)' }}>
            {channel.statusDetail}. Queued messages are held, not dropped.
          </span>
          <span>
            <Button variant="secondary" size="sm" onClick={data.retryConnection}>
              Retry connection
            </Button>
          </span>
        </div>
      )}
      {channel.status === 'attention' && (
        <div
          role="alert"
          style={{
            background: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
          }}
        >
          <span className="wx-body-sm" style={{ color: 'var(--warning-text)' }}>
            {channel.statusDetail}. See Health below.
          </span>
        </div>
      )}

      <Tabs
        items={TABS}
        activeId={activeTab}
        label="Channel sections"
        onChange={id => {
          const next = new URLSearchParams(params)
          next.set('tab', id)
          setParams(next, { preventScrollReset: true })
        }}
      />

      {activeTab === 'overview' && (
        <div className="ch-cols">
          <KeyValue
            items={[
              { key: 'Platform', value: platformName(channel.id) },
              { key: 'Account', value: channel.account || '—' },
              { key: 'Connected', value: channel.connectedAt },
              { key: 'Last activity', value: channel.lastActivity },
              { key: 'Conversations · 24h', value: String(channel.conversations24h) },
              {
                key: 'Default AI agent',
                value: agent ? (
                  <Link to={`/ai/${agent.id}`}>
                    {agent.name} ({agent.status}) →
                  </Link>
                ) : (
                  'None assigned'
                ),
              },
            ]}
          />
          <div>
            <h3 className="wx-h3">Health</h3>
            {channel.checks.length === 0 ? (
              <p className="wx-caption" style={{ marginTop: 8 }}>
                No health checks while not connected.
              </p>
            ) : (
              <ul className="wx-list" style={{ marginTop: 8 }}>
                {channel.checks.map(chk => (
                  <li key={chk.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                    <HealthBadge health={chk.state} />
                    <span style={{ flex: 1 }}>
                      <span className="wx-body-sm" style={{ display: 'block', fontWeight: 600 }}>
                        {chk.label}
                      </span>
                      <span className="wx-caption">{chk.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {channel.checks.length > 0 && (
              <p style={{ marginTop: 8 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={data.retryHealth}
                  loading={data.healthChecking}
                >
                  Re-run checks
                </Button>
              </p>
            )}
            <h3 className="wx-h3" style={{ marginTop: 16 }}>
              Capabilities
            </h3>
            <ul
              style={{
                listStyle: 'none',
                margin: '8px 0 0',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {channel.capabilities.map(c => (
                <li key={c.id}>
                  <CapabilityBadge capability={c} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {threads.length > 0 && (
            <div>
              <h3 className="wx-h3">Recent conversations</h3>
              <ul className="wx-list" style={{ marginTop: 8 }}>
                {threads.map(t => (
                  <li key={t.id} className="wx-list__row">
                    <span className="wx-body-sm" style={{ flex: 1 }}>
                      {t.label}
                    </span>
                    <Link
                      to={`/inbox/${t.id}`}
                      className="wx-link-btn wx-body-sm"
                      aria-label={`Open conversation with ${t.label}`}
                    >
                      Open →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h3 className="wx-h3">Channel events</h3>
          {channel.activity.length === 0 ? (
            <EmptyState
              title="No activity yet"
              body="Connection events and message flow will appear here once the channel is used."
            />
          ) : (
            <ul className="wx-list">
              {channel.activity.map(a => (
                <li key={a.id} className="wx-list__row" style={{ alignItems: 'flex-start' }}>
                  <Badge
                    tone={
                      a.status === 'error' ? 'danger' : a.status === 'warn' ? 'warning' : 'success'
                    }
                  >
                    {a.kind.replace('-', ' ')}
                  </Badge>
                  <span style={{ flex: 1 }}>
                    <span className="wx-body-sm" style={{ display: 'block' }}>
                      {a.text}
                    </span>
                    <span className="wx-caption">{a.time}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'configuration' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          {channel.fields.length === 0 ? (
            <EmptyState
              title="Nothing to configure"
              body="Connect this channel first — credentials and webhook details appear here."
            />
          ) : (
            <>
              {channel.fields.map(f => (
                <div className="wx-field" key={f.key}>
                  <label className="wx-field__label" htmlFor={`ch-${f.key}`}>
                    {f.label}
                    {f.required ? ' *' : ''}
                  </label>
                  <input
                    id={`ch-${f.key}`}
                    className="wx-input"
                    type={f.type === 'password' ? 'password' : 'text'}
                    value={drafts[f.key] ?? ''}
                    readOnly={f.type === 'readonly'}
                    autoComplete="off"
                    onChange={e =>
                      setFieldDrafts({
                        ...(fieldDrafts ??
                          Object.fromEntries(channel.fields.map(x => [x.key, x.value]))),
                        [f.key]: e.target.value,
                      })
                    }
                    aria-describedby={f.hint ? `ch-${f.key}-hint` : undefined}
                  />
                  {f.hint && (
                    <p id={`ch-${f.key}-hint`} className="wx-caption">
                      {f.hint}
                    </p>
                  )}
                </div>
              ))}
              {fieldsDirty && (
                <span style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" size="md" onClick={() => setFieldDrafts(null)}>
                    Discard
                  </Button>
                  <Button variant="primary" size="md" onClick={saveConfig}>
                    Save configuration
                  </Button>
                </span>
              )}
              <p className="wx-caption">
                Mock only — values are placeholders. Real secrets rotate server-side.
              </p>
            </>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor="ch-name">
              Channel name
            </label>
            <input
              id="ch-name"
              className="wx-input"
              value={channel.name}
              disabled={channel.status === 'not-connected'}
              onChange={e => {
                data.renameChannel(e.target.value)
              }}
            />
          </div>
          <div className="wx-field">
            <label className="wx-field__label" htmlFor="ch-agent">
              Default AI agent
            </label>
            <select
              id="ch-agent"
              className="wx-select"
              value={channel.agentId ?? ''}
              disabled={channel.status === 'not-connected'}
              onChange={e => data.setAgent(e.target.value === '' ? null : e.target.value)}
            >
              <option value="">No agent — human handling only</option>
              {agentsMock.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.status})
                </option>
              ))}
            </select>
            <p className="wx-caption">
              Flow: channel receives a message → Whatsie processes it → the default agent can
              respond. {agent && <Link to={`/ai/${agent.id}`}>Manage {agent.name} →</Link>}
            </p>
          </div>
          {(channel.status === 'connected' ||
            channel.status === 'attention' ||
            channel.status === 'disabled') && (
            <span>
              {channel.enabled ? (
                <Button variant="secondary" size="md" onClick={() => data.setEnabled(false)}>
                  Disable channel
                </Button>
              ) : (
                <Button variant="primary" size="md" onClick={() => data.setEnabled(true)}>
                  Enable channel
                </Button>
              )}
            </span>
          )}
          {data.dirty && (
            <span style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="md" onClick={data.discardSettings}>
                Discard
              </Button>
              <Button variant="primary" size="md" onClick={data.saveSettings} loading={data.saving}>
                Save settings
              </Button>
            </span>
          )}
          {(channel.status === 'connected' ||
            channel.status === 'attention' ||
            channel.status === 'error' ||
            channel.status === 'disabled') && (
            <div>
              <p className="wx-field__label" style={{ marginBottom: 8 }}>
                Danger zone
              </p>
              <Button variant="destructive" size="md" onClick={() => setDisconnectOpen(true)}>
                Disconnect channel
              </Button>
            </div>
          )}
        </div>
      )}

      {disconnectOpen && (
        <ConfirmDialog
          title={`Disconnect ${channel.name || platformName(channel.id)}?`}
          body="The channel will no longer send or receive messages through Whatsie. Queued messages are kept. Assigned agents stay configured for reconnect."
          confirmLabel="Disconnect"
          danger
          onConfirm={() => {
            data.disconnect()
            setDisconnectOpen(false)
            navigate('/channels')
          }}
          onCancel={() => setDisconnectOpen(false)}
        />
      )}
    </section>
  )
}
