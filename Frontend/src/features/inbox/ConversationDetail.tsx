import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Info } from 'lucide-react'
import { Avatar, Badge } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button, IconButton } from '@/design-system/components/buttons'
import { ConfirmDialog, Drawer, Popover } from '@/design-system/components/overlays'
import { Icon } from '@/design-system/components/icons'
import { ME, teamMock } from './mock'
import type { InboxData } from './useInboxData'
import { Composer } from './Composer'
import { LeadContextBody } from './LeadContext'
import { MessageBubble } from './MessageBubble'
import './Inbox.css'

/* Focused workspace: header, AI state, thread, composer, context. */

export function ConversationDetail({ data }: { data: InboxData }): React.JSX.Element {
  const {
    selected,
    threadStatus,
    aiProcessing,
    composerLocked,
    send,
    retryMessage,
    attachMock,
    takeOver,
    returnToAi,
    assign,
    setLifecycle,
    setReplyTo,
    replyTo,
    clearReply,
  } = data
  const [confirmTakeover, setConfirmTakeover] = useState(false)
  const [contextOpen, setContextOpen] = useState(false)
  const threadRef = useRef<HTMLUListElement | null>(null)

  const messages = selected?.messages ?? []
  const sending = messages.some(m => m.delivery === 'sending' || m.delivery === 'retrying')
  useEffect(() => {
    threadRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' })
  }, [messages.length, aiProcessing, selected?.id])

  if (!selected) {
    return (
      <div className="ib-detail ib-detail--empty">
        <EmptyState
          title="No conversation selected"
          body="Choose a conversation to see messages, AI activity, and customer context."
        />
      </div>
    )
  }

  if (threadStatus === 'loading') {
    return (
      <div
        className="ib-detail"
        role="status"
        aria-label="Loading conversation"
        style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 24 }}
      >
        <Skeleton height={48} />
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={120} />
      </div>
    )
  }

  const handleSend = (text: string): void => {
    send(text)
  }

  return (
    <div className="ib-detail">
      {/* Header */}
      <div className="ib-chead">
        <Link to="/inbox" className="ib-back" aria-label="Back to conversation list">
          <Icon icon={ArrowLeft} size="sm" />
        </Link>
        <Avatar name={selected.name} size="sm" />
        <div className="ib-chead-main">
          <p className="wx-label">
            {selected.name}
            <span className="wx-caption" style={{ marginLeft: 8 }}>
              {selected.platform} · {selected.lead.phone}
            </span>
          </p>
          <p className="wx-caption">
            {selected.lifecycle === 'closed'
              ? 'Resolved'
              : selected.lifecycle === 'waiting'
                ? 'Waiting for reply'
                : 'Active'}
            {' · '}
            {selected.assignedTo ? `Assigned to ${selected.assignedTo}` : 'Unassigned'}
            {' · Lead: '}
            {selected.leadStage}
          </p>
        </div>
        <div className="ib-chead-actions">
          <Popover
            label="Assign conversation"
            trigger={
              <button type="button" className="wx-btn wx-btn--secondary wx-btn--sm">
                Assign
              </button>
            }
          >
            <ul
              className="wx-list"
              style={{ minWidth: 220 }}
              role="listbox"
              aria-label="Team members"
            >
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected.assignedTo === null}
                  className="wx-list__row"
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                  }}
                  onClick={() => assign(null)}
                >
                  Unassigned
                </button>
              </li>
              {teamMock.map(m => (
                <li key={m.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected.assignedTo === m.name}
                    className="wx-list__row"
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                    }}
                    onClick={() => assign(m.name)}
                    disabled={m.role === 'viewer'}
                    title={
                      m.role === 'viewer' ? 'Viewers cannot be assigned conversations' : undefined
                    }
                  >
                    <span style={{ flex: 1 }}>
                      {m.name} <span className="wx-caption">· {m.role}</span>
                    </span>
                    {selected.assignedTo === m.name && <span aria-hidden="true">✓</span>}
                  </button>
                </li>
              ))}
            </ul>
          </Popover>
          {selected.lifecycle === 'closed' ? (
            <Button variant="secondary" size="sm" onClick={() => setLifecycle('active')}>
              Reopen
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setLifecycle('closed')}>
              Resolve
            </Button>
          )}
          {selected.aiHandling ? (
            <Button variant="primary" size="sm" onClick={() => setConfirmTakeover(true)}>
              Take over
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={returnToAi}>
              Return to AI
            </Button>
          )}
          <IconButton
            label="Toggle customer context"
            onClick={() => setContextOpen(v => !v)}
            bordered
          >
            <Icon icon={Info} size="sm" />
          </IconButton>
        </div>
      </div>

      {/* AI / human state bar */}
      <div className="ib-aibar" role="status">
        {selected.aiHandling ? (
          <span>
            <Badge tone="ai">AI handling</Badge>{' '}
            <span className="wx-body-sm">Replies send as AI unless you take over.</span>
          </span>
        ) : (
          <span>
            <Badge tone="accent">Human handling · {ME}</Badge>{' '}
            <span className="wx-body-sm">AI is paused on this conversation.</span>
          </span>
        )}
      </div>

      {/* Thread */}
      <ul
        ref={threadRef}
        className="ib-thread"
        aria-live="polite"
        aria-label={`Messages with ${selected.name}`}
      >
        {selected.messages.map(m => (
          <MessageBubble
            key={m.id}
            message={m}
            onRetry={m.delivery === 'failed' ? () => retryMessage(m.id) : undefined}
            onReply={
              m.direction === 'inbound'
                ? () => setReplyTo({ id: m.id, preview: m.text.slice(0, 60) })
                : undefined
            }
          />
        ))}
        {aiProcessing && (
          <li className="ib-row ib-row--in">
            <div
              className="ib-bubble ib-bubble--in"
              role="status"
              aria-label="AI is writing a reply"
            >
              <span className="ib-typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="wx-caption">AI writing…</span>
            </div>
          </li>
        )}
      </ul>

      {/* Composer */}
      <Composer
        handlingLabel={
          selected.aiHandling
            ? 'AI handling — your message sends as you (human).'
            : 'Human handling — AI is paused.'
        }
        locked={composerLocked.locked}
        lockReason={composerLocked.reason}
        sending={sending}
        onSend={handleSend}
        onAttach={attachMock}
        replyPreview={replyTo}
        onClearReply={clearReply}
      />

      {/* Context: side panel on wide screens, drawer below that */}
      <aside className="ib-context" aria-label="Customer context">
        <h2 className="wx-h4">Customer context</h2>
        <LeadContextBody data={data} />
      </aside>
      {contextOpen && (
        <Drawer title="Customer context" onClose={() => setContextOpen(false)}>
          <LeadContextBody data={data} />
        </Drawer>
      )}
      {confirmTakeover && (
        <ConfirmDialog
          title="Take over from AI?"
          body="AI will stop replying on this conversation. Your messages send as you. You can return it to AI at any time."
          confirmLabel="Take over"
          onConfirm={() => {
            takeOver()
            setConfirmTakeover(false)
          }}
          onCancel={() => setConfirmTakeover(false)}
        />
      )}
    </div>
  )
}

export function ThreadErrorDemo({ onRetry }: { onRetry: () => void }): React.JSX.Element {
  return (
    <div className="ib-detail" style={{ padding: 24 }}>
      <ErrorState
        title="Message history failed to load"
        body="The list and customer context still work. Retry the thread."
        onRetry={onRetry}
        requestId="inbox-thread"
      />
    </div>
  )
}
