import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { auditMock, invitesMock, teamMock } from './mock'
import type { AuditEvent, Invitation, InviteStatus, Member, Role } from './types'

/* Mock team store. No auth, email, or backend. Role gating below only hides
   or disables controls — the backend remains the security boundary. */

export type TeamStatus = 'loading' | 'ready' | 'empty' | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let inviteCounter = 0
let auditCounter = 0

export function useTeamData(): {
  status: TeamStatus
  failedSections: string[]
  searching: boolean
  query: string
  setQuery: (q: string) => void
  roleFilter: Role | 'all'
  setRoleFilter: (r: Role | 'all') => void
  statusFilter: 'all' | 'active' | 'invited'
  setStatusFilter: (s: 'all' | 'active' | 'invited') => void
  resetFilters: () => void
  members: Member[]
  allMembers: Member[]
  totalMembers: number
  activeCount: number
  pendingCount: number
  invitations: Invitation[]
  audit: AuditEvent[]
  viewAs: Role
  setViewAs: (r: Role) => void
  canManage: boolean
  inviteMember: (email: string, role: Role) => { ok: boolean; error?: string }
  resendInvite: (id: string) => void
  cancelInvite: (id: string) => void
  changeRole: (id: string, role: Role) => { ok: boolean; error?: string }
  removeMember: (id: string) => { ok: boolean; error?: string }
  reload: () => void
} {
  const [params] = useSearchParams()
  const demo = params.get('demo')
  const [nonce, setNonce] = useState(0)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>(teamMock)
  const [invites, setInvites] = useState<Invitation[]>(invitesMock)
  const [audit, setAudit] = useState<AuditEvent[]>(auditMock)
  const [query, setQuery] = useState('')
  const [confirmedQuery, setConfirmedQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'invited'>('all')
  const [viewAs, setViewAs] = useState<Role>('admin')

  const listKey = `${demo ?? 'live'}:${nonce}`
  useEffect(() => {
    if (demo === 'loading') return
    const t = window.setTimeout(() => setReadyKey(listKey), 450)
    return () => window.clearTimeout(t)
  }, [demo, nonce, listKey])

  useEffect(() => {
    if (query === confirmedQuery) return
    const t = window.setTimeout(() => setConfirmedQuery(query), 300)
    return () => window.clearTimeout(t)
  }, [query, confirmedQuery])

  const reload = useCallback(() => setNonce(n => n + 1), [])
  const searching = query.trim() !== '' && query !== confirmedQuery
  const canManage = viewAs === 'admin'

  const resetFilters = (): void => {
    setQuery('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const log = useCallback((entry: Omit<AuditEvent, 'id' | 'time'>) => {
    auditCounter += 1
    setAudit(prev => [
      { ...entry, id: `e-local-${Date.now()}-${auditCounter}`, time: 'just now' },
      ...prev,
    ])
  }, [])

  const visible = useMemo(() => {
    const q = confirmedQuery.trim().toLowerCase()
    return members.filter(m => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (q !== '' && !`${m.name} ${m.email}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [members, confirmedQuery, roleFilter, statusFilter])

  const activeAdmins = useMemo(
    () => members.filter(m => m.role === 'admin' && m.status === 'active'),
    [members]
  )

  const inviteMember = useCallback(
    (email: string, role: Role): { ok: boolean; error?: string } => {
      const clean = email.trim().toLowerCase()
      if (!EMAIL_RE.test(clean)) return { ok: false, error: 'Enter a valid email address.' }
      const taken = members.some(m => m.email.toLowerCase() === clean)
      const pending = invites.some(i => i.email.toLowerCase() === clean && i.status === 'pending')
      if (taken) return { ok: false, error: 'This person is already a workspace member.' }
      if (pending) return { ok: false, error: 'An invitation is already pending for this email.' }
      inviteCounter += 1
      setInvites(prev => [
        {
          id: `i-local-${Date.now()}-${inviteCounter}`,
          email: clean,
          role,
          status: 'pending',
          sent: 'just now',
          expires: 'in 7d',
        },
        ...prev,
      ])
      log({
        actor: 'Ava Stone (you)',
        action: 'Invited member',
        target: `${clean} as ${role}`,
        detail: 'Invitation pending — expires in 7 days (mock — no email delivered).',
      })
      return { ok: true }
    },
    [members, invites, log]
  )

  const resendInvite = useCallback(
    (id: string) => {
      const inv = invites.find(i => i.id === id)
      setInvites(prev => prev.map(i => (i.id === id ? { ...i, sent: 'just now' } : i)))
      if (inv)
        log({
          actor: 'Ava Stone (you)',
          action: 'Resent invitation',
          target: inv.email,
          detail: 'Reminder sent (mock — no email delivered).',
        })
    },
    [invites, log]
  )

  const cancelInvite = useCallback(
    (id: string) => {
      const inv = invites.find(i => i.id === id)
      setInvites(prev =>
        prev.map(i => (i.id === id ? { ...i, status: 'cancelled' as InviteStatus } : i))
      )
      if (inv) log({ actor: 'Ava Stone (you)', action: 'Cancelled invitation', target: inv.email })
    },
    [invites, log]
  )

  const changeRole = useCallback(
    (id: string, role: Role): { ok: boolean; error?: string } => {
      const m = members.find(x => x.id === id)
      if (!m) return { ok: false, error: 'Member not found.' }
      if (m.isYou) return { ok: false, error: 'You cannot change your own role in this mock.' }
      if (m.role === 'admin' && role !== 'admin' && activeAdmins.length <= 1) {
        return { ok: false, error: 'This is the last Admin — promote someone first.' }
      }
      setMembers(prev => prev.map(x => (x.id === id ? { ...x, role } : x)))
      log({
        actor: 'Ava Stone (you)',
        action: 'Changed role',
        target: m.name,
        prev: m.role,
        next: role,
      })
      return { ok: true }
    },
    [members, activeAdmins, log]
  )

  const removeMember = useCallback(
    (id: string): { ok: boolean; error?: string } => {
      const m = members.find(x => x.id === id)
      if (!m) return { ok: false, error: 'Member not found.' }
      if (m.isYou) return { ok: false, error: 'You cannot remove yourself in this mock.' }
      if (m.role === 'admin' && activeAdmins.length <= 1) {
        return { ok: false, error: 'This is the last Admin — promote someone first.' }
      }
      setMembers(prev => prev.filter(x => x.id !== id))
      log({
        actor: 'Ava Stone (you)',
        action: 'Removed member',
        target: `${m.name} <${m.email}>`,
        detail: 'Workspace access revoked (mock).',
      })
      return { ok: true }
    },
    [members, activeAdmins, log]
  )

  const listReady = readyKey === listKey
  let status: TeamStatus = 'ready'
  if (demo === 'loading' || !listReady) status = 'loading'
  else if (demo === 'error') status = 'error'
  else if (demo === 'empty') status = 'empty'
  const shown = demo === 'empty' ? [] : visible
  if (status === 'ready' && shown.length === 0) status = 'empty'

  return {
    status,
    failedSections:
      demo !== null && demo.startsWith('partial-') ? [demo.replace('partial-', '')] : [],
    searching,
    query,
    setQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    resetFilters,
    members: shown,
    allMembers: members,
    totalMembers: members.length,
    activeCount: members.filter(m => m.status === 'active').length,
    pendingCount:
      invites.filter(i => i.status === 'pending').length +
      members.filter(m => m.status === 'invited').length,
    invitations: invites,
    audit,
    viewAs,
    setViewAs,
    canManage,
    inviteMember,
    resendInvite,
    cancelInvite,
    changeRole,
    removeMember,
    reload,
  }
}
