import { useSearchParams } from 'react-router'
import { Tabs } from '@/design-system/components/tabs'
import type { ContextualTab } from './contextualTabs'

/* Reusable secondary horizontal nav. URL-driven (?view=), shareable, back-safe. */

export function ContextualNav({
  tabs,
  label,
  param = 'view',
}: {
  tabs: ContextualTab[]
  label: string
  param?: string
}): React.JSX.Element {
  const [params, setParams] = useSearchParams()
  const activeId = params.get(param) ?? tabs[0]?.id ?? ''
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--surface)',
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-8" style={{ overflowX: 'auto' }}>
        <Tabs
          items={tabs}
          activeId={activeId}
          label={label}
          onChange={id => {
            const next = new URLSearchParams(params)
            next.set(param, id)
            setParams(next, { preventScrollReset: true })
          }}
        />
      </div>
    </div>
  )
}
