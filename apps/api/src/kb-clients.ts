import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { embedMany } from 'ai'
import { z } from 'zod'
import { getAskEnv, getIngestEnv } from './env.js'
import { missingTopicSuggestions } from './kb-lib.js'

// lazy: /health and the rest of the api must work without KB env vars
const SUPABASE_TIMEOUT_MS = 10_000
const createSupabase = () =>
  createClient(getIngestEnv().SUPABASE_URL, getIngestEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(SUPABASE_TIMEOUT_MS)])
            : AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
        }),
    },
  })
let supabaseClient: ReturnType<typeof createSupabase> | undefined
export const getSupabase = () => (supabaseClient ??= createSupabase())

const createProvider = () => {
  const env = getIngestEnv()
  return createOpenAICompatible({ name: 'llm', baseURL: env.AI_BASE_URL, apiKey: env.AI_API_KEY })
}

export const getChatModel = (modelId?: string) => createProvider()(modelId ?? getAskEnv().AI_MODEL)

// kb_chunks.embedding is vector(768); gemini-embedding-2 truncates to `dimensions` and returns it normalized
export const EMBEDDING_DIMS = 768
const EMBED_TIMEOUT_MS = 15_000

// gemini-embedding-2 has no task_type: the task goes into the text (asymmetric retrieval format from the Gemini docs)
const queryText = (value: string) => `task: search result | query: ${value}`
const documentText = (value: string) => `title: none | text: ${value}`

// no SDK retries: a user request must fail fast, and ingest does its own 429 backoff
async function embed(values: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: createProvider().embeddingModel(getIngestEnv().AI_EMBEDDING_MODEL),
    values,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
    providerOptions: { openaiCompatible: { dimensions: EMBEDDING_DIMS } },
  })
  if (embeddings.length !== values.length || embeddings.some((v) => v.length !== EMBEDDING_DIMS)) {
    throw new Error(`embedding shape mismatch: expected ${values.length}x${EMBEDDING_DIMS}, got ${embeddings.length}x${embeddings[0]?.length}`)
  }
  return embeddings
}

export async function embedQuestion(question: string) {
  return (await embed([queryText(question)]))[0]!
}

// one API call: callers keep batches <= 100 (Gemini limit)
export const embedDocuments = (values: string[]) => embed(values.map(documentText))

export const embedQueries = (values: string[]) => embed(values.map(queryText))

export const SUGGESTIONS_FILE = fileURLToPath(new URL('../../../knowledge/suggestions.json', import.meta.url))
// precomputed by scripts/embed-suggestions.ts so a (cold-started) process never spends embedding requests on them
export const SUGGESTIONS_EMBEDDINGS_FILE = fileURLToPath(new URL('../../../knowledge/suggestions.embeddings.json', import.meta.url))
export const suggestionList = z.array(z.string().min(1))
export const suggestionEmbeddings = z.object({
  model: z.string().min(1),
  dims: z.number().int(),
  items: z.array(z.object({ text: z.string().min(1), vec: z.array(z.number()) })),
})
let suggestions: Promise<{ text: string; vec: number[] }[]> | undefined
const loadSuggestions = async () => {
  const texts = suggestionList.parse(JSON.parse(await readFile(SUGGESTIONS_FILE, 'utf8')))
  const missing = missingTopicSuggestions(texts)
  if (missing.length) console.warn(`kb topic suggestions not in suggestions.json: ${missing.join(' | ')}`)
  const file = suggestionEmbeddings.parse(JSON.parse(await readFile(SUGGESTIONS_EMBEDDINGS_FILE, 'utf8')))
  const model = getIngestEnv().AI_EMBEDDING_MODEL
  const stale =
    file.model !== model ||
    file.dims !== EMBEDDING_DIMS ||
    file.items.length !== texts.length ||
    file.items.some((x, i) => x.text !== texts[i] || x.vec.length !== EMBEDDING_DIMS)
  // fail loud instead of silently re-embedding (each text is a metered request)
  if (stale) throw new Error(`suggestions.embeddings.json is stale for ${model}/${EMBEDDING_DIMS} — run: pnpm --filter @reuanfai/api embed-suggestions`)
  return file.items
}
// a rejected load is not memoized, so the next request retries
export const getSuggestions = () =>
  (suggestions ??= loadSuggestions().catch((err) => {
    suggestions = undefined
    throw err
  }))
