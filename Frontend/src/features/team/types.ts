/* Team contracts. Roles mirror reference/message.txt (admin/agent/viewer).
   Frontend gating is simulation only — the backend enforces authorization. */

export type Role = 'admin' | 'agent' | 'viewer'
export type MemberStatus = 'active' | 'invited'
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled' | 'failed'

export interface Member {
  id: string
  name: string
  email: string
  role: Role
  status: MemberStatus
  joined: string
  lastActive: string
  isYou: boolean
}

export interface Invitation {
  id: string
  email: string
  role: Role
  status: InviteStatus
  sent: string
  expires: string
}

export interface AuditEvent {
  id: string
  actor: string
  action: string
  target: string
  time: string
  detail?: string
  prev?: string
  next?: string
}

export const ROLE_META: Record<Role, { label: string; description: string; summary: string }> = {
  admin: {
    label: 'Admin',
    description: 'Full workspace control: members, billing, and settings.',
    summary: 'Manage everything',
  },
  agent: {
    label: 'Agent',
    description: 'Handles conversations and leads. No team or billing access.',
    summary: 'Work the inbox & CRM',
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-oriented access for reporting and oversight.',
    summary: 'Observe, read-only',
  },
}

export type MatrixLevel = 'full' | 'limited' | 'none'

export interface MatrixRow {
  area: string
  note?: string
  levels: Record<Role, MatrixLevel>
}
