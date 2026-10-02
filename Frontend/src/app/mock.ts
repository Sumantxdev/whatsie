import type { TenantStatus, UserRole, Workspace } from '@/types/domain'

/* TEMPORARY shell-only mock. No backend. Replaced when auth/workspace APIs land.
   Exists only to demonstrate shell interactions (switching, menus, panels). */

export interface MockUser {
  name: string
  email: string
  role: UserRole
}

export interface MockNotification {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  body: string
}

export const mockUser: MockUser = {
  name: 'Ava Stone',
  email: 'ava@example.com',
  role: 'admin',
}

export const mockWorkspaces: Workspace[] = [
  { id: 'ws-acme', name: 'Acme Goods', plan: 'pro', status: 'active' },
  { id: 'ws-beta', name: 'Beta Studio', plan: 'free', status: 'suspended' },
]

export const mockActiveWorkspaceId = 'ws-acme'

export const mockNotifications: MockNotification[] = [
  {
    id: 'n1',
    severity: 'critical',
    title: 'WhatsApp degraded',
    body: 'Latency high in the last 15 minutes. Queued messages are held, not dropped.',
  },
  {
    id: 'n2',
    severity: 'warning',
    title: 'AI usage at 82%',
    body: 'Pro workspace used 82K of 100K monthly tokens.',
  },
  {
    id: 'n3',
    severity: 'info',
    title: 'Invite accepted',
    body: 'Sam joined Beta Studio as agent.',
  },
]

export function workspaceStatusLabel(status: TenantStatus): string {
  return status === 'active' ? 'Live' : status === 'suspended' ? 'Suspended' : 'Cancelled'
}
