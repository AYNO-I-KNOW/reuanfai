# คัดกรองและ onboarding

คุณแม่ใหม่อ่านและให้ความยินยอม ตอบคำถาม 4 ช่วง รอการประมวลผล แล้วเห็น "ผลการประเมิน" รายหัตถการ (ผลตัวอย่าง ไม่ได้คำนวณจากคำตอบ) ก่อนไปจองคิว

## Sub-features

- `consent-gate` ปุ่มหลักเป็น "ไปเลือกความยินยอม" จนกว่าจะติ๊ก "ยินยอมให้ใช้ข้อมูลเพื่อรับบริการ (จำเป็น)" แล้วเปลี่ยนเป็น "ยอมรับและดำเนินการต่อ"
- `stage-forms` 4 ช่วง (ข้อมูลคุณแม่, อาการหลังคลอด, ภาวะสุขภาพ, ข้อควรระวัง) ปุ่ม "ถัดไป"/"ดูผลการประเมิน" กดได้เสมอ; ถ้ายังไม่ครบหรือผิด จะไม่ไปต่อ แสดงข้อความแดงใต้ช่อง (`กรุณา…`, ช่วง 2–4 = "กรุณาตอบข้อนี้", เบอร์ผิด = "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก" ซึ่งขึ้นตอน blur ด้วย) แล้ว focus ช่องแรกที่ผิด
- `processing` หน้า "ระบบกำลังประมวลผล" 6 วินาที
- `results` "ผลการประเมิน" แสดง 6 หัตถการ (ทำได้ / รอการประเมิน / ห้ามหลังคลอด) และปุ่ม "จองคิว" / "กลับสู่หน้าแรก"
- `unsure-not-pass` ตัวเลือก "ไม่แน่ใจ" ต้องไม่ถูกนับเป็นผ่าน (ADR-0005) ยังไม่มี journey

## How to get to it (user POV)

- เปิด `/ruenfai` แล้วเข้า `/ruenfai/onboarding` (ยังไม่พบปุ่มบนหน้าแรกที่พาไปจากการอ่าน source ให้ยืนยันก่อนเขียน journey)
- (dev เท่านั้น) แผง "ทางลัดทดสอบแอปมือถือ" มีลิงก์: "ความยินยอม", "1 · ข้อมูลคุณแม่", "2 · อาการหลังคลอด", "3 · ภาวะสุขภาพ", "4 · ข้อควรระวัง", "กำลังประมวลผล", "ผลการประเมิน", "จองคิว" หรือ URL `?screen=consent|stage-1|stage-2|stage-3|stage-4|processing|results|booking`

## Driving it with drive.mjs

Preconditions:

- `scripts/doctor.sh` ผ่าน, context ใหม่, viewport 390x844
- Journey: `node $S/scripts/drive.mjs onboarding` (ครบ flow จริง ไม่ใช้ `?screen=`: gate, validation ทุกช่วง, ผลการประเมิน, "กลับสู่หน้าแรก" ต้องอยู่หน้าแรก + reload). รันกับ production build (`next build && next start`) ด้วย เพราะบั๊กเด้งกลับ onboarding เกิดเฉพาะตอนมี prefetch

- **ความยินยอม.** `page.goto(url('/ruenfai/onboarding?screen=consent'))` เห็น h1 "เริ่มต้นใช้งานเรือนไฟ" และปุ่ม "ไปเลือกความยินยอม"
- **ติ๊กยินยอม.** `page.getByRole('checkbox', {name: /ยินยอมให้ใช้ข้อมูลเพื่อรับบริการ/}).check()` ปุ่มเปลี่ยนเป็น "ยอมรับและดำเนินการต่อ"
- **เข้าช่วงที่ 1.** `page.getByRole('button', {name: 'ยอมรับและดำเนินการต่อ'}).click()` เห็น `getByRole('progressbar', {name: 'ช่วงที่ 1 จาก 4'})` และข้อความ "1 จาก 4"
- **ถอยกลับ.** `page.getByRole('button', {name: 'กลับไปช่วงก่อนหน้า'}).click()` กลับช่วงก่อนหน้า
- **ประมวลผล (ทางลัด).** `page.goto(url('/ruenfai/onboarding?screen=processing'))` เห็น `getByRole('status')` มี h1 "ระบบกำลังประมวลผล" แล้วหลัง 6 วินาที `getByRole('heading', {name: 'ผลการประเมิน'})` โผล่ (ใช้ `waitFor({timeout: 15000})` ห้ามลด)
- **ผลการประเมิน.** `page.getByRole('heading', {name: 'นวดไทย'})` มีสถานะ "ทำได้", `getByRole('heading', {name: 'ก้อนเส้า'})` มี "ห้ามหลังคลอด"
- **ไปจอง.** `page.getByRole('button', {name: 'จองคิว'}).click()` เห็น h1 "จองคิวรับบริการ" (ต่อด้วย `booking.md`)
- **Proof.** ARIA snapshot + screenshot ของ "ผลการประเมิน" และ storage dump (`reuanfai-mother-profile-v1` ควรมีข้อมูลที่กรอกใน ช่วงที่ 1 ถ้าไปทางจริง ยังไม่ยืนยัน)

## Gotchas

- `?screen=` ใช้ได้เฉพาะ dev (ยกเว้น `booking`) ถ้าใช้ทางลัดต้องรายงานว่าข้ามช่วงคำถามจริง ห้ามนับเป็น verified ของ `stage-forms`
- ช่วงคำถาม 1-4 selector อยู่ใน `journeys/onboarding.mjs`: วันคลอดเป็นปุ่ม + dialog "วันคลอด" (`SheetDate`), วิธีคลอดเป็นปุ่ม + dialog "วิธีคลอด", คำถามเป็น `group` ชื่อ = คำถาม มี radio "มี/ไม่มี/ไม่แน่ใจ"
- `TabMotion` prefetch แท็บเฉพาะเมื่อมี cookie `rf_onboarded` แล้ว (prefetch ก่อนหน้านั้นจะ cache redirect ของ `proxy.ts` ไว้ ทำให้ "กลับสู่หน้าแรก" เด้งกลับ onboarding)
- Processing timer 6 วินาทีตายตัว และผลการประเมินเป็นตัวอย่างคงที่ ไม่เปลี่ยนตามคำตอบ ห้ามเขียน assertion ว่าผลสะท้อนคำตอบ
- เมื่อติ๊กยินยอมแล้วถอนออก หน้าผลลัพธ์ถูกซ่อน (`setReady(false)`)
- หน้านี้ `BottomNav` ถูกซ่อน (`/ruenfai/onboarding*`) อย่ารอ nav
- ข้อความ LINE ห้ามมีข้อมูลสุขภาพ (ADR-0006) แอปไม่เรียก network; `externalRequests` ต้องว่าง
