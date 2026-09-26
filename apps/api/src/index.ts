import { Hono } from 'hono'

// ponytail: skeleton only — routes land per docs/specs/api.md after design review
// No CORS: browsers reach the api only through the web /api rewrite (ADR-0013)
const app = new Hono()
  .get('/health', (c) => c.json({ ok: true }))

export type AppType = typeof app
export default app
