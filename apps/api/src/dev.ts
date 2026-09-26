import { serve } from '@hono/node-server'
import app from './index.js'

serve({ fetch: app.fetch, port: 8787 }, (i) => console.log(`api http://localhost:${i.port}`))
