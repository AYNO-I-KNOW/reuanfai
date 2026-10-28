import { serve } from '@hono/node-server'
import app from './index.js'
import { getAskEnv } from './env.js'
import { warmupEmbeddings } from './kb-clients.js'
import { errLine } from './kb-lib.js'

// /health needs no env; KB vars are only required when /kb/ask is enabled — fail fast then
if (process.env.KB_ASK_ENABLED === 'true') {
  try {
    getAskEnv()
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }
}

// loopback only: the web /api rewrite is the sole caller (ADR-0013)
serve({ fetch: app.fetch, port: 8787, hostname: '127.0.0.1' }, (i) => console.log(`api http://127.0.0.1:${i.port}`))

if (process.env.KB_ASK_ENABLED === 'true') {
  warmupEmbeddings().catch((err) => console.error(`kb warmup failed: ${errLine(err)}`))
}
