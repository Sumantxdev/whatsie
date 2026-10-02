import { NavLink } from 'react-router'
import { Avatar, Badge } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import type { InboxData } from './useInboxData'

/* List pane: search, compact filters, rows. Rows stay scannable, not overloaded. */

export function ConversationList({ data }: { data: InboxData }): React.JSX.Element {
  const {
    listStatus,
    searching,
    filters,
    setFilters,
    resetFilters,
    conversations,
    totalCount,
    reload,
  } = data
  const filteredActive =
    filters.query !== '' ||
    filters.channel !== 'all' ||
    filters.lifecycle !== 'all' ||
    filters.assign !== 'all' ||
    filters.handling !== 'all'

  return (
    <div className="ib-listpane">
      <div className="ib-search">
        <label
          htmlFor="ib-search"
          className="wx-caption"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          Search conversations
        </label>
        <input
          id="ib-search"
          type="search"
          className="wx-input"
          placeholder="Search name, preview, or tag…"
          value={filters.query}
          onChange={e => setFilters({ query: e.target.value })}
          aria-label="Search conversations"
        />
        {filters.query !== '' && (
          <button
            type="button"
            className="wx-link-btn wx-body-sm"
            onClick={() => setFilters({ query: '' })}
          >
            Clear
          </button>
        )}
      </div>

      <div className="ib-filters" role="group" aria-label="Conversation filters">
        <label className="wx-caption">
          Channel
          <select
            className="wx-select ib-filter-select"
            value={filters.channel}
            onChange={e =>
              setFilters({ channel: e.target.value as InboxData['filters']['channel'] })
            }
            aria-label="Filter by channel"
          >
            <option value="all">All channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="discord">Discord</option>
            <option value="messenger">Messenger</option>
            <option value="instagram">Instagram</option>
            <option value="teams">Teams</option>
            <option value="twitch">Twitch</option>
            <option value="twitter">Twitter</option>
          </select>
        </label>
        <label className="wx-caption">
          Status
          <select
            className="wx-select ib-filter-select"
            value={filters.lifecycle}
            onChange={e =>
              setFilters({ lifecycle: e.target.value as InboxData['filters']['lifecycle'] })
            }
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="waiting">Waiting</option>
            <option value="closed">Resolved</option>
          </select>
        </label>
        <label className="wx-caption">
          Assignee
          <select
            className="wx-select ib-filter-select"
            value={filters.assign}
            onChange={e => setFilters({ assign: e.target.value as InboxData['filters']['assign'] })}
            aria-label="Filter by assignee"
          >
            <option value="all">Anyone</option>
            <option value="mine">Mine</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </label>
        <label className="wx-caption">
          Handling
          <select
            className="wx-select ib-filter-select"
            value={filters.handling}
            onChange={e =>
              setFilters({ handling: e.target.value as InboxData['filters']['handling'] })
            }
            aria-label="Filter by handling"
          >
            <option value="all">AI + human</option>
            <option value="ai">AI-handled</option>
            <option value="human">Human</option>
          </select>
        </label>
        {filteredActive && (
          <button type="button" className="wx-link-btn wx-body-sm" onClick={resetFilters}>
            Reset filters
          </button>
        )}
      </div>

      <p className="wx-caption" role="status" aria-live="polite">
        {listStatus === 'ready' ? `${conversations.length} of ${totalCount} conversations` : '…'}
      </p>

      {listStatus === 'loading' || searching ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          role="status"
          aria-label="Loading conversations"
        >
          {[0, 1, 2, 3, 4].map(i => (
            <Skeleton key={i} height={64} />
          ))}
        </div>
      ) : listStatus === 'error' ? (
        <ErrorState
          title="Conversations failed to load"
          body="Your filters are preserved. Retry to reload the list."
          onRetry={reload}
          requestId="inbox-list"
        />
      ) : conversations.length === 0 && filters.query !== '' ? (
        <EmptyState
          title="No results"
          body={`Nothing matches “${filters.query}”. Try a name, phone, or tag.`}
          action={
            <Button variant="secondary" size="md" onClick={() => setFilters({ query: '' })}>
              Clear search
            </Button>
          }
        />
      ) : conversations.length === 0 && filteredActive ? (
        <EmptyState
          title="No conversations match these filters"
          body="Loosen a filter or reset to see everything."
          action={
            <Button variant="secondary" size="md" onClick={resetFilters}>
              Reset filters
            </Button>
          }
        />
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          body="Connect a channel — the first customer message creates a conversation and lead automatically."
          action={
            <Button variant="secondary" size="md" onClick={reload}>
              Refresh
            </Button>
          }
        />
      ) : (
        <ul
          className="ib-rows"
          role="listbox"
          aria-label="Conversations"
          aria-activedescendant={undefined}
        >
          {conversations.map(c => (
            <li key={c.id}>
              <NavLink
                to={`/inbox/${c.id}`}
                className={({ isActive }) =>
                  isActive ? 'ib-rowlink ib-rowlink--active' : 'ib-rowlink'
                }
                aria-label={`${c.name}, ${c.platform}, ${c.unread > 0 ? `${c.unread} unread, ` : ''}${c.lifecycle}`}
              >
                <Avatar name={c.name} size="sm" />
                <span className="ib-rowmain">
                  <span className="ib-rowtop">
                    <strong
                      className={c.unread > 0 ? 'ib-rowname ib-rowname--unread' : 'ib-rowname'}
                    >
                      {c.name}
                    </strong>
                    <span className="wx-caption">{c.time}</span>
                  </span>
                  <span className="wx-body-sm ib-rowpreview">{c.preview}</span>
                  <span className="ib-rowtags">
                    <Badge tone="neutral">{c.platform}</Badge>
                    {c.lifecycle === 'closed' ? (
                      <Badge tone="success">Resolved</Badge>
                    ) : c.lifecycle === 'waiting' ? (
                      <Badge tone="warning">Waiting</Badge>
                    ) : null}
                    {c.aiHandling ? (
                      <Badge tone="ai">AI</Badge>
                    ) : (
                      <Badge tone="accent">Human</Badge>
                    )}
                    {c.assignedTo === null && <Badge tone="warning">Unassigned</Badge>}
                    {c.unread > 0 && <Badge tone="accent">{c.unread} new</Badge>}
                  </span>
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
