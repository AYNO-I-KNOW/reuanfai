# ชำระเงิน

หลังรับบริการ คุณแม่เปิด "สรุปค่าใช้จ่าย" เลือกวิธีชำระ กดชำระ (จำลอง 900 ms ไม่มีการเรียกเก็บเงินจริง) เห็น "ชำระเงินสำเร็จ" และการ์ดนัดหมายเปลี่ยนจาก "ชำระเงิน" เป็น "เขียนรีวิว"

## Sub-features

- `payment-summary` แสดงค่าบริการ 300 บาท + ยา 2 รายการ (ยาเลือดงาม 80, ยาประสะไพล 120) รวมยอด
- `payment-method` เลือก "QR พร้อมเพย์" (ค่าเริ่มต้น), "บัตรเครดิต / เดบิต", "เงินสดที่เคาน์เตอร์"
- `payment-submit` กดชำระ -> "กำลังดำเนินการ…" -> h1 "ชำระเงินสำเร็จ"
- `payment-persist` ใบเสร็จอยู่ใน sessionStorage `ruenfai-payment-ui-v1` และการ์ดในหน้านัดหมายกลายเป็น "เขียนรีวิว"
- `payment-no-appointment` เข้าโดยไม่มี `?appointment=` แล้วกดชำระ ได้ alert "ไม่พบรายการนัดหมาย กรุณากลับไปเลือกจากหน้านัดหมายอีกครั้ง" (ใช้ `getByRole('alert').filter({hasText: 'ไม่พบรายการนัดหมาย'})` เพราะ Next เพิ่ม role=alert ของตัวเอง)

## How to get to it (user POV)

- หน้า "นัดหมายทั้งหมด" เลือกการ์ดที่มีป้าย "ชำระเงิน" (ข้อมูลตัวอย่าง: การ์ด `a4` นวดแผนไทย "รับบริการแล้ว กรุณาชำระค่าบริการ") ไปที่ `/ruenfai/payment?appointment=a4&service=นวดแผนไทย`
- เปิด URL `/ruenfai/payment?appointment=<id>&service=<ชื่อบริการ>` โดยตรง (ทางลัด รายงานว่าเป็นทางลัด)

## Driving it with drive.mjs

Preconditions:

- `scripts/doctor.sh` ผ่าน, context ใหม่ (sessionStorage ว่าง), viewport 390x844
- ยังไม่มี journey สำหรับ feature นี้ recipe มาจากการอ่าน source ยังไม่ได้รันจริง

- **เปิดหน้านัดหมาย.** `page.goto(url('/ruenfai/appointments'))` เห็นการ์ดที่ชื่อ `/^นวดแผนไทย.*ชำระเงิน$/`
- **เข้าชำระ.** `page.getByRole('button', {name: /^นวดแผนไทย.*ชำระเงิน$/}).click()` เห็น h1 "สรุปค่าใช้จ่าย" และ "ยอดชำระทั้งหมด" ฿500
- **เลือกวิธี.** `page.getByText('บัตรเครดิต / เดบิต', {exact: true}).click()` (คลิก label; `radio.check()` ล้มด้วย "element is not stable") แล้ว `getByRole('radio', {name: 'บัตรเครดิต / เดบิต'})` ต้อง `toBeChecked`/`isChecked()` เห็น notice "รายการสาธิต · ยังไม่มีการเรียกเก็บเงินจริง"
- **ชำระ.** `page.getByRole('button', {name: /^ชำระเงิน/}).click()` ปุ่มเป็น "กำลังดำเนินการ…" แล้วเห็น h1 "ชำระเงินสำเร็จ" (`getByRole('status')`)
- **Side effect.** `page.evaluate(() => JSON.parse(sessionStorage.getItem('ruenfai-payment-ui-v1')))` เป็น array มี `{appointment: 'a4', paidAt: <ISO>}`
- **Second view.** `page.getByRole('link', {name: 'กลับหน้านัดหมาย'}).click()` การ์ด `a4` มีป้าย "เขียนรีวิว" แล้วกดไปที่ `/ruenfai/review?appointment=a4&service=...`

## Gotchas

- ใบเสร็จอยู่ใน sessionStorage ของแท็บ/context เท่านั้น ปิด context แล้วหาย และ `page.goto` ในแท็บเดิมยังอยู่
- ยอดและรายการยาเป็น mock คงที่ ไม่ผูกกับนัดหรือสต็อกจริง
- จำนวนเงินจัดรูปแบบ `th-TH` สกุล THB เช่น `฿500` เปรียบเทียบตามเว็บจริง อย่าสมมติรูปแบบเอง
- กดชำระซ้ำระหว่าง "กำลังดำเนินการ…" ถูกเพิกเฉย ปุ่มและ fieldset ถูก disable
- `?appointment=` ต้องตรง `^[a-zA-Z0-9_-]{1,120}$` มิฉะนั้นถูกมองเป็นไม่มีนัด
- หน้า `/ruenfai/payment*` ซ่อน `BottomNav`
