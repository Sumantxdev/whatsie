import { useId, useRef, useState } from 'react'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog, Modal } from '@/design-system/components/overlays'
import { KB_TYPE_META } from './types'
import type { KbSourceType, NewSourceInput } from './types'

/* Progressive add flow: type → configure → review → processing (mock).
   No uploads or network — files stay as local metadata. */

const ACCEPTED = ['.pdf', '.docx', '.md', '.txt']

interface PickedFile {
  name: string
  size: string
  ok: boolean
}

interface FaqPair {
  q: string
  a: string
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function AddKnowledgeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (input: NewSourceInput) => string
}): React.JSX.Element {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [type, setType] = useState<KbSourceType | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState<PickedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [url, setUrl] = useState('')
  const [urlTouched, setUrlTouched] = useState(false)
  const [textBody, setTextBody] = useState('')
  const [pairs, setPairs] = useState<FaqPair[]>([{ q: '', a: '' }])
  const [columns, setColumns] = useState('')
  const [rows, setRows] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const fileInput = useRef<HTMLInputElement | null>(null)
  const baseId = useId()

  const touched =
    title !== '' ||
    description !== '' ||
    files.length > 0 ||
    url !== '' ||
    textBody !== '' ||
    pairs.some(p => p.q !== '' || p.a !== '')
  const tagList = tags
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)

  const close = (): void => {
    if (touched) setConfirmDiscard(true)
    else onClose()
  }

  const addFiles = (list: FileList | null): void => {
    if (!list) return
    const picked: PickedFile[] = Array.from(list).map(f => {
      const lower = f.name.toLowerCase()
      const ok = ACCEPTED.some(ext => lower.endsWith(ext))
      return { name: f.name, size: formatBytes(f.size), ok }
    })
    setFiles(prev => [...prev, ...picked])
    if (title === '' && picked.length > 0 && picked[0]?.ok) {
      const first = picked[0].name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
      setTitle(first)
    }
  }

  const urlState = (u: string): 'empty' | 'invalid' | 'valid' => {
    if (u.trim() === '') return 'empty'
    try {
      const parsed = new URL(u.trim())
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? 'valid' : 'invalid'
    } catch {
      return 'invalid'
    }
  }

  const validStep2 = (): string | undefined => {
    if (title.trim() === '') return 'Give the source a title.'
    if (type === 'document') {
      if (files.length === 0) return 'Choose at least one file.'
      if (files.some(f => !f.ok)) return 'Remove unsupported files before continuing.'
    }
    if (type === 'url') {
      const s = urlState(url)
      if (s === 'empty') return 'Enter a URL to fetch.'
      if (s === 'invalid') return 'That URL is invalid — use http(s)://…'
    }
    if (type === 'text' && textBody.trim().length < 20)
      return 'Add at least a short paragraph (20+ characters).'
    if (type === 'faq' && !pairs.some(p => p.q.trim() !== '' && p.a.trim() !== '')) {
      return 'Complete at least one question and answer.'
    }
    if (type === 'structured') {
      if (columns.trim() === '') return 'Name the columns (e.g. sku, price, stock).'
      if (rows.trim() === '') return 'Paste at least one data row.'
    }
    return undefined
  }

  const submit = (): void => {
    const problem = validStep2()
    if (problem) {
      setError(problem)
      return
    }
    setError(undefined)
    if (step < 3) {
      setStep(3)
      return
    }
    onCreated({
      title: title.trim(),
      type: type ?? 'document',
      description: description.trim(),
      tags: tagList,
    })
  }

  const reviewLines: string[] = [`Type: ${type ? KB_TYPE_META[type].label : '—'}`]
  if (type === 'document') reviewLines.push(`Files: ${files.filter(f => f.ok).length} selected`)
  if (type === 'url') reviewLines.push(`URL: ${url.trim()}`)
  if (type === 'text') reviewLines.push(`Length: ${textBody.trim().length} characters`)
  if (type === 'faq')
    reviewLines.push(
      `Pairs: ${pairs.filter(p => p.q.trim() !== '' && p.a.trim() !== '').length} complete`
    )
  if (type === 'structured')
    reviewLines.push(
      `Columns: ${columns.trim()} · Rows: ${rows.trim().split('\n').filter(Boolean).length}`
    )
  if (tagList.length > 0) reviewLines.push(`Tags: ${tagList.join(', ')}`)

  return (
    <>
      <Modal
        title={
          step === 1
            ? 'Add knowledge · type'
            : step === 2
              ? 'Add knowledge · configure'
              : 'Add knowledge · review'
        }
        onClose={close}
        wide
        footer={
          <>
            {step > 1 && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setError(undefined)
                  setStep((step - 1) as 1 | 2)
                }}
              >
                Back
              </Button>
            )}
            <Button variant="secondary" size="md" onClick={close}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button variant="primary" size="md" onClick={submit} disabled={step === 1 && !type}>
                {step === 1 ? 'Continue' : 'Review'}
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={submit}>
                Start processing
              </Button>
            )}
          </>
        }
      >
        {step === 1 && (
          <div
            role="radiogroup"
            aria-label="Knowledge source type"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {(Object.keys(KB_TYPE_META) as KbSourceType[]).map(t => (
              <label
                key={t}
                className="wx-check-row"
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                }}
              >
                <input
                  type="radio"
                  name="kb-type"
                  checked={type === t}
                  onChange={() => setType(t)}
                />
                <span>
                  <span className="wx-label">{KB_TYPE_META[t].label}</span>
                  <span className="wx-caption" style={{ display: 'block' }}>
                    {KB_TYPE_META[t].hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {step === 2 && type && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="wx-field">
              <label className="wx-field__label" htmlFor={`${baseId}-title`}>
                Title *
              </label>
              <input
                id={`${baseId}-title`}
                className="wx-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Returns playbook"
              />
            </div>

            {type === 'document' && (
              <>
                <div
                  className="kb-drop"
                  data-over={String(dragOver)}
                  onDragOver={e => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragOver(false)
                    addFiles(e.dataTransfer.files)
                  }}
                >
                  <p className="wx-label">Drag files here, or</p>
                  <p style={{ marginTop: 8 }}>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => fileInput.current?.click()}
                    >
                      Choose files
                    </Button>
                  </p>
                  <input
                    ref={fileInput}
                    type="file"
                    hidden
                    multiple
                    accept={ACCEPTED.join(',')}
                    onChange={e => addFiles(e.target.files)}
                    aria-label="Choose files"
                  />
                  <p className="wx-caption" style={{ marginTop: 8 }}>
                    PDF, DOCX, MD, TXT · stays local in this mock
                  </p>
                </div>
                {files.length > 0 && (
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
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="kb-file">
                        <span style={{ flex: 1 }}>
                          <span className="wx-body-sm" style={{ display: 'block' }}>
                            {f.name}
                          </span>
                          <span className="wx-caption">
                            {f.size}
                            {!f.ok && ' · unsupported type'}
                          </span>
                        </span>
                        {!f.ok && (
                          <span role="alert" className="wx-field__error">
                            Unsupported
                          </span>
                        )}
                        <button
                          type="button"
                          className="wx-link-btn wx-body-sm"
                          onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                          aria-label={`Remove ${f.name}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {type === 'url' && (
              <div className="wx-field">
                <label className="wx-field__label" htmlFor={`${baseId}-url`}>
                  URL *
                </label>
                <input
                  id={`${baseId}-url`}
                  className="wx-input"
                  inputMode="url"
                  value={url}
                  onChange={e => {
                    setUrl(e.target.value)
                    setUrlTouched(true)
                  }}
                  placeholder="https://help.example.com/shipping"
                  aria-invalid={urlTouched && urlState(url) === 'invalid' ? true : undefined}
                  aria-describedby={`${baseId}-url-hint`}
                />
                <p id={`${baseId}-url-hint`} className="wx-caption">
                  {(() => {
                    const s = urlState(url)
                    if (s === 'empty') return 'Public pages only — nothing is fetched in this mock.'
                    if (s === 'invalid') return 'Invalid URL — use http(s)://…'
                    return 'Valid URL — ready to fetch on submit.'
                  })()}
                </p>
              </div>
            )}

            {type === 'text' && (
              <div className="wx-field">
                <label className="wx-field__label" htmlFor={`${baseId}-body`}>
                  Content *
                </label>
                <textarea
                  id={`${baseId}-body`}
                  className="wx-textarea"
                  rows={5}
                  value={textBody}
                  onChange={e => setTextBody(e.target.value)}
                  placeholder="Write the knowledge agents should cite…"
                />
                <p className="wx-caption">{textBody.trim().length} characters</p>
              </div>
            )}

            {type === 'faq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pairs.map((p, i) => (
                  <fieldset
                    key={i}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <legend className="wx-caption">Pair {i + 1}</legend>
                    <label className="wx-field__label" htmlFor={`${baseId}-q-${i}`}>
                      Question
                    </label>
                    <input
                      id={`${baseId}-q-${i}`}
                      className="wx-input"
                      value={p.q}
                      onChange={e =>
                        setPairs(prev =>
                          prev.map((x, j) => (j === i ? { ...x, q: e.target.value } : x))
                        )
                      }
                      placeholder="What is…?"
                    />
                    <label className="wx-field__label" htmlFor={`${baseId}-a-${i}`}>
                      Answer
                    </label>
                    <textarea
                      id={`${baseId}-a-${i}`}
                      className="wx-textarea"
                      rows={2}
                      value={p.a}
                      onChange={e =>
                        setPairs(prev =>
                          prev.map((x, j) => (j === i ? { ...x, a: e.target.value } : x))
                        )
                      }
                      placeholder="The answer agents should give…"
                    />
                    {pairs.length > 1 && (
                      <span>
                        <button
                          type="button"
                          className="wx-link-btn wx-body-sm"
                          onClick={() => setPairs(prev => prev.filter((_, j) => j !== i))}
                        >
                          Remove pair
                        </button>
                      </span>
                    )}
                  </fieldset>
                ))}
                <span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPairs(prev => [...prev, { q: '', a: '' }])}
                  >
                    Add pair
                  </Button>
                </span>
              </div>
            )}

            {type === 'structured' && (
              <>
                <div className="wx-field">
                  <label className="wx-field__label" htmlFor={`${baseId}-cols`}>
                    Columns *
                  </label>
                  <input
                    id={`${baseId}-cols`}
                    className="wx-input"
                    value={columns}
                    onChange={e => setColumns(e.target.value)}
                    placeholder="sku, price, stock"
                  />
                </div>
                <div className="wx-field">
                  <label className="wx-field__label" htmlFor={`${baseId}-rows`}>
                    Rows — one per line *
                  </label>
                  <textarea
                    id={`${baseId}-rows`}
                    className="wx-textarea"
                    rows={3}
                    value={rows}
                    onChange={e => setRows(e.target.value)}
                    placeholder={'starter-01, 49, in-stock\nstarter-02, 79, low'}
                  />
                </div>
              </>
            )}

            <div className="wx-field">
              <label className="wx-field__label" htmlFor={`${baseId}-desc`}>
                Description
              </label>
              <input
                id={`${baseId}-desc`}
                className="wx-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="When should agents use this?"
              />
            </div>
            <div className="wx-field">
              <label className="wx-field__label" htmlFor={`${baseId}-tags`}>
                Tags (comma-separated)
              </label>
              <input
                id={`${baseId}-tags`}
                className="wx-input"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="pricing, support"
              />
            </div>
            {error && (
              <p role="alert" className="wx-field__error">
                {error}
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 className="wx-h3">{title || '(untitled)'}</h3>
            <ul className="wx-body-sm" style={{ margin: 0, paddingLeft: 18 }}>
              {reviewLines.map(l => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p className="wx-caption">
              On submit the source enters Processing, then becomes Indexed and available to agents.
            </p>
          </div>
        )}
      </Modal>

      {confirmDiscard && (
        <ConfirmDialog
          title="Discard this source?"
          body="Your configuration will be lost. This cannot be undone."
          confirmLabel="Discard"
          danger
          onConfirm={onClose}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
    </>
  )
}
