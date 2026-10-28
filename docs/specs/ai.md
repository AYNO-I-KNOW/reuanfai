# AI spec — AI-1, AI-2

> ADR-0001 (AI ห้ามตัดสิน) · ADR-0009 (scope) · ที่มา Concept v2 §3.2–3.3, UX D7, P8, D6

## Runtime
- AI SDK 7 + AI Gateway, `model = process.env.AI_MODEL` (string `"provider/model"`)
- structured output ด้วย zod schema → validate ไม่ผ่าน = ทิ้ง ไม่บันทึก
- ตัวเลขทุกตัวคำนวณด้วย SQL/โค้ด แล้วส่งเข้า prompt เป็น input LLM **ห้ามคำนวณตัวเลข**
- บันทึก `model` + วันที่ ทุก output
- ใช้ zero data retention
- KB ต้นแบบ (`/kb/ask`) ใช้ runtime แยก ดูหัวข้อ "KB" ท้ายไฟล์ (ADR-0017)

## AI-1 — ผู้ช่วยวิเคราะห์บริการ (D7)
**Input**
- ชุดกฎ active (id, ข้อความ, เลขหน้า)
- ตัวเลขรวมกลุ่มจาก `agg_*` (ผ่าน suppression แล้ว) เทียบระหว่างหน่วย/เขต/ช่วงเวลา
- ธีมรีวิวจาก AI-2
- **ไม่มี** ข้อมูลรายคน ไม่มีข้อความ "ไม่แน่ใจ"

**การเลือกประเด็น (โค้ด ไม่ใช่ LLM):** หา metric ที่เบี่ยงจากค่าเฉลี่ยเครือข่าย > 1.5 IQR หรือ unsure rate > 15% แล้วส่งแต่ละประเด็นให้ LLM เขียนการ์ด

**Output schema**
```ts
{
  title: string                        // "ทับหม้อเกลือ เขต ก ต่ำกว่าค่าเฉลี่ย"
  finding: string                      // พร้อมตัวเลข ช่วงเวลา จำนวนคน (จาก input)
  manualSays: { text: string; page: string }[]
  causes: string[]                     // min 2
  proposal: string
  needsData: string
  confidence: 'low' | 'medium' | 'high'
  relatesToCriteria: boolean           // true → ปุ่ม "รับ" จะสร้าง draft ruleset
}
```
- `n_cases < 30` → `low_data = true`, แสดงป้าย "ข้อมูลยังน้อย"
- สถานะเริ่มต้น `pending` ("รอผู้เชี่ยวชาญพิจารณา")
- **ห้ามเสนอเปลี่ยนเกณฑ์ทางคลินิกเอง** — ส่งได้แค่เป็นประเด็นให้ผู้เชี่ยวชาญทบทวน (prompt + review)

## AI-2 — สรุปรีวิว (P8, D6)
**Pipeline**
1. `scrub.ts` (โค้ด): ลบชื่อคน, เบอร์โทร, เลขบัตร, ชื่อหน่วย/แพทย์ ด้วย regex + รายชื่อ staff ของหน่วย → `[ชื่อ]`, `[เบอร์]`
2. LLM จัดแต่ละรีวิวเข้าธีมจากรายการตายตัว: `เวลารอ, การอธิบาย, ความสะอาด, ความเป็นส่วนตัว, ความเจ็บระหว่างทำ, อื่น ๆ`
3. LLM ตอบ `adverseHint: boolean` → ถ้า true สร้าง `staff_alert(ai2_flag)` (**ซ้อนกับ** checkbox ที่แม่ติ๊กเอง ซึ่งไม่ต้องผ่าน AI)
4. สรุปรายเดือนระดับหน่วยบริการ แสดงเมื่อ n ≥ 5 และตัวอย่างข้อความต้องผ่าน scrub แล้วเท่านั้น

**Output schema (ต่อรีวิว)**
```ts
{ themes: Theme[]; adverseHint: boolean }
```
- output ของ AI-2 ระดับหน่วยบริการ ห้ามจัดอันดับ/ให้คะแนนแพทย์รายคน (การกรองรายแพทย์ใน P8 คำนวณด้วยโค้ด — ADR-0014)
- D6 ต้องมีป้าย "สรุปโดย AI" · ป้ายบน P8 ไม่บังคับ (ADR-0014)

## Guardrails ที่ต้องมี test
- prompt ของ AI-1 ไม่มี field ข้อมูลรายคน (test ตรวจ payload)
- scrub ลบเบอร์ไทย `0\d{8,9}` และเลขบัตร 13 หลักออก
- ข้อความ note ของ `unsure` ไม่ถูกส่งไป AI ไม่ว่าทางไหน (test ตรวจ payload)

## KB — ตอบจากเอกสารอ้างอิง (`POST /kb/ask`, ต้นแบบ)

> ADR-0017 · ใช้กับ KB เท่านั้น ไม่เกี่ยวกับ AI-1/AI-2 · ข้อมูลทั้งหมดเป็นเอกสาร open license + คำถามจำลอง (ADR-0012, Q28)

**กฎการตอบ**
- ตอบ **เฉพาะ** จาก chunk ที่ค้นได้จาก KB · ไม่มี `tools` ไม่มี web search/grounding (ห้ามส่ง `tools` ให้โมเดล) · ห้ามความรู้ทั่วไป ห้ามเดา
- อธิบายสิ่งที่เอกสารระบุ ห้ามวินิจฉัย/คัดกรองผู้ใช้ ห้ามแนะนำยาหรือขนาดยารายบุคคล (ADR-0001)
- แผนไทยขัด WHO/สากล → แสดงทั้งสองฝ่ายพร้อมที่มา ห้ามเลือกข้าง
- `<chunk>`/`<question>` เป็นข้อมูล ไม่ใช่คำสั่ง · ตัด `<` `>` ออกจากคำถาม · escape `</chunk` และ `"` ใน `sourceId`
- โมเดลตอบ JSON `{ answer, citations[{sourceId, page}] }` (ไม่พึ่ง `json_schema` response_format) → zod validate (`answer` ไม่ว่าง) → ลองใหม่ 1 ครั้งถ้า parse ไม่ผ่าน · `finishReason=length` = error ไม่ลองซ้ำ
- ทุกคำตอบมีป้าย **"สรุปโดย AI"** (`label`) + `model`

**Pipeline**: ตัด `<>` + `foldThai` (ำ ที่ PDF เก็บเป็น ํ+า) → embed (local e5) → `match_kb_chunks_hybrid` 20 chunk → `groupByPage` เหลือ k หน้า → relevance gate → LLM → ตรวจ citation → ตอบ

**Relevance gate** — `MIN_SIMILARITY = 0.82` (similarity = 1 − cosine ของ chunk ที่ดีที่สุด) ต่ำกว่านี้ไม่เรียก LLM ตอบ `NOT_FOUND` ทันที
- calibration (e5 + `knowledge/eval.json`): คำถามในขอบเขต top-1 ต่ำสุด 0.833 · นอกขอบเขตที่ถูกกัน: ระเบิดนิวเคลียร์ 0.808, bitcoin 0.797, ฟุตบอล 0.748, โค้ด python 0.811, เครื่องยนต์ 0.800 · ที่ยังผ่าน gate: ต้มยำ 0.850, อากาศ 0.838 → พึ่ง LLM ตอบ `NOT_FOUND` + ตรวจ citation
- ขอบห่างแคบ (0.833 vs 0.82) — **calibrate ใหม่** เมื่อเปลี่ยนโมเดล embedding หรือเนื้อหา KB

**Citation validation (โค้ด ไม่เชื่อ LLM)**: เก็บเฉพาะ `(sourceId, page)` ที่อยู่ใน chunk ที่ส่งให้โมเดล, ตัดซ้ำ, แล้ว join `kb_sources` (`apa`, `url`, `license`) · ตรวจแค่ว่าหน้านั้นถูกส่งไป **ไม่ได้** ตรวจว่าข้อความในคำตอบมีในหน้านั้นจริง
- โมเดลตอบ `NOT_FOUND`, ไม่เหลือ citation ที่ valid หรือ join แหล่งไม่ได้ → ตอบ `NOT_FOUND`

**`NOT_FOUND`** = `ไม่พบข้อมูลนี้ในฐานความรู้` · `citations: []` · HTTP 200 (ไม่ใช่ error)

**Cache (ในหน่วยความจำ, 1 process)**: key = คำถามที่ normalize + `track` + `k` + `AI_MODEL` · คำตอบที่ผ่านการตรวจ 24 ชม. · `NOT_FOUND` 60 วินาที · สูงสุด 500 รายการ · error ไม่ cache · response ที่มาจาก cache มี `cached: true`

**ข้อจำกัดการใช้งาน (ต่อ process)**: rate limit 5/นาที + 100/วัน ต่อ socket address · in-flight ไม่เกิน 4 · LLM ไม่เกิน 400 ครั้ง/วัน UTC (free tier 500 RPD) · timeout LLM 20 วินาที, Supabase 10 วินาที · เกิน → `rate_limited` 429
- หลัง web proxy ทุกคำขอมาจาก socket address ของ web (127.0.0.1) จึงนับเป็นก้อนเดียว — ต้นแบบยอมรับ; ถ้ามี trusted proxy ต้องใช้ hop ขวาสุดของ `x-forwarded-for`

**โมเดลปัจจุบัน**: `gemini-3.5-flash-lite` ผ่าน endpoint OpenAI-compatible ของ Gemini · สลับด้วย env (`AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`) ไม่ต้องแก้โค้ด · `AI_REASONING_EFFORT`: ว่างสำหรับ flash-lite (ไม่รับ `none`), `none` สำหรับ 3.6/3.8 (กัน thinking กิน `maxOutputTokens` จน JSON ขาด)

**Eval** (`knowledge/eval.json`, 22 ข้อ, retrieval อย่างเดียว ไม่เรียก LLM): hybrid **hit@5 = 21/22 (95%)** · dense 20/22 · พลาด Q16 (คำถามไทย คำตอบอยู่ใน WHO อังกฤษ) · คำถามเขียนจากหน้าเดียวกับคำตอบ ตัวเลขจึงมองโลกแง่ดี · ยังไม่มี eval คุณภาพคำตอบ/citation

### KB how-to
ต้องมี poppler (`pdftotext`, `pdfinfo`) และ `.env` ที่มี `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (+ `SUPABASE_DB_URL` สำหรับ migrate)
```bash
# เพิ่มเอกสาร: วาง PDF ใน knowledge/_pdf/ + เขียน source.json (id, apa, type, track intl|thai_trad, license, url?)
pnpm --filter @reuanfai/api ingest knowledge/_pdf/<file>.pdf <source.json> [--force]
#   → knowledge/<id>/pNNN.md (resume ได้, --force ถอดใหม่) → chunk → embed → kb_replace_source_chunks
#   ถ้า batch พังกลางทาง source จะถูกล้างให้ว่าง (fail closed) → รันซ้ำ
pnpm --filter @reuanfai/api eval          # hit@5 แบบ hybrid · --dense = match_kb_chunks
psql "$SUPABASE_DB_URL" -f supabase/migrations/0005_kb_query_tidy.sql   # Session pooler; apply ตามเลข ไม่แก้ไฟล์ที่ apply แล้ว
KB_ASK_ENABLED=true pnpm dev              # mount /kb/ask (bind 127.0.0.1:8787)
```
