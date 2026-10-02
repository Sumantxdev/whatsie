export interface ContextualTab {
  id: string
  label: string
}

/* Route → contextual tabs map. Must match IA; placeholders only verify the pattern. */
export const contextualTabsByPrefix: Record<string, { label: string; tabs: ContextualTab[] }> = {
  '/inbox': {
    label: 'Conversation queues',
    tabs: [
      { id: 'all', label: 'All' },
      { id: 'mine', label: 'Mine' },
      { id: 'unassigned', label: 'Unassigned' },
      { id: 'ai', label: 'AI-handled' },
      { id: 'resolved', label: 'Resolved' },
    ],
  },
  '/contacts': {
    label: 'Contacts views',
    tabs: [
      { id: 'all', label: 'All' },
      { id: 'pipeline', label: 'Pipeline' },
      { id: 'segments', label: 'Segments' },
    ],
  },
  '/automations': {
    label: 'Automation views',
    tabs: [
      { id: 'workflows', label: 'Workflows' },
      { id: 'executions', label: 'Executions' },
      { id: 'templates', label: 'Templates' },
    ],
  },
  '/ai': {
    label: 'AI views',
    tabs: [
      { id: 'agents', label: 'Agents' },
      { id: 'knowledge', label: 'Knowledge' },
      { id: 'activity', label: 'Activity' },
      { id: 'usage', label: 'Usage' },
    ],
  },
  '/analytics': {
    label: 'Analytics views',
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'messaging', label: 'Messaging' },
      { id: 'leads', label: 'Leads' },
      { id: 'automation', label: 'Automation' },
      { id: 'ai', label: 'AI' },
      { id: 'channels', label: 'Channels' },
    ],
  },
  '/settings': {
    label: 'Settings sections',
    tabs: [
      { id: 'workspace', label: 'Workspace' },
      { id: 'profile', label: 'Profile' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'api', label: 'API keys' },
      { id: 'security', label: 'Security' },
      { id: 'privacy', label: 'Data & privacy' },
    ],
  },
}
