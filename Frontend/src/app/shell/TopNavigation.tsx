import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { Menu, MoreHorizontal, Plus, X } from 'lucide-react'
import { overflowNav, primaryNav } from '@/config/nav'
import { Icon } from '@/design-system/components/icons'
import { IconButton } from '@/design-system/components/buttons'
import { Popover } from '@/design-system/components/overlays'
import { NotificationsButton } from './NotificationsButton'
import { SearchPalette, SearchTrigger, SearchTriggerCompact } from './SearchPalette'
import { useSearchShortcut } from './useSearchShortcut'
import { UserMenu } from './UserMenu'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

function isActivePath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/* Top-only navigation. Desktop row → tablet More overflow → mobile top-sheet menu.
   No sidebar at any breakpoint. */

export function TopNavigation(): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useSearchShortcut(() => setSearchOpen(true))

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <>
      <header
        className="sticky top-0"
        style={{
          zIndex: 'var(--z-topbar)',
          height: 'var(--nav-height-d)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface)',
        }}
      >
        <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-4 px-8">
          <Link
            to="/home"
            className="wx-h3"
            style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Whatsie
          </Link>

          {/* Desktop primary */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {primaryNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                aria-current={
                  isActivePath(location.pathname, item.matchPrefix) ? 'page' : undefined
                }
                className="wx-nav-item"
              >
                {item.label}
              </NavLink>
            ))}
            <Popover
              label="More sections"
              trigger={
                <button type="button" className="wx-nav-item" aria-label="More sections">
                  <Icon icon={MoreHorizontal} size="sm" />
                  <span style={{ marginLeft: 4 }}>More</span>
                </button>
              }
            >
              <ul className="wx-list" style={{ minWidth: 200 }}>
                {overflowNav.map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className="wx-list__row wx-body"
                      style={{ textDecoration: 'none', color: 'var(--text-primary)' }}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </Popover>
          </nav>

          <div style={{ flex: 1 }} />

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <div className="hidden xl:block">
              <SearchTrigger onOpen={() => setSearchOpen(true)} />
            </div>
            <div className="xl:hidden">
              <SearchTriggerCompact onOpen={() => setSearchOpen(true)} />
            </div>
            <WorkspaceSwitcher />
            <NotificationsButton />
            <UserMenu />
            <button
              type="button"
              className="wx-btn wx-btn--primary wx-btn--md"
              onClick={() => navigate('/automations')}
            >
              <Icon icon={Plus} size="sm" />
              New
            </button>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            <SearchTriggerCompact onOpen={() => setSearchOpen(true)} />
            <NotificationsButton />
            <IconButton
              label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen(v => !v)}
              bordered
            >
              <Icon icon={mobileOpen ? X : Menu} size="sm" />
            </IconButton>
          </div>
        </div>

        {/* Mobile top-sheet menu (not a sidebar) */}
        {mobileOpen && (
          <div
            role="dialog"
            aria-label="Menu"
            style={{
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '70svh',
              overflow: 'auto',
            }}
            className="md:hidden"
          >
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <WorkspaceSwitcher />
              {[...primaryNav, ...overflowNav].map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  aria-current={
                    isActivePath(location.pathname, item.matchPrefix) ? 'page' : undefined
                  }
                  className="wx-nav-item"
                  style={{ height: 44 }}
                >
                  {item.label}
                </NavLink>
              ))}
              <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                <UserMenu />
              </div>
            </div>
          </div>
        )}
      </header>
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
    </>
  )
}
