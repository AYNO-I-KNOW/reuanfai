# แดชบอร์ดหน่วยบริการ

เจ้าหน้าที่หน่วยบริการใช้ `/clinic` ดูภาพรวมนัดหมาย จัดการนัด ปฏิทินแพทย์ คลังยา และรีวิว (หน้าเดียว สลับ view ด้วย state ไม่มี URL ต่อ view)

## Sub-features

- `clinic-dashboard` view "ภาพรวมหน่วยบริการ" สรุปนัดหมายและภาพรวมที่ควรดู
- `clinic-appointments` view "นัดหมาย" ตาราง ค้นหา ปุ่ม "เพิ่มนัดหมาย"
- `clinic-schedule` view "ปฏิทินแพทย์"
- `clinic-inventory` view "คลังยา" ตารางสต็อก ค้นหาชื่อยา/Lot กรองสถานะ รับยาเข้า ปรับยอด ประวัติการจ่าย
- `clinic-reviews` view "รีวิวหน่วยบริการ"
- `clinic-case` เปิดเคสคุณแม่จากตารางนัด (case / treatment / prescribe)
- `clinic-prescribe-stock` จ่ายยาแล้วสต็อกลด ยังไม่ทำงาน (ดู Gotchas)

## How to get to it (user POV)

- เปิด `/clinic` (หรือ `/provider`) แล้วใช้ nav "เมนูหน่วยบริการ": "ภาพรวม", "นัดหมาย", "ปฏิทินแพทย์", "คลังยา", "รีวิวหน่วยบริการ"
- จาก `/department` กดลิงก์ "ระบบหน่วยบริการ"
- `/login` เป็นหน้าจำลอง; "ออกจากระบบ" พาไป `/login`

## Driving it with drive.mjs

Preconditions:

- `scripts/doctor.sh` ผ่าน, context ใหม่
- journey ต้องตั้ง `export const viewport = {width: 1440, height: 900}`
- ยังไม่มี journey สำหรับ feature นี้ recipe มาจากการอ่าน source ยังไม่ได้รันจริง

- **เปิด.** `page.goto(url('/clinic'))` เห็น h1 "ภาพรวมหน่วยบริการ"
- **ไป คลังยา.** `page.getByRole('navigation', {name: 'เมนูหน่วยบริการ'}).getByRole('button', {name: 'คลังยา'}).click()` h1 เป็น "คลังยา" และปุ่ม `aria-current="page"`
- **ค้นหา.** `page.getByRole('textbox', {name: 'ค้นหาชื่อยา หรือ Lot'}).fill('ยาเลือดงาม')` ตารางเหลือแถวที่ตรง; `getByRole('button', {name: 'ล้างการค้นหา'}).click()` ล้าง
- **กรองสถานะ.** `page.getByRole('combobox', {name: 'สถานะยา'}).click()` แล้วเลือก `getByRole('option', {name: 'ใกล้หมด'})` (ตัวเลือก: ทั้งหมด, ปกติ, ใกล้หมด, หมด, ใกล้หมดอายุ)
- **ปิดแจ้งเตือน.** `page.getByRole('button', {name: 'ปิดการแจ้งเตือน'}).click()` แถบ "N รายการใกล้หมด" หาย
- **ไป นัดหมาย.** nav ปุ่ม "นัดหมาย" h1 "นัดหมาย" ปุ่ม "เพิ่มนัดหมาย" อยู่ในหัว
- **Cross-view จากการจอง.** ถ้าก่อนหน้านี้ context เดียวกันจองคิว (`booking.md`) แถวคุณแม่ปรากฏใน view นัดหมาย (อ่านจาก `reuanfai-care-demo-v1.appointments` ตัวเดียวกัน; รันแล้ว PASS ขั้นตอนยืนยันนัดดู `booking.md` ข้อ Cross-view)
- **Proof.** ARIA snapshot + screenshot ของ view พร้อม h1 และ storage dump ของ `reuanfai-care-demo-v1`

## Gotchas

- view ไม่มี URL: `page.goto` ทุกครั้งกลับ "ภาพรวม" การสลับ view ต้องคลิก nav; sidebar เริ่มแบบย่อ (`collapsed=true`) ป้ายข้อความซ่อนแต่ `aria-label` ยังใช้ได้
- `savePrescription` ถูก import แต่ UI ยังไม่เรียก (สต็อกไม่ลดเมื่อจ่ายยา) journey ที่คาดว่าสต็อกลดต้องรายงาน FAIL พร้อมเหตุผลนี้ ห้ามแก้ assertion ให้ผ่าน
- ข้อมูลหน่วยบริการเป็น mock ใน `mock-data.ts` วันที่ "วันนี้" ในภาพรวมคงที่ 5 พฤศจิกายน 2569 ไม่ตรงวันจริง
- สต็อก/นัดอยู่ใน `reuanfai-care-demo-v1` ถ้า JSON ไม่ผ่าน validator จะถูกทิ้งและกลับไปค่าเริ่มต้น
- หน้าจอฝั่งหน่วยบริการต้องผ่าน `docs/DESIGN-REVIEW.md` ตาม phase; checkin/refer/sharing เป็น unreviewed
- ปุ่มใน table อาจอยู่ใน container เลื่อนได้ (`ตารางข้อมูล`) ใช้ locator ที่ auto-scroll ห้ามใช้พิกัด
