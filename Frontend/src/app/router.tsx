import { Navigate, createBrowserRouter } from 'react-router'
import { HomePage } from '@/features/home/HomePage'
import { ConversationPage, InboxPage } from '@/features/inbox/InboxPages'
import { ContactDetailPage } from '@/features/crm/ContactDetailPage'
import { ContactsPage } from '@/features/crm/ContactsPage'
import { AgentDetailPage } from '@/features/ai/AgentDetailPage'
import { AgentsPage } from '@/features/ai/AgentsPage'
import { BillingPage } from '@/features/billing/BillingPage'
import { TeamPage } from '@/features/team/TeamPage'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { ChannelDetailPage } from '@/features/channels/ChannelDetailPage'
import { ChannelsPage } from '@/features/channels/ChannelsPage'
import { AutomationPage } from '@/features/automation/AutomationPage'
import { WorkflowDetailPage } from '@/features/automation/WorkflowDetailPage'
import { SourceDetailPage } from '@/features/kb/SourceDetailPage'
import { PlaceholderPage } from './PlaceholderPage'
import { AppShell } from './shell'

/* Shell verification routes. Detail/nested routes arrive with features. */

function page(title: string, description: string): React.JSX.Element {
  return <PlaceholderPage title={title} description={description} />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },
      {
        path: 'inbox',
        children: [
          { index: true, element: <InboxPage /> },
          { path: ':conversationId', element: <ConversationPage /> },
        ],
      },
      {
        path: 'contacts',
        children: [
          { index: true, element: <ContactsPage /> },
          { path: ':contactId', element: <ContactDetailPage /> },
        ],
      },
      {
        path: 'automations',
        children: [
          { index: true, element: <AutomationPage /> },
          { path: ':workflowId', element: <WorkflowDetailPage /> },
        ],
      },
      {
        path: 'ai',
        children: [
          { index: true, element: <AgentsPage /> },
          { path: 'knowledge/:sourceId', element: <SourceDetailPage /> },
          { path: ':agentId', element: <AgentDetailPage /> },
        ],
      },
      {
        path: 'channels',
        children: [
          { index: true, element: <ChannelsPage /> },
          { path: ':channelId', element: <ChannelDetailPage /> },
        ],
      },
      { path: 'analytics', element: <AnalyticsPage /> },
      {
        path: 'team',
        children: [{ index: true, element: <TeamPage /> }],
      },
      {
        path: 'billing',
        children: [{ index: true, element: <BillingPage /> }],
      },
      {
        path: 'settings',
        element: page('Settings', 'Workspace configuration. Sections via contextual tabs.'),
      },
      { path: '*', element: page('Not found', 'This route does not exist yet.') },
    ],
  },
])
