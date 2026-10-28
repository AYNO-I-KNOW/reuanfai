// usage: pnpm --filter @reuanfai/api embed-suggestions
// knowledge/suggestions.json -> knowledge/suggestions.embeddings.json (commit it). Rerun when suggestions.json or the embedding model changes.
import { readFile, writeFile } from 'node:fs/promises'
import { getIngestEnv } from '../src/env.js'
import {
  EMBEDDING_DIMS,
  SUGGESTIONS_EMBEDDINGS_FILE,
  SUGGESTIONS_FILE,
  embedQueries,
  suggestionList,
} from '../src/kb-clients.js'

const DECIMALS = 6

const model = getIngestEnv().AI_EMBEDDING_MODEL
const texts = suggestionList.parse(JSON.parse(await readFile(SUGGESTIONS_FILE, 'utf8')))
const vecs = await embedQueries(texts)
const items = texts.map((text, i) => ({ text, vec: vecs[i]!.map((x) => Number(x.toFixed(DECIMALS))) }))
await writeFile(SUGGESTIONS_EMBEDDINGS_FILE, `${JSON.stringify({ model, dims: EMBEDDING_DIMS, items })}\n`)
console.log(`wrote ${items.length} suggestion embeddings (${model}, ${EMBEDDING_DIMS})`)
