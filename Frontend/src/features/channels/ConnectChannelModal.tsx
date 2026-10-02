import { useId, useState } from 'react'
import { Button } from '@/design-system/components/buttons'
import { ConfirmDialog, Modal } from '@/design-system/components/overlays'
import { PLATFORMS, platformName } from './platforms'
import type { ConnectDraft } from './useChannelsData'
import type { PlatformId } from './types'
import { ConnectionBadge } from './channelUi'

/* Stepped connect wizard: platform → configure → review → connecting →
   connected/failed. All local mock; inputs preserved across retry. */

const ACCOUNT_LABEL: Record<PlatformId, string> = {
  whatsapp: 'Phone number',
  telegram: 'Bot username',
  discord: 'Guild ID',
  messenger: 'Page ID',
  instagram: 'Business account',
  teams: 'Tenant ID',
  twitch: 'Channel name',
  twitter: 'API key',
}

export function ConnectChannelModal({
  statuses,
  connecting,
  connectError,
  onConnect,
  onCancelConnect,
  onRetryConnect,
  onDone,
  onClose,
}: {
  statuses: Record<string, string>
  connecting: { platform: PlatformId; progress: number } | null
  connectError: string | null
  onConnect: (draft: ConnectDraft) => void
  onCancelConnect: () => void
  onRetryConnect: () => void
  onDone: (platform: PlatformId) => void
  onClose: () => void
}): React.JSX.Element {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [platform, setPlatform] = useState<PlatformId | null>(null)
  const [name, setName] = useState('')
  const [account, setAccount] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const baseId = useId()

  const busy = connecting !== null
  const failed = !busy && connectError !== null && step === 3
  const done = !busy && !connectError && step === 3 && statuses[platform ?? ''] === 'connected'

  const close = (): void => {
    if (busy) return
    if (name !== '' || account !== '' || secret !== '') setConfirmCancel(true)
    else onClose()
  }

  const submit = (): void => {
    if (!platform) return
    if (name.trim() === '') {
      setError('Give the channel a name.')
      return
    }
    if (account.trim() === '') {
      setError(`${ACCOUNT_LABEL[platform]} is required.`)
      return
    }
    if (secret.trim() === '') {
      setError('An access token is required. A placeholder is fine for this mock.')
      return
    }
    setError(undefined)
    if (step < 3) {
      setStep(3)
      return
    }
    onConnect({ platform, name: name.trim(), account: account.trim(), secret: secret.trim() })
  }

  const webhook = PLATFORMS.find(p => p.id === platform)?.webhook ?? ''

  return (
    <>
      <Modal
        title={
          step === 1
            ? 'Connect channel · platform'
            : step === 2
              ? 'Connect channel · configure'
              : 'Connect channel · review'
        }
        onClose={close}
        wide
        footer={
          done ? (
            <>
              <Button variant="secondary" size="md" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" size="md" onClick={() => platform && onDone(platform)}>
                View channel
              </Button>
            </>
          ) : (
            <>
              {step > 1 && !busy && (
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
              <Button variant="secondary" size="md" onClick={close} disabled={busy}>
                Cancel
              </Button>
              {step === 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => platform && setStep(2)}
                  disabled={!platform}
                >
                  Continue
                </Button>
              ) : failed ? (
                <Button variant="primary" size="md" onClick={onRetryConnect}>
                  Retry connection
                </Button>
              ) : busy ? (
                <Button variant="secondary" size="md" onClick={onCancelConnect}>
                  Cancel connection
                </Button>
              ) : (
                <Button variant="primary" size="md" onClick={submit}>
                  {step === 2 ? 'Review' : 'Connect'}
                </Button>
              )}
            </>
          )
        }
      >
        <div className="ch-connect-steps" role="list" aria-label="Connect progress">
          {['Platform', 'Configure', 'Review'].map((label, i) => (
            <span
              key={label}
              role="listitem"
              className="wx-badge"
              data-active={String(step === i + 1)}
              style={
                step === i + 1
                  ? {
                      background: 'var(--accent-primary)',
                      color: 'var(--surface)',
                      borderColor: 'transparent',
                    }
                  : undefined
              }
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div
            role="radiogroup"
            aria-label="Messaging platform"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {PLATFORMS.map(p => {
              const st = statuses[p.id] ?? 'not-connected'
              const linked =
                st === 'connected' || st === 'attention' || st === 'error' || st === 'disabled'
              return (
                <label
                  key={p.id}
                  className="wx-check-row"
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    opacity: linked ? 0.75 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name="ch-platform"
                    checked={platform === p.id}
                    disabled={linked}
                    onChange={() => setPlatform(p.id)}
                    aria-label={`${p.name} — ${linked ? 'already linked' : p.description}`}
                  />
                  <span style={{ flex: 1 }}>
                    <span
                      className="wx-label"
                      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                      {p.name}{' '}
                      <ConnectionBadge
                        status={
                          (linked ? st : 'not-connected') as
                            'connected' | 'not-connected' | 'attention' | 'error' | 'disabled'
                        }
                      />
                    </span>
                    <span className="wx-caption" style={{ display: 'block' }}>
                      {linked ? 'Already linked — manage it from its detail page.' : p.description}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        )}

        {step === 2 && platform && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="wx-body-sm">
              Connecting <strong>{platformName(platform)}</strong>. Fields differ per platform;
              secrets stay masked.
            </p>
            <div className="wx-field">
              <label className="wx-field__label" htmlFor={`${baseId}-name`}>
                Channel name *
              </label>
              <input
                id={`${baseId}-name`}
                className="wx-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Acme Support Line"
              />
            </div>
            <div className="wx-field">
              <label className="wx-field__label" htmlFor={`${baseId}-account`}>
                {ACCOUNT_LABEL[platform]} *
              </label>
              <input
                id={`${baseId}-account`}
                className="wx-input"
                value={account}
                onChange={e => setAccount(e.target.value)}
                placeholder={ACCOUNT_LABEL[platform]}
              />
            </div>
            <div className="wx-field">
              <label className="wx-field__label" htmlFor={`${baseId}-secret`}>
                Access token *
              </label>
              <input
                id={`${baseId}-secret`}
                type="password"
                className="wx-input"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="Paste or type a placeholder"
                autoComplete="off"
              />
              <p className="wx-caption">
                Mock only — use a placeholder like “test-token”. Never a real secret.
              </p>
            </div>
            {error && (
              <p role="alert" className="wx-field__error">
                {error}
              </p>
            )}
          </div>
        )}

        {step === 3 && platform && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!busy && !connectError && statuses[platform] !== 'connected' && (
              <>
                <ul className="wx-body-sm" style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Platform: {platformName(platform)}</li>
                  <li>Channel name: {name}</li>
                  <li>
                    {ACCOUNT_LABEL[platform]}: {account}
                  </li>
                  <li>
                    Webhook: <span className="wx-mono">{webhook}</span> (registered by Whatsie)
                  </li>
                </ul>
                <p className="wx-caption">
                  Review looks right? Connecting registers the webhook and runs a health check.
                </p>
              </>
            )}
            {busy && connecting && (
              <div
                role="status"
                aria-label={`Connecting ${Math.round(connecting.progress)} percent`}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <span className="wx-body-sm">
                  Connecting to {platformName(connecting.platform)}… registering webhook, checking
                  health.
                </span>
                <span className="ch-progress">
                  <div style={{ width: `${connecting.progress}%` }} />
                </span>
              </div>
            )}
            {failed && connectError && (
              <div
                role="alert"
                style={{
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                }}
              >
                <p className="wx-body-sm" style={{ color: 'var(--danger-text)' }}>
                  {connectError}
                </p>
              </div>
            )}
            {done && (
              <div
                role="status"
                style={{
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                }}
              >
                <p className="wx-body-sm" style={{ color: 'var(--success-text)' }}>
                  Connected (mock) — health checks pass. No real external account was linked.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {confirmCancel && (
        <ConfirmDialog
          title="Cancel connecting this channel?"
          body="Your configuration will be lost."
          confirmLabel="Discard"
          danger
          onConfirm={onClose}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
    </>
  )
}
