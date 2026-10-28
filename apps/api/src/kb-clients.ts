import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
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

export const getChatModel = (modelId?: string) => {
  const env = getAskEnv()
  return createOpenAICompatible({ name: 'llm', baseURL: env.AI_BASE_URL, apiKey: env.AI_API_KEY })(
    modelId ?? env.AI_MODEL,
  )
}

// kb_chunks.embedding is vector(768); multilingual-e5-base is 768-dim
const EMBEDDING_DIMS = 768
let extractor: ReturnType<typeof loadExtractor> | undefined
// dynamic import: loading onnx at boot would slow /health and the non-KB api
const loadExtractor = async () => {
  const { pipeline } = await import('@huggingface/transformers')
  return pipeline('feature-extraction', getIngestEnv().AI_EMBEDDING_MODEL)
}
// a rejected load is not memoized, so the next request retries
const getExtractor = () =>
  (extractor ??= loadExtractor().catch((err) => {
    extractor = undefined
    throw err
  }))

// e5 needs a prefix: "passage: " for stored text, "query: " for questions
async function embed(prefix: 'passage' | 'query', values: string[]): Promise<number[][]> {
  const output = await (await getExtractor())(values.map((v) => `${prefix}: ${v}`), { pooling: 'mean', normalize: true })
  const vectors = output.tolist() as number[][]
  if (vectors.length !== values.length || vectors.some((v) => v.length !== EMBEDDING_DIMS)) {
    throw new Error(`embedding shape mismatch: expected ${values.length}x${EMBEDDING_DIMS}, got dims [${output.dims}]`)
  }
  return vectors
}

export async function embedQuestion(question: string) {
  return (await embed('query', [question]))[0]!
}

export const embedDocuments = (values: string[]) => embed('passage', values)

const SUGGESTIONS_FILE = fileURLToPath(new URL('../../../knowledge/suggestions.json', import.meta.url))
const suggestionList = z.array(z.string().min(1))
let suggestions: Promise<{ text: string; vec: number[] }[]> | undefined
const loadSuggestions = async () => {
  const texts = suggestionList.parse(JSON.parse(await readFile(SUGGESTIONS_FILE, 'utf8')))
  const missing = missingTopicSuggestions(texts)
  if (missing.length) console.warn(`kb topic suggestions not in suggestions.json: ${missing.join(' | ')}`)
  const vecs = await embed('query', texts)
  return texts.map((text, i) => ({ text, vec: vecs[i]! }))
}
// "query:" prefix on both sides: question-vs-question similarity. A rejected load is not memoized (like getExtractor)
export const getSuggestions = () =>
  (suggestions ??= loadSuggestions().catch((err) => {
    suggestions = undefined
    throw err
  }))

// first embed pays the model load (~3s); do it at startup so the first user request does not
export const warmupEmbeddings = async () => {
  await embedQuestion('warmup')
  await getSuggestions()
}
