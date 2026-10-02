import { env } from './env'

/* Minimal API client seam. No backend endpoints invented.
   Feature code must use this client so auth/workspace/errors stay consistent. */

export interface ApiError {
  message: string
  code?: string
  requestId?: string
  retryable: boolean
  status?: number
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    ...init,
    signal: init?.signal ?? controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  }).catch((err: unknown): never => {
    const error = new Error(err instanceof Error ? err.message : 'Network error') as Error &
      ApiError
    ;(error as ApiError).retryable = true
    throw error
  })
  if (!res.ok) {
    const error = new Error(`Request failed: ${res.status}`) as Error & ApiError
    error.status = res.status
    error.retryable = res.status === 429 || res.status >= 500
    error.requestId = res.headers.get('x-request-id') ?? undefined
    throw error
  }
  return res
}
