import { Outlet, useLocation } from 'react-router'
import { ContextualNav } from './shell/ContextualNav'
import { contextualTabsByPrefix } from './shell/contextualTabs'
import { ShellBanners } from './shell/ShellStates'
import { TopNavigation } from './shell/TopNavigation'

/* Authenticated shell: top nav → banners → contextual nav → header → content.
   No sidebars. Placeholders verify the pattern; features fill it later. */

function contextualFor(pathname: string): string | null {
  const prefixes = Object.keys(contextualTabsByPrefix).sort((a, b) => b.length - a.length)
  return prefixes.find(p => pathname === p || pathname.startsWith(`${p}/`)) ?? null
}

export function AppShell(): React.JSX.Element {
  const location = useLocation()
  const prefix = contextualFor(location.pathname)
  const contextual = prefix ? contextualTabsByPrefix[prefix] : undefined
  const wide =
    location.pathname.startsWith('/inbox') || location.pathname.startsWith('/automations')

  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <TopNavigation />
      <ShellBanners workspaceSuspended={false} workspaceName="Acme Goods" />
      {contextual && (
        <div
          className="sticky"
          style={{ top: 'var(--nav-height-d)', zIndex: 'var(--z-sticky-secondary)' }}
        >
          <ContextualNav tabs={contextual.tabs} label={contextual.label} />
        </div>
      )}
      <main
        id="main"
        className={`mx-auto w-full flex-1 px-8 py-8 ${wide ? 'max-w-7xl' : 'max-w-7xl'}`}
        style={{ maxWidth: wide ? 'var(--container-wide)' : 'var(--container-default)' }}
      >
        <Outlet />
      </main>
    </div>
  )
}
