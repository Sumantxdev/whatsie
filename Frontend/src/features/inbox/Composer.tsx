import { useState } from 'react'
import { Paperclip, Send } from 'lucide-react'
import { Icon } from '@/design-system/components/icons'
import { IconButton } from '@/design-system/components/buttons'

/* Composer: obvious handling mode, reply context, send/attach/disabled states. */

export function Composer({
  handlingLabel,
  locked,
  lockReason,
  sending,
  onSend,
  onAttach,
  replyPreview,
  onClearReply,
}: {
  handlingLabel: string
  locked: boolean
  lockReason?: string
  sending: boolean
  onSend: (text: string) => void
  onAttach: () => void
  replyPreview: { id: string; preview: string } | null
  onClearReply: () => void
}): React.JSX.Element {
  const [text, setText] = useState('')

  const submit = (): void => {
    const clean = text.trim()
    if (!clean || locked || sending) return
    onSend(clean)
    setText('')
  }

  return (
    <div className="ib-composer">
      <p className="wx-caption" role="status">
        {locked ? lockReason : handlingLabel}
      </p>
      {replyPreview && (
        <div className="ib-replybar">
          <span
            className="wx-body-sm"
            style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            Replying to: {replyPreview.preview}
          </span>
          <button
            type="button"
            className="wx-link-btn wx-body-sm"
            onClick={onClearReply}
            aria-label="Clear reply"
          >
            Clear
          </button>
        </div>
      )}
      <div className="ib-composer-row">
        <IconButton label="Attach a file" onClick={onAttach} bordered disabled={locked}>
          <Icon icon={Paperclip} size="sm" />
        </IconButton>
        <label
          htmlFor="ib-composer-input"
          className="wx-caption"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          Message
        </label>
        <textarea
          id="ib-composer-input"
          className="wx-textarea ib-composer-input"
          placeholder={
            locked
              ? 'Reopen the conversation to reply'
              : 'Write a reply… (Enter to send, Shift+Enter for newline)'
          }
          value={text}
          disabled={locked}
          rows={2}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button
          type="button"
          className="wx-btn wx-btn--primary wx-btn--md"
          disabled={locked || sending || text.trim() === ''}
          aria-busy={sending || undefined}
          onClick={submit}
          aria-label="Send message"
        >
          {sending ? (
            <span className="wx-spinner" aria-hidden="true" />
          ) : (
            <Icon icon={Send} size="sm" />
          )}
          Send
        </button>
      </div>
    </div>
  )
}
