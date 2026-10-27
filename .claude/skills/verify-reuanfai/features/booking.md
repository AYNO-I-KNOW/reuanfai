# จองคิวรับบริการ

คุณแม่เลือกหน่วยบริการ หัตถการ สิทธิ วันที่ และช่วงเวลา ยืนยันการจอง แล้วเห็นคิวนั้นในหน้านัดหมาย (ข้อมูลจำลอง ไม่มีการส่งคำขอไปไหน)

## Sub-features

- `booking-enter-appointments` เข้าฟอร์มจากการ์ด "ทับหม้อเกลือ" (ป้าย "จองคิว") ในหน้านัดหมาย
- `booking-enter-results` เข้าฟอร์มจากปุ่ม "จองคิว" ในหน้า "ผลการประเมิน"
- `booking-fill` เลือกหน่วย หัตถการ สิทธิ วัน และเวลาที่ว่าง
- `booking-confirm` ยืนยันผ่านกล่อง "ยืนยันการจองคิว?" จน h1 "ยืนยันการจองสำเร็จ"
- `booking-persist` คิวอยู่ใน `reuanfai-care-demo-v1` และแสดงในหน้านัดหมายหลัง reload
- `booking-cross-view` คิวเดียวกันโผล่ในตารางนัดหมายของ `/clinic` (storage ร่วม origin เดียวกัน)
- `booking-guards` ช่วงเวลาที่ผ่านแล้ว/เต็ม/ซ้ำถูกปิดหรือปฏิเสธ

## How to get to it (user POV)

- เปิด `/ruenfai/appointments` (หรือแท็บ "นัดหมาย" ใน nav "เมนูหลัก") แล้วเลือกการ์ดที่มีป้าย "จองคิว" (ในข้อมูลตัวอย่างมีการ์ดเดียวที่สถานะ choose: ทับหม้อเกลือ; นวดแผนไทยและประคบสมุนไพรเป็น "ชำระเงิน"/"เขียนรีวิว") ไปที่ `/ruenfai/onboarding?screen=booking`
- จบ onboarding (ดู `onboarding-screening.md`) แล้วกด "จองคิว" ในหน้า "ผลการประเมิน"
- (dev เท่านั้น) ลิงก์ "จองคิว" ในแผง "ทางลัดทดสอบแอปมือถือ" หรือ URL `/ruenfai/onboarding?screen=booking` โดยตรง (production รับ `screen=booking` ด้วย) รายงานว่าเป็นทางลัด

## Driving it with drive.mjs

Preconditions:

- `scripts/doctor.sh` ผ่าน และ context ใหม่ (storage ว่าง, `bookings` ว่าง)
- viewport 390x844 (ค่าเริ่มต้น); `journeys/booking.mjs` เลือกวันที่ 15 ของเดือนหน้าและชั่วโมงที่ไม่ถูกจองปลอมให้เอง

ทั้ง flow (รันแล้ว PASS 7 step): `node .claude/skills/verify-reuanfai/scripts/drive.mjs booking`

- **เปิดหน้านัดหมายจากหน้าแรก.** `page.goto(url('/ruenfai'))` รอ `getByRole('status', {name: 'กำลังเปิดเรือนไฟ'})` หาย (~3.5 วินาที) แล้ว `getByRole('navigation', {name: 'เมนูหลัก'}).getByRole('link', {name: 'นัดหมาย'}).click()` เห็น heading "นัดหมายทั้งหมด" และ `bookings` ว่าง
- **เลือกการ์ดจองคิว.** `page.getByRole('button', {name: /^ทับหม้อเกลือ.*จองคิว$/}).click()` เห็น h1 "จองคิวรับบริการ"
- **หน่วยบริการ.** `getByRole('button', {name: 'หน่วยบริการที่ต้องการจอง', exact: true}).click()` (เปิด dialog ชื่อเดียวกัน) แล้ว `getByRole('dialog', {name: 'หน่วยบริการที่ต้องการจอง'}).getByRole('button', {name: 'ศูนย์บริการแพทย์แผนไทย (ตัวอย่าง)'}).click()` ปุ่มแสดงชื่อหน่วย
- **หัตถการ.** `getByRole('checkbox', {name: 'นวดไทย'}).check()` ช่องติ๊ก "นวดไทย" ถูกเลือก ("ก้อนเส้า", "อบสมุนไพร", "นวดกระตุ้นน้ำนม" ถูก disable)
- **สิทธิ.** `getByRole('button', {name: 'สิทธิที่ใช้รับบริการ', exact: true}).click()` แล้ว `getByRole('dialog', {name: 'สิทธิที่ใช้รับบริการ'}).getByRole('button', {name: 'บัตรทอง', exact: true}).click()`
- **วันที่.** `getByRole('button', {name: 'วันที่เข้ารับบริการ', exact: true}).click()`; ใน `getByRole('dialog', {name: 'วันที่เข้ารับบริการ'})` กด `getByRole('button', {name: 'เดือนถัดไป'})` แล้ว `getByRole('button', {name: '15 <เดือนไทย> <พ.ศ.>', exact: true})` dialog ปิด ปุ่มวันที่แสดงวันที่เลือก และกลุ่ม "ช่วงเวลาที่สะดวก" ใช้งานได้
- **ช่วงเวลา.** `getByRole('button', {name: '10:00 น.', exact: true}).click()` ปุ่มมี `aria-pressed="true"`
- **ยืนยัน.** `getByRole('button', {name: 'ยืนยันการจอง', exact: true}).click()` แล้วใน `getByRole('dialog', {name: 'ยืนยันการจองคิว?'})` กด `getByRole('button', {name: 'ยืนยัน', exact: true})` หลัง ~1.5 วินาทีเห็น h1 "ยืนยันการจองสำเร็จ"
- **Side effect.** `page.evaluate(() => JSON.parse(localStorage.getItem('reuanfai-care-demo-v1')))` มี `bookings[0]` ตรง unit/date/time/rights/services และ `appointments` มี id เดียวกันสถานะ `รอยืนยันนัด`
- **Second view.** `page.goto(url('/ruenfai/appointments'))` (reload เต็ม) การ์ด "นวดแผนไทย" (นวดไทย ที่จอง) ที่ข้อความมี `<วัน เดือนย่อ> · <HH:00> น.` อยู่ในรายการ กดแล้วเปิด dialog "รายละเอียดนัดหมาย" แสดงหน่วยและบริการ
- **Cross-view `/clinic` (ยังไม่มี journey).** ใน context เดียวกัน `page.goto(url('/clinic'))` ด้วย viewport เดสก์ท็อป กด `getByRole('navigation', {name: 'เมนูหน่วยบริการ'}).getByRole('button', {name: 'นัดหมาย'})` ต้องเห็นคุณแม่ `M01` ที่ 10:00 (ไม่ได้ยืนยันด้วยการรัน)

## Gotchas

- Splash บน `/ruenfai` หายหลัง ~3.5 วินาที (journey `splash` PASS) deep link `/ruenfai/appointments` ไม่มี splash; journey `booking` เข้าจากหน้าแรกเหมือนผู้ใช้
- slot ถูกจองปลอมด้วยสูตร `(hour + วันที่ + index หน่วย) % 4 === 0` (ปุ่มชื่อ `HH:00 น. เต็มแล้ว`, disabled) journey เลือกชั่วโมงที่ไม่เข้าสูตร ถ้าสูตรเปลี่ยน journey ต้องตามสูตรใหม่ ห้ามเลี่ยงด้วยการคลิก force
- `saveBooking` ปฏิเสธเวลาที่ผ่านแล้วและ slot ซ้ำ (หน่วย+วัน+เวลา เดียวกัน ยกเว้นนัดที่ยกเลิก) ใช้วันเดือนหน้าเสมอ ห้ามฮาร์ดโค้ดวันที่
- ปฏิทินนับเวลา Asia/Bangkok และปีแสดงเป็น พ.ศ. (ปี + 543) ชื่อปุ่มวันคือ `15 พฤศจิกายน 2569` ต้อง `exact: true` เพราะ "5 ..." เป็น substring ของ "15 ..."
- `getByRole('checkbox', {name: 'นวดไทย'})` ต้องไม่ชนกับ "นวดกระตุ้นน้ำนม" ใช้ชื่อเต็ม ถ้า `.check()` ชน overlay ให้คลิก label แทน อย่า `force`
- ถ้า `reuanfai-care-journey-v1.referralLocked` เป็น true การ์ด "จองคิว" จะพาไป `/ruenfai/refer` (ยังไม่ผ่านรีวิว) ไม่ใช่ฟอร์ม
- ไม่มีการเรียก network; ถ้า `meta.json` มี `externalRequests` ให้รายงานเป็นความผิดปกติ
