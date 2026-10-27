# โปรไฟล์คุณแม่และปุ่มฉุกเฉิน

ADR-0016: คุณแม่กดปุ่ม "ติดต่อฉุกเฉิน" จากหน้าแรกหรือแชท และดู/แก้ข้อมูลที่ `/ruenfai/profile` (ข้อมูลจำลองใน storage ไม่มีการส่งออก)

## Sub-features

- `emergency-action` ปุ่ม `aria-label="ติดต่อฉุกเฉิน"` (header หน้าแรกและ `/ruenfai/chat`) เปิด dialog; ปิดด้วย "ปิดช่องทางฉุกเฉิน"
- `profile-view` "ข้อมูลคุณแม่" แสดงชื่อ เบอร์ วันคลอด วิธีคลอด โรคประจำตัว แพ้ยา ผู้ติดต่อฉุกเฉิน
- `profile-edit` ปุ่ม "แก้ไขข้อมูล" -> "แก้ไขข้อมูลคุณแม่" บันทึกได้เมื่อเบอร์ติดต่อและเบอร์ฉุกเฉินถูกต้อง (ขึ้นต้น 0 ยาว 9-10 หลัก)
- `profile-persist` `reuanfai-mother-profile-v1` (เบอร์ วันคลอด วิธีคลอด) และ `ruenfai-profile-details-v1` (ชื่อ โรค แพ้ยา ผู้ติดต่อ)

## How to get to it (user POV)

- ปุ่ม "ติดต่อฉุกเฉิน" บนหน้าแรก `/ruenfai` และ `/ruenfai/chat`
- `/ruenfai/profile` (ยังไม่พบลิงก์ในหน้าแรกจากการอ่าน source; เข้า URL ตรงเป็นทางลัด รายงานด้วย)

## Driving it with drive.mjs

Preconditions:

- `scripts/doctor.sh` ผ่าน, context ใหม่, viewport 390x844; ยังไม่มี journey recipe มาจาก source ยังไม่ได้รัน

- **แก้ไข.** `getByRole('button', {name: 'แก้ไขข้อมูล'}).click()` แล้วกรอก `getByLabel('ชื่อคุณแม่')`, `getByLabel('เบอร์ติดต่อ')`, `getByLabel('เบอร์โทร')` (ผู้ติดต่อฉุกเฉิน) กด `getByRole('button', {name: 'บันทึกข้อมูล'})` เห็น toast "บันทึกข้อมูลคุณแม่แล้ว"
- **วันคลอด/วิธีคลอด.** ปุ่ม `getByRole('button', {name: 'วันคลอด', exact: true})` เปิด dialog ชื่อเดียวกัน; `getByRole('button', {name: 'วิธีคลอด', exact: true})` เปิด dialog ตัวเลือก
- **Side effect.** อ่าน storage ทั้งสอง key แล้วเปิด `/ruenfai/profile` หลัง reload ต้องเห็นค่าเดิม

## Gotchas

- เบอร์ไม่ถูกต้อง -> `role="alert"` ข้อความ "กรุณาระบุเบอร์ติดต่อคุณแม่และเบอร์ติดต่อฉุกเฉินให้ถูกต้อง..." (filter ตามข้อความ เพราะ Next มี alert ของตัวเอง)
- การเปลี่ยนมุมมองมี animation ~160-260 ms; รอ heading ปลายทางก่อน assert
- ปุ่มฉุกเฉินเรียกตำแหน่ง (geolocation); ใน context headless ไม่มี permission ให้ถือเป็นปกติ
