/* Typed mirror of CSS tokens for JS usage (charts, canvas). Keep in sync with tokens.css. */

export const tokens = {
  color: {
    bgBase: 'var(--bg-base)',
    bgRaised: 'var(--bg-raised)',
    surface: 'var(--surface)',
    surfaceHover: 'var(--surface-hover)',
    surfaceActive: 'var(--surface-active)',
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',
    borderSubtle: 'var(--border-subtle)',
    borderDefault: 'var(--border-default)',
    borderStrong: 'var(--border-strong)',
    accentPrimary: 'var(--accent-primary)',
    accentPrimaryHover: 'var(--accent-primary-hover)',
    accentPrimaryActive: 'var(--accent-primary-active)',
    accentPrimaryTint: 'var(--accent-primary-tint)',
    accentPrimarySubtle: 'var(--accent-primary-subtle)',
    accentPrimaryBorder: 'var(--accent-primary-border)',
    accentPrimaryBorderSoft: 'var(--accent-primary-border-soft)',
    accentPrimaryText: 'var(--accent-primary-text)',
    accentAi: 'var(--accent-ai)',
    success: 'var(--success-text)',
    warning: 'var(--warning-text)',
    danger: 'var(--danger-text)',
    info: 'var(--info-text)',
  },
  radius: { sm: 6, md: 10, lg: 14, modal: 16, pill: 999 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },
  breakpoints: { tablet: 768, desktop: 1024, wide: 1440 },
  z: { dropdown: 50, drawer: 60, modal: 70, toast: 80, tooltip: 90 },
  motion: { fast: 120, base: 200, slow: 320 },
} as const

export type Tokens = typeof tokens
