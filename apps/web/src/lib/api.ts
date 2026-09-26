import { hc } from 'hono/client'
import type { AppType } from '@reuanfai/api'

// Browser goes through the /api rewrite (same origin, cookie sent automatically).
// Server components call the api directly and must forward the cookie themselves.
const base = typeof window === 'undefined'
  ? process.env.API_ORIGIN ?? 'http://localhost:8787'
  : '/api'

export const api = hc<AppType>(base)
