# ADR-0021: แชท KB ลองใหม่เมื่อ LLM ล้มชั่วคราว + TokenMe เป็นโมเดลสำรอง

- สถานะ: Accepted · 2026-10-30 · เจ้าของโปรเจกต์สั่ง · supersede เฉพาะ **ข้อ 7 (LLM fallback)** ของ ADR-0018 (ไม่แก้ ADR-0018)

## บริบท
- 2026-10-30 วัด Gemini free tier `gemini-3.1-flash-lite`: chat ตอบ 503 หรือค้าง 20–50% ของครั้ง (ทั้ง endpoint OpenAI-compat และ native) · embedding 10/10
- ADR-0018 ข้อ 7 สลับโมเดลเฉพาะตอน 429 และต้องเป็น base URL/key เดียวกัน → 503/timeout ไม่มีทางรอด
- TokenMe (`https://api.tokenme.limited/api/v1`, OpenAI-compatible, ADR-0017) ทดสอบ 36 ครั้งไม่เจอ 503 · `deepseek-ai/deepseek-v4-flash-0731` + `reasoning_effort: none` ตอบ prompt จริงใน ~3 วิ · ไม่มีโมเดล embedding

## ตัดสินใจ
1. LLM ต่อคำขอเรียกได้สูงสุด 3 ครั้ง ครั้งละ ≤8 วิ ภายในงบ 25 วิ (เว็บตัดที่ 30 วิ) · ลองใหม่เฉพาะ 408/429/5xx/network/timeout/JSON ไม่ผ่าน (คู่มือ troubleshooting ของ Gemini) · backoff 1 วิ → 2 วิ + jitter เมื่อลองซ้ำที่เดิม
2. หลังโมเดลหลักล้มชั่วคราวครั้งแรก ครั้งที่เหลือใช้โมเดลสำรองทันที (ไม่รอ backoff) · env `AI_FALLBACK_MODEL`, `AI_FALLBACK_BASE_URL`, `AI_FALLBACK_API_KEY`, `AI_FALLBACK_REASONING_EFFORT` (ไม่ตั้ง = ใช้ค่าของโมเดลหลัก)
3. ค่าที่ใช้: หลัก Gemini `gemini-3.1-flash-lite` · สำรอง TokenMe `deepseek-ai/deepseek-v4-flash-0731` reasoning `none` · embedding ยังเป็น Gemini (`AI_BASE_URL`/`AI_API_KEY`, ADR-0020)
4. `MAX_OUTPUT_TOKENS` 1200 → 2000 (deepseek ตอบคำถามหลายรายการยาวเกิน 1200)
5. ทุกครั้งที่เรียกนับในงบ LLM ต่อวัน · `model` ใน response = ตัวที่ตอบจริง · คำตอบจากตัวสำรอง cache 60 วิ (กติกาเดิม)

## ไม่เปลี่ยน
- ADR-0018 ข้อ 1–6, ADR-0012 (ส่งได้เฉพาะเอกสาร open license + คำถามจำลอง), ADR-0017, ADR-0020

## ผลที่ตามมา
- คำถามถูกส่งออกไป 2 ผู้ให้บริการ (Gemini + TokenMe) · ZDR ของทั้งคู่ยังไม่ทราบ → SPEC Q28 ยังเปิด
- คำตอบจากสองโมเดลสำนวนไม่เหมือนกัน
- TokenMe อยู่ระหว่างทดลองให้บริการลูกค้าจำกัด · เคยตอบ 404 "Model not found" ชั่วคราว 1 ครั้งระหว่างทดสอบ (4xx ไม่ลองซ้ำ)
