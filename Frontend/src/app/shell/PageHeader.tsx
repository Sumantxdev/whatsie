import type { ReactNode } from 'react'
import { Link } from 'react-router'

/* Global page header: breadcrumb + title + desc + actions. Adapts per page. */

export interface Crumb {
  label: string
  to?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  primaryAction,
  secondaryActions,
}: {
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol
            style={{ display: 'flex', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}
            className="wx-caption"
          >
            {breadcrumbs.map((c, i) => (
              <li key={c.label} style={{ display: 'flex', gap: 8 }}>
                {c.to && i < breadcrumbs.length - 1 ? (
                  <Link to={c.to}>{c.label}</Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span aria-hidden="true">/</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <h1 className="wx-h1">{title}</h1>
          {description && (
            <p className="wx-body" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
        </div>
        {(primaryAction || secondaryActions) && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  )
}
