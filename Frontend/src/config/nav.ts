/* Primary top navigation definition — no sidebar. Max 7 + More. */

export interface NavItem {
  label: string
  to: string
  matchPrefix: string
}

export const primaryNav: NavItem[] = [
  { label: 'Home', to: '/home', matchPrefix: '/home' },
  { label: 'Inbox', to: '/inbox', matchPrefix: '/inbox' },
  { label: 'Contacts', to: '/contacts', matchPrefix: '/contacts' },
  { label: 'Automations', to: '/automations', matchPrefix: '/automations' },
  { label: 'AI', to: '/ai', matchPrefix: '/ai' },
  { label: 'Analytics', to: '/analytics', matchPrefix: '/analytics' },
]

export const overflowNav: NavItem[] = [
  { label: 'Channels', to: '/channels', matchPrefix: '/channels' },
  { label: 'Team', to: '/team', matchPrefix: '/team' },
  { label: 'Billing', to: '/billing', matchPrefix: '/billing' },
  { label: 'Settings', to: '/settings', matchPrefix: '/settings' },
]
