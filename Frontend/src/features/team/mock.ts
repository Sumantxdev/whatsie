import type { AuditEvent, Invitation, MatrixRow, Member } from './types'

/* Centralized team mock: two admins (one is you), agents, a viewer,
   an invited member, mixed invitations, and access-related audit events. */

export const teamMock: Member[] = [
  {
    id: 'u-ava',
    name: 'Ava Stone',
    email: 'ava@example.com',
    role: 'admin',
    status: 'active',
    joined: 'Jan 12, 2026',
    lastActive: 'now',
    isYou: true,
  },
  {
    id: 'u-marcus',
    name: 'Marcus Chen',
    email: 'marcus@example.com',
    role: 'admin',
    status: 'active',
    joined: 'Jan 20, 2026',
    lastActive: '1h ago',
    isYou: false,
  },
  {
    id: 'u-sam',
    name: 'Sam Reed',
    email: 'sam@example.com',
    role: 'agent',
    status: 'active',
    joined: 'Feb 03, 2026',
    lastActive: '18m ago',
    isYou: false,
  },
  {
    id: 'u-lena',
    name: 'Lena Ortiz',
    email: 'lena@example.com',
    role: 'agent',
    status: 'invited',
    joined: 'Invited 2d ago',
    lastActive: '—',
    isYou: false,
  },
  {
    id: 'u-jo',
    name: 'Jo Park',
    email: 'jo@example.com',
    role: 'viewer',
    status: 'active',
    joined: 'Mar 01, 2026',
    lastActive: '3h ago',
    isYou: false,
  },
]

export const invitesMock: Invitation[] = [
  {
    id: 'i-1',
    email: 'dev@example.com',
    role: 'agent',
    status: 'pending',
    sent: '1d ago',
    expires: 'in 6d',
  },
  {
    id: 'i-2',
    email: 'ana@example.com',
    role: 'viewer',
    status: 'accepted',
    sent: '5d ago',
    expires: '—',
  },
  {
    id: 'i-3',
    email: 'old@example.com',
    role: 'agent',
    status: 'expired',
    sent: '12d ago',
    expires: 'expired 5d ago',
  },
  {
    id: 'i-4',
    email: 'ops@example.com',
    role: 'admin',
    status: 'cancelled',
    sent: '8d ago',
    expires: '—',
  },
]

export const auditMock: AuditEvent[] = [
  {
    id: 'e1',
    actor: 'Ava Stone',
    action: 'Invited member',
    target: 'dev@example.com as Agent',
    time: '1d ago',
    detail: 'Invitation pending — expires in 6 days.',
  },
  {
    id: 'e2',
    actor: 'Marcus Chen',
    action: 'Changed role',
    target: 'Jo Park',
    time: '2d ago',
    detail: 'Reporting access narrowed to read-only.',
    prev: 'Agent',
    next: 'Viewer',
  },
  {
    id: 'e3',
    actor: 'Ava Stone',
    action: 'Resent invitation',
    target: 'dev@example.com',
    time: '20h ago',
    detail: 'Second reminder sent (mock — no email delivered).',
  },
  {
    id: 'e4',
    actor: 'Sam Reed',
    action: 'Accepted invitation',
    target: 'sam@example.com',
    time: 'Feb 03, 2026',
    detail: 'Joined as Agent.',
  },
  {
    id: 'e5',
    actor: 'Ava Stone',
    action: 'Cancelled invitation',
    target: 'ops@example.com',
    time: '8d ago',
    detail: 'Hiring freeze — role no longer needed.',
  },
  {
    id: 'e6',
    actor: 'Marcus Chen',
    action: 'Removed member',
    target: 'temp-contractor@example.com',
    time: 'Mar 02, 2026',
    detail: 'Contract ended; workspace access revoked.',
  },
]

export const matrixMock: MatrixRow[] = [
  {
    area: 'Conversations',
    note: 'Reply, assign, resolve',
    levels: { admin: 'full', agent: 'full', viewer: 'none' },
  },
  {
    area: 'CRM & leads',
    note: 'Stage changes, notes, import',
    levels: { admin: 'full', agent: 'full', viewer: 'none' },
  },
  {
    area: 'AI agents',
    note: 'Configure, test, usage review',
    levels: { admin: 'full', agent: 'limited', viewer: 'none' },
  },
  {
    area: 'Knowledge',
    note: 'Sources, indexing, assignment',
    levels: { admin: 'full', agent: 'limited', viewer: 'none' },
  },
  {
    area: 'Automation',
    note: 'Build, publish, executions',
    levels: { admin: 'full', agent: 'limited', viewer: 'none' },
  },
  {
    area: 'Channels',
    note: 'Connect, health, disconnect',
    levels: { admin: 'full', agent: 'none', viewer: 'none' },
  },
  {
    area: 'Analytics',
    note: 'All views & exports',
    levels: { admin: 'full', agent: 'full', viewer: 'full' },
  },
  {
    area: 'Team management',
    note: 'Invite, roles, removal',
    levels: { admin: 'full', agent: 'none', viewer: 'none' },
  },
  {
    area: 'Billing & settings',
    note: 'Plan, invoices, workspace',
    levels: { admin: 'full', agent: 'none', viewer: 'none' },
  },
]
