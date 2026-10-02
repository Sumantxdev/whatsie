/* PII-safe logger. Never log message content, phone, email, keys. */

type Level = 'debug' | 'info' | 'warn' | 'error'

function log(level: Level, message: string, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV || level === 'warn' || level === 'error') {
    console[level](`[whatsie:${level}] ${message}`, context ?? '')
  }
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => log('debug', m, c),
  info: (m: string, c?: Record<string, unknown>) => log('info', m, c),
  warn: (m: string, c?: Record<string, unknown>) => log('warn', m, c),
  error: (m: string, c?: Record<string, unknown>) => log('error', m, c),
}
