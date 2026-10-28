// ingest-side embedding for the Gemini free tier (gemini-embedding-2: every text counts as 1 request; 100 RPM / 30K TPM / 1K RPD)
// - sliding 60s windows for items + estimated tokens, 429 backoff using the server's retry hint
// - daily quota hit -> DailyQuotaError; vectors already fetched stay in knowledge/.embed-cache so the next run resumes
import { createHash } from 'node:crypto'
import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { APICallError } from 'ai'
import { getIngestEnv } from '../src/env.js'
import { EMBEDDING_DIMS, embedDocuments } from '../src/kb-clients.js'

const CACHE_DIR = fileURLToPath(new URL('../../../knowledge/.embed-cache/', import.meta.url))
const WINDOW_MS = 60_000
// headroom under 100 RPM / 30K TPM
const MAX_ITEMS_PER_WINDOW = 90
const MAX_TOKENS_PER_WINDOW = 24_000
const MAX_BATCH = 100
// the API reports no usage for this endpoint; Thai measured ~0.45 token/char, 0.5 stays on the safe side
const TOKENS_PER_CHAR = 0.5
const PREFIX_TOKENS = 20
const MAX_RATE_LIMIT_RETRIES = 8
// vectors are unit length → 6 decimals loses nothing that matters for cosine and keeps the cache ~40% smaller
const DECIMALS = 6

export class DailyQuotaError extends Error {}

const estimateTokens = (text: string) => Math.ceil(text.length * TOKENS_PER_CHAR) + PREFIX_TOKENS
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const keyOf = (text: string) => createHash('sha1').update(text).digest('hex')
const round = (v: number[]) => v.map((x) => Number(x.toFixed(DECIMALS)))

const cacheFile = () => `${CACHE_DIR}${getIngestEnv().AI_EMBEDDING_MODEL.replaceAll(/[^\w.-]/g, '_')}-${EMBEDDING_DIMS}.jsonl`

async function loadCache(): Promise<Map<string, number[]>> {
  const cache = new Map<string, number[]>()
  let raw = ''
  try {
    raw = await readFile(cacheFile(), 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  for (const line of raw.split('\n')) {
    if (!line) continue
    try {
      const { k, v } = JSON.parse(line) as { k: string; v: number[] }
      if (v.length === EMBEDDING_DIMS) cache.set(k, v)
    } catch {
      // a crash mid-append leaves one truncated last line; that text is simply embedded again
    }
  }
  return cache
}

// "Please retry in 53.49s." from the 429 body; daily quota ids carry "PerDay"
function rateLimit(err: unknown): { daily: boolean; waitMs: number } | undefined {
  if (!APICallError.isInstance(err) || err.statusCode !== 429) return undefined
  const body = err.responseBody ?? err.message
  const retry = /retry in ([\d.]+)s/i.exec(body)
  return { daily: /PerDay|per day/i.test(body), waitMs: (retry ? Number(retry[1]) : 60) * 1000 + 1000 }
}

// returns one vector per input (same order); duplicates and already-cached texts cost nothing
export async function embedCached(texts: string[]): Promise<number[][]> {
  const cache = await loadCache()
  const todo = [...new Map(texts.filter((t) => !cache.has(keyOf(t))).map((t) => [keyOf(t), t])).values()]
  console.log(`embeddings: ${texts.length - todo.length}/${texts.length} cached, ${todo.length} to fetch`)
  await mkdir(CACHE_DIR, { recursive: true })

  const sent: { at: number; items: number; tokens: number }[] = []
  let rateLimited = 0
  const started = Date.now()
  for (let next = 0; next < todo.length; ) {
    const now = Date.now()
    while (sent.length && now - sent[0]!.at >= WINDOW_MS) sent.shift()
    let items = sent.reduce((n, s) => n + s.items, 0)
    let tokens = sent.reduce((n, s) => n + s.tokens, 0)
    const batch: string[] = []
    let batchTokens = 0
    while (next + batch.length < todo.length && batch.length < MAX_BATCH) {
      const cost = estimateTokens(todo[next + batch.length]!)
      const full = items + 1 > MAX_ITEMS_PER_WINDOW || tokens + cost > MAX_TOKENS_PER_WINDOW
      // an idle window always admits one text, so a single oversized text cannot stall forever
      if (full && (sent.length || batch.length)) break
      batch.push(todo[next + batch.length]!)
      batchTokens += cost
      items++
      tokens += cost
    }
    if (!batch.length) {
      await sleep(sent[0]!.at + WINDOW_MS - now + 250)
      continue
    }

    let vectors: number[][]
    try {
      vectors = await embedDocuments(batch)
    } catch (err) {
      const limit = rateLimit(err)
      if (!limit) throw err
      if (limit.daily) throw new DailyQuotaError(`daily embedding quota reached (${next}/${todo.length} fetched this run)`)
      if (++rateLimited > MAX_RATE_LIMIT_RETRIES) throw new Error(`still rate limited after ${MAX_RATE_LIMIT_RETRIES} retries`, { cause: err })
      console.warn(`429, waiting ${Math.round(limit.waitMs / 1000)}s`)
      await sleep(limit.waitMs)
      continue
    }
    sent.push({ at: Date.now(), items: batch.length, tokens: batchTokens })
    const rounded = vectors.map(round)
    await appendFile(cacheFile(), batch.map((t, i) => `${JSON.stringify({ k: keyOf(t), v: rounded[i] })}\n`).join(''))
    batch.forEach((t, i) => cache.set(keyOf(t), rounded[i]!))
    next += batch.length
    console.log(`embedded ${next}/${todo.length} (~${batchTokens} tokens in last batch, ${Math.round((Date.now() - started) / 1000)}s)`)
  }
  return texts.map((t) => cache.get(keyOf(t))!)
}
