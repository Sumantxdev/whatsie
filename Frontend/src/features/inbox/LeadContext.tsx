import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Avatar, Badge, KeyValue } from '@/design-system/components/data'
import { ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import type { InboxData } from './useInboxData'

/* Customer context without destroying the thread. Panel on desktop, drawer on small. */

export function LeadContextBody({ data }: { data: InboxData }): React.JSX.Element {
  const { selected, contactStatus, assign, addTag, reload } = data
  const [tagDraft, setTagDraft] = useState('')
  const tagId = useId()
  if (!selected) return <p className="wx-body-sm">Select a conversation.</p>
  if (contactStatus === 'loading') {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        role="status"
        aria-label="Loading contact"
      >
        <Skeleton height={40} />
        <Skeleton height={16} />
        <Skeleton height={80} />
      </div>
    )
  }
  if (contactStatus === 'error') {
    return (
      <ErrorState
        title="Contact failed to load"
        body="The conversation still works. Retry contact info."
        onRetry={reload}
        requestId="inbox-contact"
      />
    )
  }
  const lead = selected.lead
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar name={lead.name} />
        <div>
          <p className="wx-label">{lead.name}</p>
          <p className="wx-caption">
            {lead.phone}
            {lead.email ? ` · ${lead.email}` : ''}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge
          tone={
            lead.stage === 'converted'
              ? 'success'
              : lead.stage === 'lost'
                ? 'danger'
                : lead.stage === 'qualified'
                  ? 'warning'
                  : 'info'
          }
        >
          {lead.stage}
        </Badge>
        <Badge tone="neutral">{selected.platform}</Badge>
        {selected.tags.map(t => (
          <Badge key={t} tone="neutral">
            #{t}
          </Badge>
        ))}
      </div>
      <KeyValue
        items={[
          { key: 'Assigned', value: lead.assignedTo ?? 'Unassigned' },
          { key: 'Conversations', value: `${lead.relatedCount} total` },
          { key: 'Handling', value: selected.aiHandling ? 'AI handling' : 'Human handling' },
        ]}
      />
      <form
        onSubmit={e => {
          e.preventDefault()
          addTag(tagDraft)
          setTagDraft('')
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <label
          htmlFor={tagId}
          className="wx-caption"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          Add tag
        </label>
        <input
          id={tagId}
          className="wx-input"
          placeholder="Add tag…"
          value={tagDraft}
          onChange={e => setTagDraft(e.target.value)}
          style={{ minHeight: 36 }}
        />
        <Button variant="secondary" size="md" type="submit" disabled={tagDraft.trim() === ''}>
          Add
        </Button>
      </form>
      <div>
        <p className="wx-h4" style={{ marginBottom: 8 }}>
          Recent activity
        </p>
        <ul
          className="wx-body-sm"
          style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {lead.recentActivity.map(a => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant="secondary"
          size="md"
          onClick={() => assign(lead.assignedTo === 'Ava Stone' ? null : 'Ava Stone')}
        >
          {lead.assignedTo === 'Ava Stone' ? 'Unassign me' : 'Assign to me'}
        </Button>
        <Link to={`/contacts/${lead.id}`} className="wx-btn wx-btn--ghost wx-btn--md">
          Open lead →
        </Link>
      </div>
    </div>
  )
}
