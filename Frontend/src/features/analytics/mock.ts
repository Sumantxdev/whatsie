import type { RangeDataset, TimeRange } from './types'

/* Centralized mock analytics. Deterministic per range (no render-time
   randomness) so charts, tables, and KPIs always agree. */

function wave(i: number, base: number, amp: number, period = 7): number {
  return Math.max(
    0,
    Math.round(base + amp * Math.sin((i / period) * Math.PI * 2) + (i % 3) * (amp / 4))
  )
}

function labels(range: Exclude<TimeRange, 'custom'>): string[] {
  if (range === 'today') {
    return ['12a', '2a', '4a', '6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p']
  }
  const n = range === '7d' ? 7 : 30
  return Array.from({ length: n }, (_, i) =>
    range === '7d'
      ? (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] ?? `D${i + 1}`)
      : `D${i + 1}`
  )
}

function messagesFor(
  range: Exclude<TimeRange, 'custom'>
): Array<{ label: string; inbound: number; outbound: number }> {
  const ls = labels(range)
  const base = range === 'today' ? 26 : range === '7d' ? 120 : 110
  return ls.map((label, i) => ({
    label,
    inbound: wave(i, base, base / 3),
    outbound: wave(i + 2, Math.round(base * 0.85), base / 4),
  }))
}

function execFor(
  range: Exclude<TimeRange, 'custom'>
): Array<{ label: string; completed: number; failed: number }> {
  const ls = labels(range)
  const base = range === 'today' ? 6 : range === '7d' ? 18 : 16
  return ls.map((label, i) => ({
    label,
    completed: wave(i + 1, base, base / 3),
    failed: i % 5 === 2 ? 2 : i % 9 === 4 ? 1 : 0,
  }))
}

function dataset(range: Exclude<TimeRange, 'custom'>): RangeDataset {
  const msgs = messagesFor(range)
  const exec = execFor(range)
  const totalIn = msgs.reduce((s, p) => s + p.inbound, 0)
  const totalOut = msgs.reduce((s, p) => s + p.outbound, 0)
  const completed = exec.reduce((s, p) => s + p.completed, 0)
  const failed = exec.reduce((s, p) => s + p.failed, 0)
  const scale = range === 'today' ? 'today' : range === '7d' ? 'vs prior 7d' : 'vs prior 30d'
  return {
    kpis: [
      {
        id: 'messages',
        label: 'Messages',
        value: (totalIn + totalOut).toLocaleString(),
        delta: '+8.2%',
        direction: 'up',
        hint: scale,
        to: '/analytics?view=messaging',
        linkLabel: 'Message activity',
      },
      {
        id: 'conversations',
        label: 'Conversations',
        value: range === 'today' ? '96' : range === '7d' ? '512' : '2,140',
        delta: '+4.1%',
        direction: 'up',
        hint: scale,
        to: '/inbox',
        linkLabel: 'Open Inbox',
      },
      {
        id: 'new-leads',
        label: 'New leads',
        value: range === 'today' ? '9' : range === '7d' ? '46' : '188',
        delta: '+12.0%',
        direction: 'up',
        hint: scale,
        to: '/analytics?view=leads',
        linkLabel: 'Lead analytics',
      },
      {
        id: 'qualified',
        label: 'Qualified',
        value: range === 'today' ? '4' : range === '7d' ? '18' : '74',
        delta: '+2.3%',
        direction: 'up',
        hint: scale,
        to: '/contacts?view=pipeline',
        linkLabel: 'Pipeline',
      },
      {
        id: 'ai-calls',
        label: 'AI calls',
        value: range === 'today' ? '118' : range === '7d' ? '623' : '2,510',
        delta: '-1.4%',
        direction: 'down',
        hint: scale,
        to: '/analytics?view=ai',
        linkLabel: 'AI analytics',
      },
      {
        id: 'executions',
        label: 'Workflow runs',
        value: String(completed + failed),
        delta: failed > completed * 0.1 ? '+3 failed' : '+6.0%',
        direction: failed > completed * 0.1 ? 'down' : 'up',
        hint: scale,
        to: '/analytics?view=automation',
        linkLabel: 'Automation analytics',
      },
    ],
    messages: msgs,
    funnel: [
      { stage: 'new', count: range === 'today' ? 9 : range === '7d' ? 46 : 188 },
      { stage: 'contacted', count: range === 'today' ? 7 : range === '7d' ? 38 : 151 },
      { stage: 'qualified', count: range === 'today' ? 4 : range === '7d' ? 18 : 74 },
      { stage: 'converted', count: range === 'today' ? 2 : range === '7d' ? 9 : 36 },
      { stage: 'lost', count: range === 'today' ? 1 : range === '7d' ? 6 : 28 },
    ],
    movements: [
      {
        id: 'm1',
        leadId: 'l-maya',
        leadName: 'Maya Rao',
        text: 'contacted → qualified',
        time: '22m ago',
      },
      {
        id: 'm2',
        leadId: 'l-tom',
        leadName: 'Tom Becker',
        text: 'new → contacted',
        time: '1h ago',
      },
      {
        id: 'm3',
        leadId: 'l-grace',
        leadName: 'Grace Lee',
        text: 'qualified → lost',
        time: '1d ago',
      },
      {
        id: 'm4',
        leadId: 'l-priya',
        leadName: 'Priya Nair',
        text: 'contacted → converted',
        time: '3h ago',
      },
    ],
    agents: [
      {
        agentId: 'ag-support',
        agentName: 'Support Copilot',
        calls: range === 'today' ? 84 : range === '7d' ? 412 : 1680,
        tokens: range === 'today' ? 9800 : range === '7d' ? 48210 : 196000,
        cost: range === 'today' ? '$0.78' : range === '7d' ? '$3.86' : '$15.68',
        avgLatency: '1.4s',
        fallbackRate: '2.1%',
      },
      {
        agentId: 'ag-sales',
        agentName: 'Sales Qualifier',
        calls: range === 'today' ? 31 : range === '7d' ? 188 : 760,
        tokens: range === 'today' ? 4100 : range === '7d' ? 22480 : 91000,
        cost: range === 'today' ? '$0.33' : range === '7d' ? '$1.80' : '$7.28',
        avgLatency: '2.6s',
        fallbackRate: '8.4%',
      },
      {
        agentId: 'ag-enterprise',
        agentName: 'Enterprise Desk',
        calls: range === 'today' ? 3 : range === '7d' ? 23 : 96,
        tokens: range === 'today' ? 1400 : range === '7d' ? 11450 : 46000,
        cost: range === 'today' ? '$0.28' : range === '7d' ? '$2.29' : '$9.20',
        avgLatency: '8.0s',
        fallbackRate: '12.0%',
      },
    ],
    aiSeries: msgs.map(p => ({ label: p.label, calls: Math.round(p.inbound * 0.72) })),
    tokenSeries: msgs.map(p => ({ label: p.label, tokens: Math.round(p.inbound * 96) })),
    execSeries: exec,
    topWorkflows: [
      {
        workflowId: 'wf-welcome',
        workflowName: 'Welcome series',
        runs: range === 'today' ? 14 : range === '7d' ? 61 : 250,
        failed: 0,
      },
      {
        workflowId: 'wf-cart',
        workflowName: 'Abandoned cart follow-up',
        runs: range === 'today' ? 6 : range === '7d' ? 34 : 140,
        failed: range === 'today' ? 1 : range === '7d' ? 3 : 9,
      },
      {
        workflowId: 'wf-qualification',
        workflowName: 'Lead qualification',
        runs: range === 'today' ? 5 : range === '7d' ? 28 : 112,
        failed: 0,
      },
      {
        workflowId: 'wf-ai-fallback',
        workflowName: 'AI fallback handler',
        runs: range === 'today' ? 2 : range === '7d' ? 12 : 48,
        failed: range === 'today' ? 0 : range === '7d' ? 1 : 4,
      },
    ],
    channels: [
      {
        platform: 'whatsapp',
        label: 'WhatsApp',
        messages: Math.round((totalIn + totalOut) * 0.52),
        conversations: range === 'today' ? 50 : range === '7d' ? 266 : 1110,
        connected: true,
        channelId: 'whatsapp',
      },
      {
        platform: 'telegram',
        label: 'Telegram',
        messages: Math.round((totalIn + totalOut) * 0.16),
        conversations: range === 'today' ? 14 : range === '7d' ? 82 : 340,
        connected: true,
        channelId: 'telegram',
      },
      {
        platform: 'discord',
        label: 'Discord',
        messages: Math.round((totalIn + totalOut) * 0.12),
        conversations: range === 'today' ? 11 : range === '7d' ? 62 : 258,
        connected: true,
        channelId: 'discord',
      },
      {
        platform: 'messenger',
        label: 'Messenger',
        messages: Math.round((totalIn + totalOut) * 0.1),
        conversations: range === 'today' ? 9 : range === '7d' ? 51 : 214,
        connected: true,
        channelId: 'messenger',
      },
      {
        platform: 'instagram',
        label: 'Instagram',
        messages: Math.round((totalIn + totalOut) * 0.06),
        conversations: range === 'today' ? 6 : range === '7d' ? 30 : 128,
        connected: false,
        channelId: 'instagram',
      },
      {
        platform: 'teams',
        label: 'Teams',
        messages: Math.round((totalIn + totalOut) * 0.03),
        conversations: range === 'today' ? 3 : range === '7d' ? 14 : 60,
        connected: false,
        channelId: 'teams',
      },
      {
        platform: 'twitch',
        label: 'Twitch',
        messages: Math.round((totalIn + totalOut) * 0.01),
        conversations: range === 'today' ? 2 : range === '7d' ? 5 : 22,
        connected: false,
        channelId: 'twitch',
      },
      {
        platform: 'twitter',
        label: 'Twitter/X',
        messages: 0,
        conversations: range === 'today' ? 1 : range === '7d' ? 2 : 8,
        connected: false,
        channelId: 'twitter',
      },
    ],
    usage: {
      messages: totalIn + totalOut,
      tokens: range === 'today' ? 15300 : range === '7d' ? 82140 : 333000,
      calls: range === 'today' ? 118 : range === '7d' ? 623 : 2536,
      cost: range === 'today' ? '$1.39' : range === '7d' ? '$7.95' : '$32.16',
      quotaPct: range === 'today' ? 15 : range === '7d' ? 82 : 100,
    },
  }
}

export const analyticsMock: Record<Exclude<TimeRange, 'custom'>, RangeDataset> = {
  today: dataset('today'),
  '7d': dataset('7d'),
  '30d': dataset('30d'),
}
