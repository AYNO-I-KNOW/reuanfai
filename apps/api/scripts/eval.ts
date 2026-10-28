// usage: pnpm --filter @reuanfai/api eval [--dense]
// retrieval-only eval (no LLM): embed question -> RPC -> group by page (same as /kb/ask) -> hit@5 against knowledge/eval.json
// default = match_kb_chunks_hybrid; --dense = match_kb_chunks
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { getIngestEnv } from '../src/env.js'
import { embedQuestion, getSupabase } from '../src/kb-clients.js'
import { MIN_SIMILARITY, RETRIEVE_CHUNKS, bestSimilarity, extractTerms, groupByPage } from '../src/kb-lib.js'

const TOP_K = 5
const EVAL_FILE = fileURLToPath(new URL('../../../knowledge/eval.json', import.meta.url))

const evalSchema = z.array(
  z.object({
    question: z.string().min(1),
    track: z.enum(['intl', 'thai_trad']).optional(),
    expected: z.array(z.object({ sourceId: z.string(), page: z.number().int() })).min(1),
  }),
)
const rowSchema = z.array(
  z.object({ source_id: z.string(), page: z.number().int(), text: z.string(), similarity: z.number() }),
)

const args = process.argv.slice(2)
const dense = args.includes('--dense')
if (args.some((a) => a !== '--dense')) {
  console.error('usage: eval [--dense]')
  process.exit(1)
}
try {
  getIngestEnv()
} catch (err) {
  console.error((err as Error).message)
  process.exit(1)
}

const cases = evalSchema.parse(JSON.parse(await readFile(EVAL_FILE, 'utf8')))
const supabase = getSupabase()
console.log(`mode: ${dense ? 'dense (match_kb_chunks)' : 'hybrid (match_kb_chunks_hybrid)'}`)

let hits = 0
let minTop1 = Infinity
const belowGate: string[] = []
const bySource = new Map<string, { hit: number; total: number }>()
for (const [i, c] of cases.entries()) {
  const query_embedding = await embedQuestion(c.question)
  const { data, error } = dense
    ? await supabase.rpc('match_kb_chunks', { query_embedding, k: RETRIEVE_CHUNKS, filter_track: c.track ?? null })
    : await supabase.rpc('match_kb_chunks_hybrid', {
        query_embedding,
        terms: extractTerms(c.question),
        k: RETRIEVE_CHUNKS,
        filter_track: c.track ?? null,
      })
  if (error) throw new Error(`rpc failed: ${error.message}`)
  const rows = rowSchema.parse(data ?? [])
  const top1 = bestSimilarity(rows)
  minTop1 = Math.min(minTop1, top1)
  if (top1 < MIN_SIMILARITY) belowGate.push(`${i + 1} (${top1.toFixed(3)}) ${c.question}`)
  const got = groupByPage(rows, TOP_K)
  const rank = got.findIndex((g) => c.expected.some((e) => e.sourceId === g.source_id && e.page === g.page))
  const hit = rank >= 0
  if (hit) hits++
  const source = c.expected[0]!.sourceId
  const stat = bySource.get(source) ?? { hit: 0, total: 0 }
  bySource.set(source, { hit: stat.hit + (hit ? 1 : 0), total: stat.total + 1 })
  const top = got.map((g) => `${g.source_id.split('-')[0]}:${g.page}`).join(' ')
  console.log(`${hit ? 'HIT ' : 'MISS'} ${String(i + 1).padStart(2)} ${c.question}\n       ${hit ? `rank ${rank + 1}` : 'not in top'} | top: ${top}`)
}
console.log('')
for (const [source, s] of bySource) console.log(`${source}: ${s.hit}/${s.total}`)
console.log(`hit@${TOP_K}: ${hits}/${cases.length} (${Math.round((hits / cases.length) * 100)}%)`)
console.log(`min top-1 similarity: ${minTop1.toFixed(3)} (gate MIN_SIMILARITY ${MIN_SIMILARITY})`)
if (belowGate.length) {
  console.warn(`WARN: ${belowGate.length} in-KB case(s) below MIN_SIMILARITY would be answered NOT_FOUND:`)
  for (const b of belowGate) console.warn(`  ${b}`)
}
