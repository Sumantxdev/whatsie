import { useId, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/shell/PageHeader'
import { Avatar, Badge } from '@/design-system/components/data'
import { EmptyState, ErrorState, Skeleton } from '@/design-system/components/feedback'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog, Modal, Popover } from '@/design-system/components/overlays'
import { CRM_ME, crmTeam } from './mock'
import { PipelineBoard } from './PipelineBoard'
import { StageBadge } from './stageUi'
import type { Stage } from './types'
import { useCrmData } from './useCrmData'
import './Crm.css'

/* Contacts list: table + pipeline + segments. Bulk, import/export, add. */

const SEGMENTS = [
  { id: 'needs-assignment', label: 'Needs assignment', hint: 'Unassigned leads' },
  { id: 'enterprise', label: 'Enterprise', hint: 'Tag: enterprise' },
  { id: 'pricing-interest', label: 'Pricing interest', hint: 'Tag: pricing' },
]

function applySegment(
  id: string,
  setFilters: ReturnType<typeof useCrmData>['setFilters'],
  reset: () => void
): void {
  reset()
  if (id === 'needs-assignment') setFilters({ assignee: 'unassigned' })
  if (id === 'enterprise') setFilters({ tag: 'enterprise' })
  if (id === 'pricing-interest') setFilters({ tag: 'pricing' })
}

function AddContactModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, phone: string, email: string) => string
}): React.JSX.Element {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const nameId = useId()
  return (
    <Modal
      title="Add contact"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (name.trim() === '' || phone.trim() === '') {
                setError('Name and phone are required.')
                return
              }
              onCreate(name.trim(), phone.trim(), email.trim())
              onClose()
            }}
          >
            Add contact
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="wx-field">
          <label className="wx-field__label" htmlFor={`${nameId}-name`}>
            Name *
          </label>
          <input
            id={`${nameId}-name`}
            className="wx-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="wx-field">
          <label className="wx-field__label" htmlFor={`${nameId}-phone`}>
            Phone *
          </label>
          <input
            id={`${nameId}-phone`}
            className="wx-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 555 000 1234"
          />
        </div>
        <div className="wx-field">
          <label className="wx-field__label" htmlFor={`${nameId}-email`}>
            Email
          </label>
          <input
            id={`${nameId}-email`}
            className="wx-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        {error && (
          <p role="alert" className="wx-field__error">
            {error}
          </p>
        )}
        <p className="wx-caption">
          Creates a lead in stage “new”. First message or import would do the same automatically.
        </p>
      </div>
    </Modal>
  )
}

function ImportModal({
  onClose,
  data,
}: {
  onClose: () => void
  data: ReturnType<typeof useCrmData>
}): React.JSX.Element {
  const { importState, startImport, resetImport } = data
  return (
    <Modal
      title="Import contacts"
      onClose={() => {
        resetImport()
        onClose()
      }}
      footer={
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            resetImport()
            onClose()
          }}
        >
          Done
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="wx-body-sm">
          Upload a CSV. Tip: include “fail” in the file name to preview failure, “partial” for
          partial failure.
        </p>
        <label className="wx-btn wx-btn--secondary wx-btn--md" style={{ cursor: 'pointer' }}>
          Choose CSV file
          <input
            type="file"
            accept=".csv"
            hidden
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) startImport(f.name)
            }}
          />
        </label>
        {importState.phase === 'uploading' && (
          <p className="wx-body-sm" role="status">
            Uploading… {importState.progress}%
          </p>
        )}
        {importState.phase === 'processing' && (
          <p className="wx-body-sm" role="status">
            Processing rows…
          </p>
        )}
        {importState.phase === 'success' && (
          <p className="wx-body-sm" role="status">
            Imported {importState.added} contacts.
          </p>
        )}
        {importState.phase === 'partial' && (
          <div role="alert">
            <p className="wx-body-sm">Imported {importState.added} of 2 rows.</p>
            {importState.failedRows.map(r => (
              <p key={r} className="wx-field__error">
                {r}
              </p>
            ))}
          </div>
        )}
        {importState.phase === 'failure' && (
          <div role="alert">
            <p className="wx-field__error">Import failed: unreadable file. Nothing was added.</p>
            <Button variant="secondary" size="sm" onClick={() => startImport('retry.csv')}>
              Retry
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export function ContactsPage(): React.JSX.Element {
  const data = useCrmData()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const view = params.get('view') ?? 'all'
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [bulkTagDraft, setBulkTagDraft] = useState('')
  const {
    listStatus,
    searching,
    filters,
    setFilters,
    resetFilters,
    sort,
    setSort,
    records,
    totalCount,
    allTags,
    selection,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    bulkAssign,
    bulkStage,
    stageOne,
    bulkTag,
    bulkDelete,
    bulkExport,
    addRecord,
    reload,
  } = data
  const filteredActive =
    filters.query !== '' ||
    filters.stage !== 'all' ||
    filters.assignee !== 'all' ||
    filters.tag !== 'all' ||
    filters.channel !== 'all'
  const allSelected = records.length > 0 && selection.length === records.length

  const doExport = (): void => {
    const url = bulkExport()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts-export.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <section
      aria-labelledby="contacts-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <PageHeader
        title="Contacts"
        description="People and their lead lifecycle — one record, two facets. Message threads stay in Inbox."
        primaryAction={
          <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
            Add contact
          </Button>
        }
        secondaryActions={
          <>
            <Button variant="secondary" size="md" onClick={() => setImportOpen(true)}>
              Import
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={doExport}
              disabled={selection.length === 0}
              title={selection.length === 0 ? 'Select contacts to export' : undefined}
            >
              Export{selection.length > 0 ? ` (${selection.length})` : ''}
            </Button>
          </>
        }
      />

      {view === 'segments' ? (
        <div
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
          role="group"
          aria-label="Saved segments"
        >
          {SEGMENTS.map(s => (
            <button
              key={s.id}
              type="button"
              className="wx-btn wx-btn--secondary wx-btn--sm"
              onClick={() => applySegment(s.id, setFilters, resetFilters)}
              title={s.hint}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="crm-toolbar" role="search">
        <input
          type="search"
          className="wx-input crm-search"
          placeholder="Search name, phone, email, tag…"
          value={filters.query}
          onChange={e => setFilters({ query: e.target.value })}
          aria-label="Search contacts"
        />
        <label className="wx-caption">
          Stage
          <select
            className="wx-select"
            value={filters.stage}
            onChange={e => setFilters({ stage: e.target.value as Stage | 'all' })}
            aria-label="Filter by stage"
          >
            <option value="all">All stages</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </label>
        <label className="wx-caption">
          Assignee
          <select
            className="wx-select"
            value={filters.assignee}
            onChange={e => setFilters({ assignee: e.target.value })}
            aria-label="Filter by assignee"
          >
            <option value="all">Anyone</option>
            <option value="mine">Mine</option>
            <option value="unassigned">Unassigned</option>
            {crmTeam
              .filter(t => t !== CRM_ME)
              .map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        </label>
        <label className="wx-caption">
          Tag
          <select
            className="wx-select"
            value={filters.tag}
            onChange={e => setFilters({ tag: e.target.value })}
            aria-label="Filter by tag"
          >
            <option value="all">All tags</option>
            {allTags.map(t => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </label>
        <label className="wx-caption">
          Channel
          <select
            className="wx-select"
            value={filters.channel}
            onChange={e => setFilters({ channel: e.target.value as 'all' | 'whatsapp' })}
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
          Sort
          <select
            className="wx-select"
            value={sort}
            onChange={e => setSort(e.target.value as 'recent')}
            aria-label="Sort contacts"
          >
            <option value="recent">Recent activity</option>
            <option value="name">Name A–Z</option>
            <option value="newest">Newest</option>
            <option value="stage">Stage</option>
          </select>
        </label>
        {filteredActive && (
          <button type="button" className="wx-link-btn wx-body-sm" onClick={resetFilters}>
            Clear all
          </button>
        )}
      </div>

      {selection.length > 0 && (
        <div
          className="crm-bulkbar"
          role="toolbar"
          aria-label={`Bulk actions for ${selection.length} selected`}
        >
          <strong className="wx-body-sm">{selection.length} selected</strong>
          <Popover
            label="Bulk assign"
            trigger={
              <button type="button" className="wx-btn wx-btn--secondary wx-btn--sm">
                Assign
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
              <button
                type="button"
                className="wx-list__row wx-body-sm"
                onClick={() => bulkAssign(null)}
              >
                Unassigned
              </button>
              {crmTeam.map(t => (
                <button
                  key={t}
                  type="button"
                  className="wx-list__row wx-body-sm"
                  onClick={() => bulkAssign(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </Popover>
          <label className="wx-caption">
            Stage
            <select
              className="wx-select"
              defaultValue=""
              onChange={e => {
                if (e.target.value !== '') bulkStage(e.target.value as Stage)
              }}
              aria-label="Bulk change stage"
              style={{ minHeight: 32 }}
            >
              <option value="">Set stage…</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </label>
          <form
            onSubmit={e => {
              e.preventDefault()
              bulkTag(bulkTagDraft)
              setBulkTagDraft('')
            }}
            style={{ display: 'flex', gap: 4 }}
          >
            <input
              className="wx-input"
              style={{ minHeight: 32, width: 120 }}
              placeholder="Add tag…"
              value={bulkTagDraft}
              onChange={e => setBulkTagDraft(e.target.value)}
              aria-label="Bulk add tag"
            />
            <button type="submit" className="wx-btn wx-btn--secondary wx-btn--sm">
              Tag
            </button>
          </form>
          <button type="button" className="wx-btn wx-btn--secondary wx-btn--sm" onClick={doExport}>
            Export
          </button>
          <button
            type="button"
            className="wx-btn wx-btn--destructive wx-btn--sm"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </button>
          <button type="button" className="wx-link-btn wx-body-sm" onClick={clearSelection}>
            Clear
          </button>
        </div>
      )}

      <p className="wx-caption" role="status" aria-live="polite">
        {listStatus === 'ready' ? `${records.length} of ${totalCount} contacts` : '…'}
        {searching && ' · searching…'}
      </p>

      {listStatus === 'loading' || searching ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          role="status"
          aria-label="Loading contacts"
        >
          {[0, 1, 2, 3, 4].map(i => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : listStatus === 'error' ? (
        <ErrorState
          title="Contacts failed to load"
          body="Filters are preserved. Retry to reload."
          onRetry={reload}
          requestId="crm-list"
        />
      ) : view === 'pipeline' ? (
        records.length === 0 ? (
          <EmptyState
            title="No pipeline data"
            body="Add contacts or clear filters to populate stages."
            action={
              <Button variant="secondary" size="md" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <PipelineBoard records={records} onMove={(id, stage) => stageOne(id, stage)} />
        )
      ) : records.length === 0 && filters.query !== '' ? (
        <EmptyState
          title="No results"
          body={`Nothing matches “${filters.query}”.`}
          action={
            <Button variant="secondary" size="md" onClick={() => setFilters({ query: '' })}>
              Clear search
            </Button>
          }
        />
      ) : records.length === 0 && filteredActive ? (
        <EmptyState
          title="No contacts match"
          body="Loosen a filter or view another segment."
          action={
            <Button variant="secondary" size="md" onClick={resetFilters}>
              Clear filters
            </Button>
          }
        />
      ) : records.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          body="Import a CSV, add a contact, or connect a channel — first messages create leads automatically."
          action={
            <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
              Add contact
            </Button>
          }
        />
      ) : (
        <>
          <div className="wx-table-wrap crm-tablewrap">
            <table className="wx-table">
              <caption className="wx-caption" style={{ textAlign: 'left', padding: '8px 16px' }}>
                Contacts — one record per person; stage is the lead facet.
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label={allSelected ? 'Deselect all' : 'Select all'}
                    />
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Assigned</th>
                  <th scope="col">Tags</th>
                  <th scope="col">Last activity</th>
                  <th scope="col">Channel</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selection.includes(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        aria-label={`Select ${r.name}`}
                      />
                    </td>
                    <td>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Avatar name={r.name} size="sm" />
                        <Link to={`/contacts/${r.id}`} style={{ fontWeight: 600 }}>
                          {r.name}
                        </Link>
                      </span>
                      <span className="wx-caption" style={{ display: 'block' }}>
                        {r.phone}
                      </span>
                    </td>
                    <td>
                      <StageBadge stage={r.stage} />
                    </td>
                    <td className="wx-body-sm">{r.assignedTo ?? 'Unassigned'}</td>
                    <td>
                      {r.tags.length === 0 ? (
                        <span className="wx-caption">—</span>
                      ) : (
                        r.tags.map(t => (
                          <Badge key={t} tone="neutral">
                            #{t}
                          </Badge>
                        ))
                      )}
                    </td>
                    <td className="wx-body-sm">{r.lastActivity}</td>
                    <td>
                      <Badge tone="neutral">{r.channel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="crm-cards">
            {records.map(r => (
              <li key={r.id} className="crm-card">
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selection.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    aria-label={`Select ${r.name}`}
                  />
                  <Avatar name={r.name} size="sm" />
                  <Link to={`/contacts/${r.id}`} style={{ fontWeight: 600 }}>
                    {r.name}
                  </Link>
                </span>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <StageBadge stage={r.stage} />
                  <span className="wx-caption">
                    {r.assignedTo ?? 'Unassigned'} · {r.lastActivity} · {r.channel}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {addOpen && (
        <AddContactModal
          onClose={() => setAddOpen(false)}
          onCreate={(name, phone, email) => {
            const id = addRecord({ name, phone, email })
            navigate(`/contacts/${id}`)
            return id
          }}
        />
      )}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} data={data} />}
      {deleteOpen && (
        <ConfirmDialog
          title={`Delete ${selection.length} contacts?`}
          body="Records, notes, and activity are removed. Conversations in Inbox are kept. This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            bulkDelete()
            setDeleteOpen(false)
          }}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </section>
  )
}
