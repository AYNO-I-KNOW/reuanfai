import { Hono } from 'hono'
import { kb } from './kb.js'

// ponytail: skeleton only — routes land per docs/specs/api.md after design review
// No CORS: browsers reach the api only through the web /api rewrite (ADR-0013)
const app = new Hono()
  .get('/health', (c) => c.json({ ok: true }))

// prototype only: no auth middleware yet → /kb/ask stays unmounted unless explicitly enabled
// (kept off the chain so AppType does not expose it)
if (process.env.KB_ASK_ENABLED === 'true') app.route('/kb', kb)

export type AppType = typeof app
export default app
