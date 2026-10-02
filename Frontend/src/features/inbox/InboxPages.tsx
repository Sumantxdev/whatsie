import { Link, useParams, useSearchParams } from 'react-router'
import { EmptyState } from '@/design-system/components/feedback'
import { ConversationDetail, ThreadErrorDemo } from './ConversationDetail'
import { ConversationList } from './ConversationList'
import { useInboxData } from './useInboxData'
import './Inbox.css'

/* List route. Desktop shows list + empty workspace; mobile shows list only. */

export function InboxPage(): React.JSX.Element {
  const data = useInboxData(undefined)
  return (
    <section
      aria-labelledby="inbox-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 id="inbox-title" className="wx-h1">
          Inbox
        </h1>
        <p className="wx-caption" role="status">
          {data.listStatus === 'ready' ? `${data.conversations.length} conversations` : 'Loading…'}
        </p>
      </div>
      <div className="ib-wrap" data-pane="list">
        <div className="ib-listcol" style={{ display: 'contents' }}>
          <ConversationList data={data} />
        </div>
        <div className="ib-detailcol" style={{ display: 'contents' }}>
          <ConversationDetail data={data} />
        </div>
      </div>
    </section>
  )
}

/* Detail route. Desktop shows list + thread; mobile shows thread with back. */

export function ConversationPage(): React.JSX.Element {
  const { conversationId } = useParams()
  const data = useInboxData(conversationId)
  const [searchParams] = useSearchParams()
  const threadFailed = searchParams.get('demo') === 'thread-error'

  if (data.listStatus === 'ready' && conversationId && !data.selected) {
    return (
      <section
        aria-labelledby="inbox-title"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <h1 id="inbox-title" className="wx-h1">
          Inbox
        </h1>
        <div className="ib-wrap" data-pane="detail">
          <div className="ib-listcol" style={{ display: 'contents' }}>
            <ConversationList data={data} />
          </div>
          <div className="ib-detailcol" style={{ display: 'contents' }}>
            <div className="ib-detail ib-detail--empty">
              <EmptyState
                title="Conversation not found"
                body="It may have been deleted or belong to another workspace."
                action={
                  <Link to="/inbox" className="wx-btn wx-btn--secondary wx-btn--md">
                    Back to Inbox
                  </Link>
                }
              />
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="inbox-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 id="inbox-title" className="wx-h1">
          Inbox
        </h1>
        <p className="wx-caption" role="status">
          {data.selected ? `${data.selected.name} · ${data.selected.platform}` : 'Loading…'}
        </p>
      </div>
      <div className="ib-wrap" data-pane="detail">
        <div className="ib-listcol" style={{ display: 'contents' }}>
          <ConversationList data={data} />
        </div>
        <div className="ib-detailcol" style={{ display: 'contents' }}>
          {threadFailed ? (
            <ThreadErrorDemo onRetry={data.reload} />
          ) : (
            <ConversationDetail data={data} />
          )}
        </div>
      </div>
    </section>
  )
}
