# ADR-0020: KB embedding ผ่าน gemini-embedding-2 (768 มิติ) แทน e5 ในเครื่อง

- สถานะ: Accepted · 2026-10-28 · เจ้าของโปรเจกต์อนุมัติ (รวม re-embed KB บน Supabase dev `ztkzibxtdaijkovlmysq` ซึ่งเป็น prototype ไม่ใช่ prod) · supersede เฉพาะ **ข้อ 2 (embedding ในเครื่อง)** และข้อ 7 ของ ADR-0017 (ไม่แก้ ADR-0017)

## บริบท
- `@huggingface/transformers` + `onnxruntime` ใช้ deploy `apps/api` บน Vercel ไม่ได้ (native binary, โหลดโมเดลร้อย MB ต่อ cold start)
- Gemini ใช้อยู่แล้วสำหรับแชท (`AI_API_KEY`, `AI_BASE_URL`) · free tier ของ `gemini-embedding-2`: 100 RPM, 30K TPM, 1K RPD

## ตัดสินใจ
1. Embedding = `gemini-embedding-2` ผ่าน endpoint OpenAI-compatible เดิม (`AI_BASE_URL` + `AI_API_KEY`) ด้วย `embedMany` ของ `ai` + `dimensions: 768` · API ตัดและ normalize ให้เอง → ยังเป็น `vector(768)` ไม่ต้องแก้ schema (ทดสอบแล้วได้เวกเตอร์เดียวกับ REST `batchEmbedContents` ที่ cosine 1.000)
2. ไม่มี `task_type` → ใส่ task ในข้อความตามรูปแบบ asymmetric retrieval ของ Gemini: คำถาม `task: search result | query: {text}` · เอกสาร `title: none | text: {text}` · suggestions (คำถาม↔คำถาม) ใช้รูปแบบคำถามทั้งสองฝั่ง
3. `AI_EMBEDDING_MODEL` default `gemini-embedding-2` · ตัวแปร `AI_API_KEY`/`AI_BASE_URL` ตอนนี้จำเป็นกับ ingest/eval ด้วย
4. ลบ `@huggingface/transformers` และ warmup ของ onnx · เวกเตอร์ของ `suggestions.json` คำนวณล่วงหน้าเก็บใน `knowledge/suggestions.embeddings.json` (commit; key = model + dims + ข้อความ) ด้วย `embed-suggestions` → runtime ไม่ embed (cold start บน Vercel ไม่เสีย 20 request) · ไม่ตรงกัน → ล้มดัง (log, `suggestions: []`) ไม่ re-embed เงียบ ๆ · เส้นทาง red_flag/smalltalk/topic และ answer cache ทำก่อน embed คำถามอยู่แล้ว (0 request)
5. **ทุกข้อความ = 1 request** ในโควตา (batch ได้สูงสุด 100 ข้อความ/call แต่ไม่ลดโควตา; ยืนยันจาก 429 `embed_content_free_tier_requests` และจาก RPD หมดหลัง ~950 chunk) → KB 2,097 chunk ต้อง ≥3 วันบน free tier · ingest จึงมี cache บนดิสก์ (`knowledge/.embed-cache/`, gitignored) + throttle ตามหน้าต่าง 60 วินาที (items/tokens) + backoff 429 · โควตารายวันหมด → ออกด้วย exit 2 โดยไม่แตะ DB · `--embed-only` เติม cache ทุก source ก่อน แล้วค่อย ingest ปกติ (replace DB ครั้งเดียวต่อ source ไม่มี embedding ผสมโมเดล)
6. เปลี่ยนโมเดล embedding = re-embed ทั้งตารางและ calibrate `MIN_SIMILARITY` ใหม่เสมอ

## ผลที่ตามมา
- ข้อความคำถามของผู้ใช้ถูกส่งไป Gemini เพื่อ embed ด้วย (เดิมไม่ออกนอกเครื่อง) → เข้าเงื่อนไข SPEC Q28 เดียวกับแชท: free tier อาจนำข้อมูลไปใช้ต่อ ใช้ได้เฉพาะคำถามจำลอง (ADR-0012) · ต้องยืนยัน ZDR หรือย้ายผู้ให้บริการก่อนมีข้อมูลจริง
- ทุกคำถามที่ถึงขั้น embed = 1 request ใน 1K RPD → production ต้องใช้ tier จ่ายเงิน
- ไม่มีคอลัมน์ระบุโมเดลที่ใช้สร้าง embedding ของ chunk (ไม่ทำ DDL) · ตัวกันความคลาดเคลื่อนเดียวคือเช็กจำนวนมิติ → สลับโมเดลที่ 768 มิติเหมือนกันโดยไม่ re-embed จะไม่ถูกจับ

## ผลวัด (22 ข้อใน `knowledge/eval.json`, KB 2,097 chunk, re-embed 2026-10-28)
- hit@5 hybrid 22/22 (e5: 21/22) · dense 22/22 (e5: 20/22) · Q16 ข้ามภาษาไทย→WHO อังกฤษ ติดแล้ว
- สเกล similarity ต่ำลง: in-KB top-1 ต่ำสุด 0.698 (e5 0.833) · off-topic สูงสุด 0.672 → `MIN_SIMILARITY` 0.82 → **0.68** (รายละเอียดใน `ai.md`)
- re-embed ใช้เวลา ~3 รอบ key เพราะ free tier 1K request/วัน
