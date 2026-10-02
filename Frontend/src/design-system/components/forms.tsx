import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'
import { cx } from '../utils'

/* Form primitives: label + hint + error always linked via ids. */

function FieldShell({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string
  hint?: string
  error?: string
  children: (ids: { inputId: string; hintId: string; errorId: string }) => ReactNode
  required?: boolean
}): React.JSX.Element {
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  return (
    <div className="wx-field">
      <label htmlFor={inputId} className="wx-field__label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children({ inputId, hintId, errorId })}
      {hint && !error && (
        <p id={hintId} className="wx-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="wx-field__error">
          {error}
        </p>
      )}
    </div>
  )
}

export interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
}

export function Input({
  label,
  hint,
  error,
  className,
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <FieldShell label={label} hint={hint} error={error} required={rest.required}>
      {({ inputId, hintId, errorId }) => (
        <input
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cx('wx-input', error && 'wx-input--error', className)}
          {...rest}
        />
      )}
    </FieldShell>
  )
}

export function SearchInput({
  label,
  hint,
  error,
  className,
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <Input
      label={label}
      hint={hint}
      error={error}
      type="search"
      role="searchbox"
      className={className}
      {...rest}
    />
  )
}

export function Textarea({
  label,
  hint,
  error,
  className,
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>): React.JSX.Element {
  return (
    <FieldShell label={label} hint={hint} error={error} required={rest.required}>
      {({ inputId, hintId, errorId }) => (
        <textarea
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cx('wx-textarea', error && 'wx-textarea--error', className)}
          {...rest}
        />
      )}
    </FieldShell>
  )
}

export function Select({
  label,
  hint,
  error,
  children,
  className,
  ...rest
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>): React.JSX.Element {
  return (
    <FieldShell label={label} hint={hint} error={error} required={rest.required}>
      {({ inputId, hintId, errorId }) => (
        <select
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cx('wx-select', error && 'wx-select--error', className)}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  )
}

export function Checkbox({
  label,
  hint,
  className,
  ...rest
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <label className={cx('wx-check-row', className)}>
      <input type="checkbox" {...rest} />
      <span>
        <span className="wx-label">{label}</span>
        {hint && (
          <span className="wx-caption" style={{ display: 'block' }}>
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}

export function Radio({
  label,
  hint,
  className,
  ...rest
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <label className={cx('wx-radio-row', className)}>
      <input type="radio" {...rest} />
      <span>
        <span className="wx-label">{label}</span>
        {hint && (
          <span className="wx-caption" style={{ display: 'block' }}>
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}

export function Switch({
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
  disabled?: boolean
}): React.JSX.Element {
  return (
    <div className="wx-check-row">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        data-on={String(checked)}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className="wx-switch"
      >
        <span className="wx-switch__thumb" aria-hidden="true" />
      </button>
      <span>
        <span className="wx-label">{label}</span>
        {hint && (
          <span className="wx-caption" style={{ display: 'block' }}>
            {hint}
          </span>
        )}
      </span>
    </div>
  )
}
