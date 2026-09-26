import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ponytail: skeleton only — routes land per docs/specs/api.md after design review
const app = new Hono()
  .use('*', cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' }))
  .get('/health', (c) => c.json({ ok: true }))

export type AppType = typeof app
export default app
