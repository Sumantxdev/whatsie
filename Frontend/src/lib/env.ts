import { z } from 'zod'

/* Validated env access — fail fast if misconfigured. */

const envSchema = z.object({
  VITE_API_URL: z.string().default('http://localhost:3000'),
  VITE_SOCKET_URL: z.string().default('http://localhost:3000'),
  VITE_ENV: z.string().default('development'),
})

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  VITE_ENV: import.meta.env.VITE_ENV,
})
