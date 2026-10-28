import { createClient } from '@supabase/supabase-js'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { pipeline } from '@huggingface/transformers'
import { getAskEnv, getIngestEnv } from './env.js'

// lazy: /health and the rest of the api must work without KB env vars
const createSupabase = () =>
  createClient(getIngestEnv().SUPABASE_URL, getIngestEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
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
const loadExtractor = () => pipeline('feature-extraction', getIngestEnv().AI_EMBEDDING_MODEL)
const getExtractor = () => (extractor ??= loadExtractor())

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
