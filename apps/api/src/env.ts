import { z } from 'zod'

// ingest + eval + question embeddings need only these (embeddings use the same OpenAI-compatible endpoint/key as chat)
const baseSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AI_API_KEY: z.string().min(1),
  AI_BASE_URL: z.url(),
  // kb_chunks.embedding is vector(768) — changing the model means re-embedding everything
  AI_EMBEDDING_MODEL: z.string().min(1).default('gemini-embedding-2'),
})

// POST /kb/ask additionally calls the chat model (Gemini now, TokenMe later)
const askSchema = baseSchema.extend({
  AI_MODEL: z.string().min(1),
  // same base URL/key; used once per attempt when AI_MODEL answers HTTP 429
  AI_FALLBACK_MODEL: z.string().min(1).optional(),
  // thinking models (Gemini 3.x) burn maxOutputTokens on reasoning → truncated JSON; 'none' disables it
  AI_REASONING_EFFORT: z.string().min(1).optional(),
})

export type IngestEnv = z.infer<typeof baseSchema>
export type AskEnv = z.infer<typeof askSchema>

function parse<S extends z.ZodType>(schema: S, source: Record<string, string | undefined>): z.infer<S> {
  const parsed = schema.safeParse(source)
  if (parsed.success) return parsed.data
  // keys only — never echo values (secrets)
  const bad = [...new Set(parsed.error.issues.map((i) => i.path.join('.')))].join(', ')
  throw new Error(`invalid/missing env: ${bad} (see .env.example)`)
}

// empty .env.example entries arrive as '' — treat as unset so defaults apply
const clean = (source: NodeJS.ProcessEnv) =>
  Object.fromEntries(Object.entries(source).filter(([, v]) => v !== ''))

export const parseIngestEnv = (source: NodeJS.ProcessEnv = process.env) => parse(baseSchema, clean(source))
export const parseAskEnv = (source: NodeJS.ProcessEnv = process.env) => parse(askSchema, clean(source))

let ingestEnv: IngestEnv | undefined
let askEnv: AskEnv | undefined
export const getIngestEnv = () => (ingestEnv ??= parseIngestEnv())
export const getAskEnv = () => (askEnv ??= parseAskEnv())
