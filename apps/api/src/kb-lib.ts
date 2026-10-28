// pure helpers for the KB — no I/O
// ADR-0001: citations are filtered by code, not trusted from the LLM

export type Citation = { sourceId: string; page: number }
export type RetrievedChunk = { source_id: string; page: number; text: string }
export type SourceInfo = { id: string; short: string | null; apa: string; url: string | null; license: string }
export type EnrichedCitation = Citation & { short: string | null; apa: string; url: string | null; license: string }

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
  'ยา', 'มี', 'อะไร', 'ไหน', 'อย่างไร', 'ไหม', 'คือ', 'ของ', 'และ', 'หรือ', 'ที่', 'ใช้', 'ได้', 'ใช้ได้', 'บ้าง', 'ตัว', 'หลังคลอด', 'แม่',
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

// a monograph (one drug) spans several chunks and can run over a page break, but retrieval returns only the chunks that matched
// (e.g. the สรรพคุณ line without ข้อห้ามใช้ below it) → send each retrieved page in full, plus the pages next to the top hits.
// anchors = top NEIGHBOR_ANCHORS pages; neighbors = same source, page-1 / page+1, not already retrieved; total context ≤ k + MAX_NEIGHBOR_PAGES
export const NEIGHBOR_ANCHORS = 2
export const MAX_NEIGHBOR_PAGES = 4

export type PageKey = { source_id: string; page: number }
const pageKey = (p: PageKey) => `${p.source_id}#${p.page}`

export function neighborKeys(pages: RetrievedChunk[]): PageKey[] {
  const have = new Set(pages.map(pageKey))
  const want = new Map<string, PageKey>()
  for (const { source_id, page } of pages.slice(0, NEIGHBOR_ANCHORS)) {
    for (const n of [page - 1, page + 1]) {
      const key = { source_id, page: n }
      if (n >= 1 && !have.has(pageKey(key))) want.set(pageKey(key), key)
    }
  }
  return [...want.values()].slice(0, MAX_NEIGHBOR_PAGES)
}

// every page that goes into the context (retrieved + neighbors) — the pages to read from kb_chunks
export const contextKeys = (pages: RetrievedChunk[]): PageKey[] => [
  ...pages.map(({ source_id, page }) => ({ source_id, page })),
  ...neighborKeys(pages),
]

// rows fetched for contextKeys (may be a superset) → full text per page in chunk_index order; a neighbor goes right
// before (page-1) / after (page+1) its anchor; the context is then ordered by source (first hit) and page. A page with no rows keeps its retrieved text.
export function expandContext(
  pages: RetrievedChunk[],
  rows: (RetrievedChunk & { chunk_index: number })[],
): RetrievedChunk[] {
  const wanted = new Set(contextKeys(pages).map(pageKey))
  const full = new Map<string, RetrievedChunk>()
  for (const r of [...rows].sort((a, b) => a.chunk_index - b.chunk_index)) {
    const key = pageKey(r)
    if (!wanted.has(key)) continue
    const prev = full.get(key)
    full.set(key, prev ? { ...prev, text: `${prev.text}\n\n${r.text}` } : { source_id: r.source_id, page: r.page, text: r.text })
  }
  const placed = new Set(pages.map(pageKey))
  const neighbor = (source_id: string, page: number): RetrievedChunk[] => {
    const key = pageKey({ source_id, page })
    const hit = full.get(key)
    if (!hit || placed.has(key)) return []
    placed.add(key)
    return [hit]
  }
  const ordered = pages.flatMap((p, i) => {
    const self = full.get(pageKey(p)) ?? p
    return i < NEIGHBOR_ANCHORS ? [...neighbor(p.source_id, p.page - 1), self, ...neighbor(p.source_id, p.page + 1)] : [self]
  })
  // consecutive pages of one source sit together (a monograph continues on the next page); sources keep their first-hit order
  const sourceOrder = new Map<string, number>()
  for (const p of ordered) if (!sourceOrder.has(p.source_id)) sourceOrder.set(p.source_id, sourceOrder.size)
  return ordered.sort((a, b) => sourceOrder.get(a.source_id)! - sourceOrder.get(b.source_id)! || a.page - b.page)
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
    return s ? [{ ...c, short: s.short, apa: s.apa, url: s.url, license: s.license }] : []
  })
}

// in-memory sliding-window limiter; one process only (prototype — move to shared store with requireRole)
// keys are capped (oldest-first eviction, like createAnswerCache) so a flood of distinct keys cannot grow the map
export const MAX_LIMITER_KEYS = 10_000

export function createRateLimiter(
  rules: { windowMs: number; max: number }[],
  { maxKeys = MAX_LIMITER_KEYS, now = Date.now }: { maxKeys?: number; now?: () => number } = {},
) {
  const hits = new Map<string, number[]>()
  const longest = Math.max(...rules.map((r) => r.windowMs))
  return (key: string): boolean => {
    const t = now()
    const recent = (hits.get(key) ?? []).filter((x) => t - x < longest)
    const allowed = rules.every((r) => recent.filter((x) => t - x < r.windowMs).length < r.max)
    if (allowed) recent.push(t)
    hits.delete(key)
    hits.set(key, recent)
    if (hits.size > maxKeys) hits.delete(hits.keys().next().value!)
    return allowed
  }
}

// Thai PDFs often encode ำ as ํ (+ tone mark) + า → ILIKE on "คำ"/"น้ำ" misses "คํา"/"นํ้า"; fold both stored text and questions
export const foldThai = (text: string): string => text.replace(/ํ([่-๋]?)า/g, '$1ำ').normalize('NFC')

// flash-lite still prints fields the source marks "-" despite the prompt → drop "- หัวข้อ: -" lines in code
export const dropEmptyFields = (answer: string): string =>
  answer
    .split('\n')
    .filter((line) => !/^\s*-\s*[^:\n]+:\s*-?\s*$/.test(line))
    .join('\n')
    .trim()

export const normalizeQuestion = (q: string): string => foldThai(q).trim().replace(/\s+/g, ' ').toLowerCase()

// "did you mean" for NOT_FOUND: closest known-answerable questions. Vectors are normalized → dot product = cosine.
// the user's own question (or a near-duplicate) is skipped — suggesting what they just typed is a dead end
export const SUGGESTION_DUP_SIMILARITY = 0.98

export function nearestSuggestions(
  queryVec: number[],
  items: { text: string; vec: number[] }[],
  question: string,
  n = 2,
): string[] {
  const asked = normalizeQuestion(question)
  return items
    .filter((x) => normalizeQuestion(x.text) !== asked)
    .map((x) => ({ text: x.text, score: x.vec.reduce((sum, v, i) => sum + v * queryVec[i]!, 0) }))
    .filter((x) => x.score < SUGGESTION_DUP_SIMILARITY)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.text)
}

// red-flag routing: NOT a diagnosis — pure keyword match on the documented referral criteria only
// (rules.md A1–A6, manual p.79: fever, chills/infection, infected wound, abnormal lochia, heavy bleeding, breast abscess).
// Symptom phrasing only ("มีไข้", "เป็นไข้", "ไข้สูง", "ตัวร้อน"), never bare "ไข้", so drug-info questions ("ยาแก้ไข้") fall through to RAG.
const RED_FLAG_PATTERNS = [
  /มีไข้|เป็นไข้|ไข้สูง|ตัวร้อน/,
  /หนาวสั่น/,
  /แผล(บวม|แดง|อักเสบ)|(มี|เป็น)หนอง/,
  /น้ำคาวปลา(มีกลิ่น|เหม็น|ผิดปกติ)/,
  /เลือดออกมาก|ตกเลือด/,
  /เป็นฝี|ฝีที่เต้านม|เต้านม.*บวมแดง|ก้อนบวมแดง/,
]

export const isRedFlag = (question: string): boolean => RED_FLAG_PATTERNS.some((re) => re.test(foldThai(question)))

// whole-message match only: "สวัสดี ยาประสะไพลคืออะไร" is a real question, not smalltalk
const POLITE = '(ครับ|ค่ะ|คะ|จ้า|นะ|มาก)*[!?.\\s]*$'
const SMALLTALK_INTRO = new RegExp(`^(สวัสดี|หวัดดี|ดีจ้า|hi|hello|(คุณ|เธอ)?(ทำ|ช่วย)อะไรได้บ้าง|(คุณ|เธอ)(คือ|เป็น)ใคร)${POLITE}`, 'i')
const SMALLTALK_THANKS = new RegExp(`^(ขอบคุณ|ขอบใจ|บาย|ลาก่อน|thanks?|bye)${POLITE}`, 'i')

export const smalltalkKind = (question: string): 'intro' | 'thanks' | null => {
  const q = foldThai(question).trim()
  return SMALLTALK_INTRO.test(q) ? 'intro' : SMALLTALK_THANKS.test(q) ? 'thanks' : null
}

// legacy conversation-opener texts (ADR-0016 quick prompts) → canned reply + known-answerable suggestions, no embed/LLM.
// chat chips (apps/web/src/app/ruenfai/chat-topics.ts, ADR-0019) now send verified suggestions.json queries and do NOT need an entry here;
// these keys only keep old openers answered if they still arrive as a message (old ?question= links/bookmarks) — no web code sends them anymore, so no sync needed
// suggestions MUST be entries of knowledge/suggestions.json (checked at load: missingTopicSuggestions); omitted = 3 spread suggestions
export type TopicReply = { reply: string; suggestions?: string[]; emergency?: true }

const NO_CONTENT: TopicReply = {
  reply: 'เรื่องนี้ยังไม่มีในเอกสารที่ผู้ช่วยใช้อ้างอิงค่ะ แนะนำปรึกษาหน่วยบริการได้เลยนะคะ ระหว่างนี้ถามเรื่องเหล่านี้ได้ค่ะ',
}
const CARE_ASK = 'เรื่องการดูแลหลังคลอดที่ถามได้ เช่น'
const WOUND_ASK = 'เรื่องการดูแลแผลที่ถามได้ เช่น'
const POSTNATAL_CONTACTS = 'How many postnatal contacts does WHO recommend?'
const DEPRESSION_SCREENING = 'How should postpartum depression be screened?'
const IRON_FOLIC = 'How long should postpartum women take oral iron and folic acid?'
const BREASTFEEDING: TopicReply = {
  reply: 'เรื่องการให้นมที่ถามได้ เช่น',
  suggestions: ['How long should exclusive breastfeeding last according to WHO?', 'ยาปลูกไฟธาตุช่วยบำรุงน้ำนมได้ไหม'],
}

const TOPIC_REPLIES: Record<string, TopicReply> = {
  'มีเรื่องยาอยากถาม?': {
    reply: 'ถามเรื่องยาสมุนไพรหลังคลอดได้เลยค่ะ เช่น',
    suggestions: ['ยาประสะไพลใช้ทำอะไร', 'ยาสตรีหลังคลอดต้มกินอย่างไร กี่วัน', 'ยาบำรุงโลหิตใช้ทำอะไร'],
  },
  'เริ่มดูแลหลังคลอดอย่างไร?': {
    reply: CARE_ASK,
    suggestions: ['การนวดหลังคลอดทำได้เมื่อไหร่', 'ผ่าคลอดแล้วทำทับหม้อเกลือได้หลังกี่วัน', POSTNATAL_CONTACTS],
  },
  'ดูแลแผลช่วงแรกอย่างไร?': {
    reply: WOUND_ASK,
    suggestions: [
      'What is the first-line analgesic for postpartum perineal pain?',
      'Is routine antibiotic prophylaxis recommended after uncomplicated vaginal birth?',
      'ผ่าคลอดแล้วทำทับหม้อเกลือได้หลังกี่วัน',
    ],
  },
  'ดูแลแผลผ่าคลอดอย่างไร?': {
    reply: WOUND_ASK,
    suggestions: [
      'ผ่าคลอดแล้วทำทับหม้อเกลือได้หลังกี่วัน',
      'หญิงผ่าคลอดกินยาสตรีหลังคลอดได้ไหม',
      'What is the first-line analgesic for postpartum perineal pain?',
    ],
  },
  'น้ำคาวปลาอยากถามไหม?': {
    reply: 'ถ้าน้ำคาวปลามีกลิ่นผิดปกติหรือเลือดออกมาก กดติดต่อด่วนได้เลยค่ะ ส่วนเรื่องยาที่ถามได้ เช่น',
    suggestions: ['ยาประสะไพลใช้ทำอะไร', 'ยาสตรีหลังคลอดต้มกินอย่างไร กี่วัน'],
    emergency: true,
  },
  'ให้นมช่วงแรกอย่างไร?': BREASTFEEDING,
  'คัดตึงเต้านมทำอย่างไร?': BREASTFEEDING,
  'เตรียมตรวจหลังคลอดไหม?': {
    reply: 'เรื่องการตรวจหลังคลอดที่ถามได้ เช่น',
    suggestions: [POSTNATAL_CONTACTS, IRON_FOLIC],
  },
  'เตรียมตัวไปตามนัดไหม?': {
    reply: 'เรื่องการตรวจหลังคลอดที่ถามได้ เช่น',
    suggestions: [POSTNATAL_CONTACTS, DEPRESSION_SCREENING],
  },
  'วันนี้รู้สึกอย่างไร?': {
    reply: 'เล่าให้ฟังได้นะคะ ถ้ามีอาการไม่สบาย เช่น มีไข้หรือเลือดออกมาก กดติดต่อด่วนได้เลยค่ะ',
    suggestions: [DEPRESSION_SCREENING],
    emergency: true,
  },
  'เหนื่อยง่าย พักอย่างไร?': {
    reply: 'เรื่องการพักยังไม่มีในเอกสารค่ะ แต่เรื่องธาตุเหล็กและยาบำรุงโลหิตถามได้ เช่น',
    suggestions: [IRON_FOLIC, 'ยาบำรุงโลหิตใช้ทำอะไร'],
  },
  'พักช่วงลูกหลับอย่างไร?': NO_CONTENT,
  'จัดเวลาพักอย่างไรดี?': NO_CONTENT,
  'กลับมาขยับตัวอย่างไร?': NO_CONTENT,
  'กลับไปทำงาน เตรียมอะไร?': NO_CONTENT,
  'ปั๊มนมระหว่างวันอย่างไร?': NO_CONTENT,
  'หาเวลาดูแลตัวเองไหม?': NO_CONTENT,
}

// whole-message match, '?' optional (chips are sent as typed/tapped)
const topicKey = (text: string): string => normalizeQuestion(text).replace(/[?？]+$/, '').trim()
const TOPICS = new Map(Object.entries(TOPIC_REPLIES).map(([chip, topic]) => [topicKey(chip), topic]))

export const topicReply = (question: string): TopicReply | null => TOPICS.get(topicKey(question)) ?? null

// drift guard: topic suggestions that are not (or no longer) in suggestions.json
export const missingTopicSuggestions = (known: string[]): string[] => {
  const ok = new Set(known)
  return [...new Set(Object.values(TOPIC_REPLIES).flatMap((t) => t.suggestions ?? []))].filter((x) => !ok.has(x))
}

// deterministic spread over the list (not just the first n, which are all drug questions)
export const spreadSuggestions = (items: string[], n = 3): string[] =>
  items.length <= n ? items : Array.from({ length: n }, (_, i) => items[Math.floor((i * items.length) / n)]!)

export const answerCacheKey = (question: string, track: string | undefined, k: number, model: string): string =>
  `${normalizeQuestion(question)}|${track ?? ''}|${k}|${model}`

// in-memory LRU with TTL (Map keeps insertion order → first key is least recently used); one process only
export function createAnswerCache<V>({
  max,
  ttlMs,
  now = Date.now,
}: {
  max: number
  ttlMs: number // default; set() may override per entry
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
    set(key: string, value: V, entryTtlMs: number = ttlMs): void {
      entries.delete(key)
      entries.set(key, { value, expires: now() + entryTtlMs })
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
