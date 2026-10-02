import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Metric } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { ConnectChannelModal } from './ConnectChannelModal'
import { ConnectionBadge, HealthBadge } from './channelUi'
import { PLATFORMS, platformName } from './platforms'
import type { ConnectionState, PlatformId } from './types'
import { useChannelsData } from './useChannelsData'
import './Channels.css'

/* Channels overview: stats → search/filter → platform grid. */

export function ChannelsPage(): React.JSX.Element {
  const data = useChannelsData()
  const navigate = useNavigate()
  const [connectOpen, setConnectOpen] = useState(false)
  const {
    listStatus,
    searching,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    resetFilters,
    channels,
    statusById,
    totalCount,
    stats,
    startConnect,
    connecting,
    connectError,
    cancelConnect,
    retryConnect,
    reload,
  } = data
  const filtersActive = query !== '' || statusFilter !== 'all'

  return (
    <section
      aria-labelledby="ch-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title="Channels"
        description="Connect Whatsie to external messaging platforms. Each channel receives and sends through its own adapter and webhook."
        primaryAction={
          <Button variant="primary" size="md" onClick={() => setConnectOpen(true)}>
            Connect Channel
          </Button>
        }
      />

      {listStatus === 'loading' || searching ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          role="status"
          aria-label="Loading channels"
        >
          <Skeleton height={90} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      ) : listStatus === 'error' ? (
        <ErrorState
          title="Channels failed to load"
          body="Filters are preserved. Retry to reload."
          onRetry={reload}
          requestId="ch-list"
        />
      ) : (
        <>
          <div className="ch-stats" role="group" aria-label="Channel summary">
            <div className="ch-stat">
              <Metric label="Platforms" value={String(stats.total)} />
            </div>
            <div className="ch-stat">
              <Metric label="Connected" value={String(stats.connected)} />
            </div>
            <div className="ch-stat">
              <Metric
                label="Needs attention"
                value={String(stats.attention)}
                hint="Attention or error"
              />
            </div>
            <div className="ch-stat">
              <Metric label="Conversations · 24h" value={String(stats.active24h)} />
            </div>
          </div>

          <div className="ch-toolbar" role="search">
            <input
              type="search"
              className="wx-input ch-search"
              placeholder="Search platform or channel name…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search channels"
            />
            <label className="wx-caption">
              Status
              <select
                className="wx-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as ConnectionState | 'all')}
                aria-label="Filter by connection status"
              >
                <option value="all">All statuses</option>
                <option value="connected">Connected</option>
                <option value="attention">Needs attention</option>
                <option value="error">Error</option>
                <option value="disabled">Disabled</option>
                <option value="not-connected">Not connected</option>
              </select>
            </label>
            {filtersActive && (
              <button type="button" className="wx-link-btn wx-body-sm" onClick={resetFilters}>
                Clear all
              </button>
            )}
          </div>

          <p className="wx-caption" role="status" aria-live="polite">
            {`${channels.length} of ${totalCount} platforms`}
            {searching && ' · searching…'}
          </p>

          {channels.length === 0 && query === '' && !filtersActive ? (
            <EmptyState
              title="No channels connected"
              body="Connect WhatsApp, Telegram, or any supported platform so customers can reach you — and agents can reply — from one inbox."
              action={
                <Button variant="primary" size="md" onClick={() => setConnectOpen(true)}>
                  Connect Channel
                </Button>
              }
            />
          ) : channels.length === 0 ? (
            <EmptyState
              title={query !== '' ? `No results for “${query}”` : 'Nothing matches this filter'}
              body="Try another term, or clear the filter."
              action={
                <Button variant="secondary" size="md" onClick={resetFilters}>
                  Clear search & filters
                </Button>
              }
            />
          ) : (
            <div className="ch-grid">
              {channels.map(c => (
                <article
                  key={c.id}
                  className="ch-card"
                  aria-label={`${platformName(c.id)}, ${c.statusDetail}`}
                >
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong className="wx-h3">{platformName(c.id)}</strong>
                    <ConnectionBadge status={c.status} />
                    {c.status !== 'not-connected' && <HealthBadge health={c.health} />}
                  </span>
                  {c.status === 'not-connected' ? (
                    <span className="wx-body-sm">{PLATFORMS_DESC[c.id]}</span>
                  ) : (
                    <span className="wx-body-sm">
                      {c.name} · {c.account}
                    </span>
                  )}
                  <span className="wx-caption">
                    {c.statusDetail}
                    {c.status !== 'not-connected' ? ` · active ${c.lastActivity}` : ''}
                  </span>
                  <span style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {c.status === 'not-connected' ? (
                      <Button variant="secondary" size="sm" onClick={() => setConnectOpen(true)}>
                        Connect
                      </Button>
                    ) : (
                      <Link
                        to={`/channels/${c.id}`}
                        className="wx-btn wx-btn--secondary wx-btn--sm"
                      >
                        {c.status === 'error'
                          ? 'View issue'
                          : c.status === 'attention'
                            ? 'Review connection'
                            : c.status === 'disabled'
                              ? 'Manage'
                              : 'Manage'}
                      </Link>
                    )}
                  </span>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {connectOpen && (
        <ConnectChannelModal
          statuses={statusById}
          connecting={connecting}
          connectError={connectError}
          onConnect={startConnect}
          onCancelConnect={cancelConnect}
          onRetryConnect={retryConnect}
          onDone={(platform: PlatformId) => {
            setConnectOpen(false)
            navigate(`/channels/${platform}`)
          }}
          onClose={() => {
            cancelConnect()
            setConnectOpen(false)
          }}
        />
      )}
    </section>
  )
}

const PLATFORMS_DESC: Record<PlatformId, string> = Object.fromEntries(
  PLATFORMS.map(p => [p.id, p.description])
) as Record<PlatformId, string>
