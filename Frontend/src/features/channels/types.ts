/* Channel contracts. Platforms mirror reference/message.txt adapters
   (Evolution API, tdlib, discord.js, Meta Graph, botbuilder-js, twurple,
   twitter-api-v2). Credential shapes stay generic — no real OAuth/API here. */

export type PlatformId =
  'whatsapp' | 'telegram' | 'discord' | 'messenger' | 'instagram' | 'teams' | 'twitch' | 'twitter'

export type ConnectionState =
  'not-connected' | 'connecting' | 'connected' | 'attention' | 'error' | 'disabled'

export type HealthState = 'healthy' | 'degraded' | 'down' | 'unknown'

export interface HealthCheck {
  id: string
  label: string
  state: HealthState
  detail: string
}

export interface Capability {
  id: string
  label: string
  state: 'supported' | 'limited' | 'unavailable'
}

export type ConfigFieldType = 'text' | 'password' | 'readonly'

export interface ConfigField {
  key: string
  label: string
  type: ConfigFieldType
  value: string
  hint?: string
  required?: boolean
}

export interface ChannelActivity {
  id: string
  kind: 'connected' | 'message-in' | 'message-out' | 'config' | 'disconnected' | 'issue'
  text: string
  time: string
  status: 'ok' | 'warn' | 'error'
}

export interface Channel {
  id: PlatformId
  name: string
  account: string
  status: ConnectionState
  statusDetail: string
  health: HealthState
  checks: HealthCheck[]
  capabilities: Capability[]
  fields: ConfigField[]
  agentId: string | null
  enabled: boolean
  connectedAt: string
  lastActivity: string
  conversations24h: number
  activity: ChannelActivity[]
}

export interface PlatformDef {
  id: PlatformId
  name: string
  description: string
  webhook: string
}
