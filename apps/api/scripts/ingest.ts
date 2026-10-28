// usage: pnpm --filter @reuanfai/api ingest <pdf> <source.json> [--force]
// PDF -> per-page text via pdftotext (knowledge/<source_id>/pNNN.md, resumable; --force re-extracts) -> chunks -> local embeddings
// -> kb_replace_source_chunks in batches (first batch replaces the source, the rest append)
import { readFile, writeFile, mkdir, readdir, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { getIngestEnv } from '../src/env.js'
import { embedDocuments, getSupabase } from '../src/kb-clients.js'
import { chunkPage } from '../src/kb-lib.js'
import { extractPage, pageCount } from './pdf.js'

const KNOWLEDGE_DIR = fileURLToPath(new URL('../../../knowledge/', import.meta.url))
const EMBED_BATCH = 16
// one jsonb call for a whole source hit the statement timeout
const INSERT_BATCH = 100
// scanned pages have no text layer; no LLM/OCR fallback (prototype)
const MIN_TEXT_CHARS = 20

const sourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/i),
  short: z.string().min(1).nullish(),
  apa: z.string().min(1),
  type: z.string().min(1),
  evidence_level: z.string().nullish(),
  track: z.enum(['intl', 'thai_trad']),
  license: z.string().min(1),
  url: z.url().nullish(),
})

const pageFile = (dir: string, page: number) => `${dir}/p${String(page).padStart(3, '0')}.md`

const fail = (what: string, cause: unknown): never => {
  throw new Error(`${what} failed: ${(cause as { message?: string }).message ?? String(cause)}`, { cause })
}

// tmp + rename so a crash never leaves a truncated page that the resume check would trust
async function writeAtomic(file: string, content: string) {
  const tmp = `${file}.tmp`
  await writeFile(tmp, content)
  await rename(tmp, file)
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const [pdfPath, sourcePath, ...extra] = args.filter((a) => !a.startsWith('--'))
if (!pdfPath || !sourcePath || extra.length || args.some((a) => a.startsWith('--') && a !== '--force')) {
  console.error('usage: ingest <pdf> <source.json> [--force]')
  process.exit(1)
}
try {
  getIngestEnv()
} catch (err) {
  console.error((err as Error).message)
  process.exit(1)
}

const supabase = getSupabase()
const source = sourceSchema.parse(JSON.parse(await readFile(sourcePath, 'utf8')))
const { error: srcError } = await supabase.from('kb_sources').upsert(source, { onConflict: 'id' })
if (srcError) fail('upsert kb_sources', srcError)

const dir = `${KNOWLEDGE_DIR}${source.id}`
await mkdir(dir, { recursive: true })
const total = await pageCount(pdfPath)
const scanned: number[] = []
for (let page = 1; page <= total; page++) {
  const file = pageFile(dir, page)
  // an empty existing file (older runs) counts as missing
  if (!force && existsSync(file) && (await readFile(file, 'utf8')).trim()) continue
  const text = await extractPage(pdfPath, page)
  if (text.replace(/\s/g, '').length < MIN_TEXT_CHARS) {
    console.warn(`warning: page ${page} has no text (scanned?) — skipped`)
    scanned.push(page)
    continue
  }
  await writeAtomic(file, text + '\n')
  console.log(`extracted ${page}/${total}`)
}
if (scanned.length) console.warn(`pages without text (${scanned.length}): ${scanned.join(', ')}`)

const rows: { page: number; chunk_index: number; text: string }[] = []
for (const name of (await readdir(dir)).sort()) {
  const m = /^p(\d+)\.md$/.exec(name)
  const page = m ? Number(m[1]) : 0
  if (page < 1 || page > total) continue // stray files beyond the PDF are ignored
  chunkPage(await readFile(`${dir}/${name}`, 'utf8')).forEach((text, chunk_index) =>
    rows.push({ page, chunk_index, text }),
  )
}
if (!rows.length) throw new Error(`no chunks produced for ${source.id}; refusing to wipe existing rows`)

const vectors: number[][] = []
for (let i = 0; i < rows.length; i += EMBED_BATCH) {
  const batch = rows.slice(i, i + EMBED_BATCH)
  const embeddings = await embedDocuments(batch.map((r) => r.text))
  if (embeddings.length !== batch.length) {
    throw new Error(`embedding count mismatch: got ${embeddings.length}, expected ${batch.length}`)
  }
  vectors.push(...embeddings)
  console.log(`embedded ${vectors.length}/${rows.length}`)
}

// each batch is its own transaction: a failure after the first batch empties the source (fail closed) — rerun the ingest to fix it
// (the first batch always deletes the old rows, so a rerun never duplicates)
for (let i = 0; i < rows.length; i += INSERT_BATCH) {
  const { error } = await supabase.rpc('kb_replace_source_chunks', {
    p_source_id: source.id,
    p_rows: rows.slice(i, i + INSERT_BATCH).map((r, j) => ({ ...r, embedding: JSON.stringify(vectors[i + j]) })),
    p_append: i > 0,
  })
  if (error) {
    // fail closed: after the first delete a partial source would be served as if complete → empty it
    if (i > 0) {
      const { error: clearError } = await supabase.rpc('kb_replace_source_chunks', {
        p_source_id: source.id,
        p_rows: [],
        p_append: false,
      })
      if (clearError) console.error(`could not clear partial ${source.id}: ${clearError.message}`)
    }
    fail(`kb_replace_source_chunks (rows ${i}-${i + INSERT_BATCH})`, error)
  }
  console.log(`inserted ${Math.min(i + INSERT_BATCH, rows.length)}/${rows.length}`)
}
console.log(`replaced ${rows.length} chunks for ${source.id}`)
