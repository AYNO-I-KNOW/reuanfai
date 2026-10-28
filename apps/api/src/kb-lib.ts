// pure helpers for the KB — no I/O
// ADR-0001: citations are filtered by code, not trusted from the LLM

export type Citation = { sourceId: string; page: number }
export type RetrievedChunk = { source_id: string; page: number; text: string }
export type SourceInfo = { id: string; apa: string; url: string | null; license: string }
export type EnrichedCitation = Citation & { apa: string; url: string | null; license: string }

// ~500 tokens ≈ 1200 chars for Thai; page boundary is kept by chunking per page
export const CHUNK_MAX_CHARS = 1200

const words = new Intl.Segmenter('th', { granularity: 'word' })
const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' })

// pack word segments (Thai has no spaces) up to maxChars
function packSegments(text: string, segmenter: Intl.Segmenter, maxChars: number): string[] {
  const parts: string[] = []
  let cur = ''
  for (const { segment } of segmenter.segment(text)) {
    if (cur && cur.length + segment.length > maxChars) {
      parts.push(cur)
      cur = ''
    }
    cur += segment
  }
  if (cur) parts.push(cur)
  return parts
}

function splitLong(text: string, maxChars: number): string[] {
  return packSegments(text, words, maxChars).flatMap((part) =>
    // a single "word" over the limit: cut on grapheme boundaries so no surrogate pair/combining mark is split
    // (one grapheme longer than maxChars stays whole rather than being broken)
    part.length > maxChars ? packSegments(part, graphemes, maxChars) : [part],
  )
}

export function chunkPage(markdown: string, maxChars = CHUNK_MAX_CHARS): string[] {
  if (!(maxChars > 0)) throw new RangeError(`maxChars must be > 0, got ${maxChars}`)
  const chunks: string[] = []
  let cur = ''
  const flush = () => {
    if (cur.trim()) chunks.push(cur.trim())
    cur = ''
  }
  for (const para of markdown.split(/\n\s*\n/)) {
    for (const part of para.length > maxChars ? splitLong(para, maxChars) : [para]) {
      if (cur && cur.length + part.length + 2 > maxChars) flush()
      cur += (cur ? '\n\n' : '') + part
    }
  }
  flush()
  return chunks
}

const STOPWORDS = new Set([
  'ยา', 'มี', 'อะไร', 'ไหน', 'อย่างไร', 'ไหม', 'คือ', 'ของ', 'และ', 'หรือ', 'ที่', 'ใช้', 'ได้', 'ตัว', 'หลังคลอด', 'แม่',
  'the', 'a', 'an', 'of', 'and', 'or', 'for', 'to', 'in', 'on', 'with', 'what', 'how', 'is', 'are', 'does', 'do', 'should',
])
// Thai stopwords this long are cut out of the raw text first: the segmenter can split them mid-word
// ("ยาสตรีหลังคลอด" → "หลังค"+"ลอด"), so a per-segment stoplist would miss them
const MIN_STRIP_CHARS = 4
const MAX_TERMS = 8
const MIN_TERM_CHARS = 2
const THAI = /\p{Script=Thai}/u

// keyword side of hybrid retrieval. Thai has no spaces, so the segmenter may split a drug name
// ("ประสะ"+"ไพล") → also emit the longest run of consecutive non-stop Thai segments joined ("ประสะไพล")
export function extractTerms(question: string): string[] {
  let text = question.toLowerCase()
  for (const w of STOPWORDS) if (THAI.test(w) && [...w].length >= MIN_STRIP_CHARS) text = text.replaceAll(w, ' ')
  const terms = new Set<string>()
  let run: string[] = []
  let longest: string[] = []
  const flush = () => {
    if (run.length > longest.length) longest = run
    run = []
  }
  for (const { segment, isWordLike } of words.segment(text)) {
    if (!isWordLike || STOPWORDS.has(segment)) {
      flush()
      continue
    }
    if (THAI.test(segment)) run.push(segment)
    else flush()
    if ([...segment].length >= MIN_TERM_CHARS) terms.add(segment)
  }
  flush()
  const joined = longest.join('')
  const ordered = longest.length > 1 ? [joined, ...terms] : [...terms]
  return [...new Set(ordered)].slice(0, MAX_TERMS)
}

// RPC returns chunks; several from one page waste top-k slots → merge them (rank order kept) and keep k pages
export const RETRIEVE_CHUNKS = 20

export function groupByPage<T extends RetrievedChunk>(chunks: T[], k: number): RetrievedChunk[] {
  const pages = new Map<string, RetrievedChunk>()
  for (const c of chunks) {
    const key = `${c.source_id}#${c.page}`
    const prev = pages.get(key)
    if (prev) pages.set(key, { ...prev, text: `${prev.text}\n\n${c.text}` })
    else if (pages.size < k) pages.set(key, { source_id: c.source_id, page: c.page, text: c.text })
  }
  return [...pages.values()]
}

// relevance gate: hybrid rows carry dense similarity (1 - cosine), so the best one says how close the KB is to the question.
// Calibrated on e5 + eval.json: in-KB questions top-1 min 0.836; off-topic below the bar: nuclear bomb 0.808, bitcoin 0.797,
// football 0.748, python code 0.811, car engine 0.800. Some off-topic still pass (tom yum 0.850, weather 0.838) —
// the LLM NOT_FOUND answer + citation filter catch those. Re-calibrate if the embedding model or KB changes.
export const MIN_SIMILARITY = 0.82

export const bestSimilarity = (rows: { similarity: number }[]): number =>
  rows.reduce((best, r) => Math.max(best, r.similarity), -Infinity)

// only checks that (sourceId, page) was among the retrieved chunks — it does NOT verify the answer text is supported by them
export function filterCitations(citations: Citation[], chunks: RetrievedChunk[]): Citation[] {
  const valid = new Set(chunks.map((c) => `${c.source_id}#${c.page}`))
  const seen = new Set<string>()
  return citations.filter((c) => {
    const key = `${c.sourceId}#${c.page}`
    if (!valid.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function enrichCitations(citations: Citation[], sources: SourceInfo[]): EnrichedCitation[] {
  const byId = new Map(sources.map((s) => [s.id, s]))
  return citations.flatMap((c) => {
    const s = byId.get(c.sourceId)
    return s ? [{ ...c, apa: s.apa, url: s.url, license: s.license }] : []
  })
}

// in-memory sliding-window limiter; one process only (prototype — move to shared store with requireRole)
export function createRateLimiter(rules: { windowMs: number; max: number }[], now: () => number = Date.now) {
  const hits = new Map<string, number[]>()
  const longest = Math.max(...rules.map((r) => r.windowMs))
  return (key: string): boolean => {
    const t = now()
    if (hits.size > 10_000) {
      for (const [k, ts] of hits) if (t - ts[ts.length - 1]! >= longest) hits.delete(k)
    }
    const recent = (hits.get(key) ?? []).filter((x) => t - x < longest)
    const allowed = rules.every((r) => recent.filter((x) => t - x < r.windowMs).length < r.max)
    if (allowed) recent.push(t)
    hits.set(key, recent)
    return allowed
  }
}

export const normalizeQuestion = (q: string): string => q.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()

export const answerCacheKey = (question: string, track: string | undefined, k: number): string =>
  `${normalizeQuestion(question)}|${track ?? ''}|${k}`

// in-memory LRU with TTL (Map keeps insertion order → first key is least recently used); one process only
export function createAnswerCache<V>({
  max,
  ttlMs,
  now = Date.now,
}: {
  max: number
  ttlMs: number
  now?: () => number
}) {
  const entries = new Map<string, { value: V; expires: number }>()
  return {
    get(key: string): V | undefined {
      const entry = entries.get(key)
      if (!entry) return undefined
      entries.delete(key)
      if (entry.expires <= now()) return undefined
      entries.set(key, entry)
      return entry.value
    },
    set(key: string, value: V): void {
      entries.delete(key)
      entries.set(key, { value, expires: now() + ttlMs })
      if (entries.size > max) entries.delete(entries.keys().next().value!)
    },
  }
}

// log `name: message` only — never the question, prompt or full error object
export function errLine(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const { name, message } = err as { name?: unknown; message: unknown }
    return `${typeof name === 'string' ? name : 'Error'}: ${String(message)}`
  }
  return 'unknown error'
}
