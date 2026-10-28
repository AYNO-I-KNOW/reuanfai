# ADR-0017: KB ต้นแบบใช้ pdftotext + embedding ในเครื่อง + TokenMe (ไม่ผ่าน AI Gateway)

- สถานะ: Accepted · 2026-10-28 · ตัดสินโดยเจ้าของโปรเจกต์สำหรับ KB ต้นแบบ · ที่มา: `.claude/handoff/kb.md`, SPEC Q28 · supersede เฉพาะข้อ "โมเดลผ่าน AI Gateway" ของ ADR-0009 และบรรทัด AI Gateway ใน `docs/specs/ai.md` **เฉพาะส่วน KB** (ไม่แก้ ADR-0009)

## บริบท
- KB (`kb_sources`, `kb_chunks`, `POST /kb/ask`) ต้องใช้ LLM + embedding ทันทีโดยไม่มีงบ
- ADR-0009 / `ai.md` กำหนดให้เรียกโมเดลผ่าน AI Gateway ด้วย string `"provider/model"` และใช้ zero data retention
- เจ้าของโปรเจกต์ตัดสินใจเลิกใช้ Gemini

## ตัดสินใจ
1. **ถอดข้อความ PDF**: `pdftotext -layout` (poppler) ทีละหน้า → `knowledge/<id>/pNNN.md` · ไม่ใช้ LLM · หน้าที่ไม่มี text layer (สแกน, < 20 ตัวอักษรที่ไม่ใช่ช่องว่าง) ข้ามพร้อม warning และรายงานท้ายการรัน
2. **Embedding ในเครื่อง**: `@huggingface/transformers` + `Xenova/multilingual-e5-base` (768 มิติ, mean pooling, normalize) ผ่าน `AI_EMBEDDING_MODEL` · ใช้ prefix `passage: ` กับเอกสาร และ `query: ` กับคำถาม · ไม่มีข้อมูลออกนอกเครื่อง ต้นทุน $0
3. **แชท `/kb/ask`**: TokenMe (OpenAI-compatible chat.completions) ผ่าน `@ai-sdk/openai-compatible` · env `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` · ไม่พึ่ง `json_schema` response_format: ขอ JSON ใน prompt แล้ว parse ด้วย zod (ลองใหม่ 1 ครั้ง)
4. ใช้ได้กับ KB ต้นแบบเท่านั้น · AI-1/AI-2 ตาม ADR-0009 ยังใช้ AI Gateway ตามเดิม
5. ข้อมูลที่ส่งให้ TokenMe ได้: เอกสารอ้างอิง open license + คำถามจำลองเท่านั้น (ADR-0012)
6. `POST /kb/ask` เป็น public-prototype: mount เมื่อ `KB_ASK_ENABLED=true` เท่านั้น + rate limit จนกว่า `requireRole` จะมี
7. ingest ต้องการเพียง `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (+ `AI_EMBEDDING_MODEL` ถ้าไม่ใช้ค่าเริ่มต้น) · ตัวแปร `AI_API_KEY`, `AI_BASE_URL`/`AI_MODEL` ใช้เฉพาะ `/kb/ask`

## ไม่เปลี่ยน
- ADR-0001 (AI อธิบาย ไม่ตัดสิน, rules engine ไม่แตะ KB), ADR-0004 (เข้า DB ผ่าน api เท่านั้น), ADR-0006, ADR-0012
- ADR-0009 ส่วนอื่น: ตัวเลขคำนวณด้วยโค้ด, ป้าย "สรุปโดย AI"

## ผลที่ตามมา
- สลับผู้ให้บริการแชทด้วยการเปลี่ยน env string อย่างเดียวไม่ได้สำหรับ KB (ต้องแก้ `kb-clients.ts`) · embedding 768 มิติผูกกับ `vector(768)` — เปลี่ยนโมเดล = re-embed ทั้งตาราง
- ต้องมี poppler (`pdftotext`, `pdfinfo`) บนเครื่องที่รัน ingest · ครั้งแรกจะดาวน์โหลดโมเดล embedding (~ร้อย MB) แล้ว cache
- PDF สแกนไม่ถูกถอดข้อความ (ไม่มี OCR) · embedding ตัดที่ 512 token ของโมเดล
- **ยังไม่ทราบว่า TokenMe มี ZDR หรือไม่** ขัด `ai.md` → ห้ามส่งข้อมูลจริง/ข้อมูลสุขภาพของผู้ใช้ (ADR-0012) · ดู SPEC Q28
- ต้อง **revisit ก่อนมีข้อมูลจริง**: ยืนยัน ZDR หรือย้ายไปผู้ให้บริการที่ ZDR/กลับไป AI Gateway และเพิ่ม `requireRole` ให้ `/kb/ask`
- agent ถาม-ตอบฝั่งแม่ยังไม่อยู่ใน scope ADR-0009 → ต้องมี ADR แยก (SPEC Q28)

## Update 2026-10-28
ข้อความตัดสินใจข้างต้นไม่เปลี่ยน — แก้เฉพาะข้อเท็จจริงที่คลาดเคลื่อน: ตอนนี้แชท `/kb/ask` ใช้ Gemini `gemini-3.5-flash-lite` (free tier) ผ่าน endpoint OpenAI-compatible ของ Gemini ด้วย `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL` (TokenMe ยังไม่มี base URL) · เจ้าของโปรเจกต์ยอมรับ Gemini free tier สำหรับต้นแบบ (SPEC Q28) · ข้อ 5 ใช้กับ Gemini เหมือนเดิม และยังต้องมี ZDR ก่อนมีข้อมูลจริง
