# AI spec — AI-1, AI-2

> ADR-0001 (AI ห้ามตัดสิน) · ADR-0009 (scope) · ที่มา Concept v2 §3.2–3.3, UX D7, P8, D6

## Runtime
- AI SDK 7 + AI Gateway, `model = process.env.AI_MODEL` (string `"provider/model"`)
- structured output ด้วย zod schema → validate ไม่ผ่าน = ทิ้ง ไม่บันทึก
- ตัวเลขทุกตัวคำนวณด้วย SQL/โค้ด แล้วส่งเข้า prompt เป็น input LLM **ห้ามคำนวณตัวเลข**
- บันทึก `model` + วันที่ ทุก output
- ใช้ zero data retention

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
- ห้ามจัดอันดับแพทย์รายคน ห้ามให้คะแนนรายคน
- UI ต้องมีป้าย "สรุปโดย AI"

## Guardrails ที่ต้องมี test
- prompt ของ AI-1 ไม่มี field ข้อมูลรายคน (test ตรวจ payload)
- scrub ลบเบอร์ไทย `0\d{8,9}` และเลขบัตร 13 หลักออก
- ข้อความ note ของ `unsure` ไม่ถูกส่งไป AI ไม่ว่าทางไหน (test ตรวจ payload)
