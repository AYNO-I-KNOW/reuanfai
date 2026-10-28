import { createClient } from '@supabase/supabase-js'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { getAskEnv, getIngestEnv } from './env.js'

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

export const getChatModel = () => {
  const env = getAskEnv()
  return createOpenAICompatible({ name: 'llm', baseURL: env.AI_BASE_URL, apiKey: env.AI_API_KEY })(
    env.AI_MODEL,
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

// first embed pays the model load (~3s); do it at startup so the first user request does not
export const warmupEmbeddings = async () => {
  await embedQuestion('warmup')
}
