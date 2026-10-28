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

// log `name: message` only — never the question, prompt or full error object
export function errLine(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const { name, message } = err as { name?: unknown; message: unknown }
    return `${typeof name === 'string' ? name : 'Error'}: ${String(message)}`
  }
  return 'unknown error'
}
