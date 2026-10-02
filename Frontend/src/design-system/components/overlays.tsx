import type { ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../utils'
import { Button } from './buttons'

/* Accessible overlays without new deps: trap, Esc, backdrop, mobile sheets. */

function useFocusTrap(active: boolean): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!active || !ref.current) return
    const root = ref.current
    const prev = document.activeElement as HTMLElement | null
    const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const first = root.querySelector<HTMLElement>(selectors)
    ;(first ?? root).focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return
      const items = Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter(
        el => !el.hasAttribute('disabled')
      )
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (!firstItem || !lastItem) return
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus()
    }
  }, [active])
  return ref
}

function useEscape(onClose: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
}

function useLockScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

export function Modal({
  title,
  children,
  footer,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  wide?: boolean
}): React.JSX.Element {
  const titleId = useId()
  const ref = useFocusTrap(true)
  useEscape(onClose)
  useLockScroll(true)
  return createPortal(
    <>
      <div className="wx-backdrop wx-backdrop--modal" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('wx-modal', wide && 'wx-modal--wide')}
        style={{ padding: 'var(--space-6)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <h2 id={titleId} className="wx-h2">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            ✕
          </Button>
        </div>
        <div style={{ marginTop: 16 }}>{children}</div>
        {footer && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body
  )
}

export function Drawer({
  title,
  children,
  onClose,
  large = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  large?: boolean
}): React.JSX.Element {
  const titleId = useId()
  const ref = useFocusTrap(true)
  useEscape(onClose)
  useLockScroll(true)
  return createPortal(
    <>
      <div className="wx-backdrop wx-backdrop--drawer" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('wx-drawer', large && 'wx-drawer--lg')}
        style={{ padding: 'var(--space-6)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <h2 id={titleId} className="wx-h2">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close panel">
            ✕
          </Button>
        </div>
        <div style={{ marginTop: 16, overflow: 'auto' }}>{children}</div>
      </div>
    </>,
    document.body
  )
}

export function Popover({
  trigger,
  children,
  label,
}: {
  trigger: ReactNode
  children: ReactNode
  label: string
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
      >
        {trigger}
      </div>
      {open && (
        <div
          className="wx-popover"
          role="dialog"
          aria-label={label}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 'var(--z-dropdown)',
            minWidth: 240,
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function Tooltip({
  tip,
  children,
}: {
  tip: string
  children: ReactNode
}): React.JSX.Element {
  // CSS-only tooltip would need positioning; keep accessible title-based minimal.
  return (
    <span title={tip} style={{ display: 'inline-flex' }}>
      {children}
    </span>
  )
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}): React.JSX.Element {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'destructive-solid' : 'primary'} size="md" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="wx-body">{body}</p>
    </Modal>
  )
}
