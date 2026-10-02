import type { PlatformDef } from './types'

/* Centralized platform metadata. Components read from here — never inline. */

export const PLATFORMS: PlatformDef[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Business messaging via the Evolution API adapter.',
    webhook: '/gateway/whatsapp',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Bot API with long-polling fallback.',
    webhook: '/gateway/telegram',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Guild channels via the gateway WebSocket.',
    webhook: '/gateway/discord',
  },
  {
    id: 'messenger',
    name: 'Facebook Messenger',
    description: 'Page messaging via the Meta Graph API.',
    webhook: '/gateway/meta',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Direct messaging via the Meta Graph API.',
    webhook: '/gateway/meta',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Bot Framework adapter for team channels.',
    webhook: '/api/messages',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    description: 'Chat via EventSub and IRC.',
    webhook: '/gateway/twitch',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'DMs and mentions via OAuth 2.0 API.',
    webhook: '/gateway/twitter',
  },
]

export function platformName(id: string): string {
  return PLATFORMS.find(p => p.id === id)?.name ?? id
}

/* Platform identity palette for Channel Health cards. Soft, premium tints —
   never saturated blocks. Separate systems: brand (purple), platform (here),
   health status (semantic green/amber/red, untouched). */

export interface ChannelTheme {
  accent: string
  background: string
  border: string
  hover: string
  iconBg: string
}

export const CHANNEL_THEMES: Record<string, ChannelTheme> = {
  whatsapp: {
    accent: '#25D366',
    background: '#F0FDF4',
    border: '#BBF7D0',
    hover: '#DCFCE7',
    iconBg: '#DCFCE7',
  },
  instagram: {
    accent: '#A855F7',
    background: '#FAF5FF',
    border: '#E9D5FF',
    hover: '#F3E8FF',
    iconBg: '#F3E8FF',
  },
  telegram: {
    accent: '#229ED9',
    background: '#F0F9FF',
    border: '#BAE6FD',
    hover: '#E0F2FE',
    iconBg: '#E0F2FE',
  },
  messenger: {
    accent: '#22C55E',
    background: '#F0FDF4',
    border: '#BBF7D0',
    hover: '#DCFCE7',
    iconBg: '#DCFCE7',
  },
}

/* Select the visual theme for a platform id. Unknown/future platforms return
   undefined so the card falls back to the purple base styles in CSS. */
export function channelTheme(platform: string): ChannelTheme | undefined {
  return CHANNEL_THEMES[platform]
}
