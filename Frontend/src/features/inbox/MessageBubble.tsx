import { Badge } from '@/design-system/components/data'
import { Button } from '@/design-system/components/buttons'
import type { DeliveryState, InboxMessage } from './types'
import './Inbox.css'

/* Message variants share one visual language. Lifecycle vs delivery stay separate. */

function deliveryLabel(d: DeliveryState): string {
  switch (d) {
    case 'queued':
      return 'Queued — will send'
    case 'processing':
      return 'AI processing'
    case 'sending':
      return 'Sending'
    case 'sent':
      return 'Sent'
    case 'delivered':
      return 'Delivered'
    case 'read':
      return 'Read'
    case 'failed':
      return 'Failed'
    case 'retrying':
      return 'Retrying'
    case 'expired':
      return 'Expired — needs template'
  }
}

function ticks(d: DeliveryState): string | null {
  if (d === 'sent') return '✓'
  if (d === 'delivered') return '✓✓'
  if (d === 'read') return '✓✓'
  return null
}

export function MessageBubble({
  message,
  onRetry,
  onReply,
}: {
  message: InboxMessage
  onRetry?: () => void
  onReply?: () => void
}): React.JSX.Element {
  if (message.sender === 'system') {
    return (
      <li className="ib-sys" role="note" aria-label={`System event: ${message.text}`}>
        <span>{message.text}</span>
        <span className="wx-caption"> · {message.time}</span>
      </li>
    )
  }

  const incoming = message.direction === 'inbound'
  const kind =
    message.sender === 'ai'
      ? 'AI message'
      : message.sender === 'agent'
        ? `Agent message from ${message.agentName ?? 'agent'}`
        : 'Customer message'
  const tick = ticks(message.delivery)
  const failed = message.delivery === 'failed'
  const expired = message.delivery === 'expired'

  return (
    <li className={incoming ? 'ib-row ib-row--in' : 'ib-row ib-row--out'}>
      <article
        aria-label={`${kind}, ${deliveryLabel(message.delivery)}: ${message.text}`}
        className={incoming ? 'ib-bubble ib-bubble--in' : 'ib-bubble ib-bubble--out'}
        style={failed ? { borderColor: 'var(--danger-border)' } : undefined}
      >
        {message.aiTag && (
          <p className="wx-caption" style={{ marginBottom: 4 }}>
            <Badge tone={message.aiTag.startsWith('Canned') ? 'warning' : 'ai'}>
              {message.aiTag}
            </Badge>
          </p>
        )}
        {message.sender === 'agent' && message.agentName && (
          <p className="wx-caption" style={{ marginBottom: 2 }}>
            {message.agentName}
          </p>
        )}
        {message.replyTo && (
          <blockquote className="ib-quote">
            <span className="wx-caption">{message.replyTo.preview}</span>
          </blockquote>
        )}
        {message.mention && (
          <p className="wx-body-sm" style={{ marginBottom: 4 }}>
            <span className="wx-badge wx-badge--info">@{message.mention}</span>
          </p>
        )}
        {message.attachment && (
          <div
            className="ib-attach"
            role="img"
            aria-label={`Attachment ${message.attachment.name}, ${message.attachment.state ?? 'uploaded'}`}
          >
            {message.attachment.kind === 'image' ? (
              <div className="ib-attach-thumb" aria-hidden="true">
                <span className="wx-caption">IMG</span>
              </div>
            ) : (
              <div className="ib-attach-file" aria-hidden="true">
                <span className="wx-caption">FILE</span>
              </div>
            )}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                className="wx-body-sm"
                style={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {message.attachment.name}
              </span>
              <span className="wx-caption">
                {message.attachment.size}
                {message.attachment.state === 'uploading' &&
                  ` · uploading ${message.attachment.progress ?? 0}%`}
                {message.attachment.state === 'failed' && ' · upload failed'}
              </span>
            </span>
          </div>
        )}
        <p className="wx-body" style={{ overflowWrap: 'anywhere' }}>
          {message.text}
        </p>
        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="ib-quick" role="group" aria-label="Quick replies">
            {message.quickReplies.map(q => (
              <span key={q} className="ib-quick-chip">
                {q}
              </span>
            ))}
          </div>
        )}
        <p className="wx-caption ib-meta">
          <span>{message.time}</span>
          {!incoming && tick && (
            <span
              aria-hidden="true"
              style={message.delivery === 'read' ? { color: 'var(--accent-primary)' } : undefined}
            >
              {tick}
            </span>
          )}
          <span className="ib-delivery">{deliveryLabel(message.delivery)}</span>
        </p>
        {(failed || expired) && message.failureReason && (
          <p
            className="wx-body-sm"
            role="alert"
            style={{ color: 'var(--danger-text)', marginTop: 4 }}
          >
            {message.failureReason}
          </p>
        )}
        {failed && onRetry && (
          <p style={{ marginTop: 8 }}>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry send
            </Button>
          </p>
        )}
        {incoming && onReply && (
          <p style={{ marginTop: 4 }}>
            <button type="button" className="wx-link-btn wx-body-sm" onClick={onReply}>
              Reply
            </button>
          </p>
        )}
      </article>
    </li>
  )
}
