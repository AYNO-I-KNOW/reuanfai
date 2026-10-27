# แผนที่การตรวจสอบ เรือนไฟ (ReuanFai)

โฟลเดอร์นี้คือแหล่งอ้างอิงที่ดูแลต่อเนื่องสำหรับพิสูจน์พฤติกรรมฝั่งผู้ใช้ของเว็บต้นแบบเรือนไฟ อ่านดัชนีนี้ก่อนขับแอป แล้วใช้ไฟล์ feature ที่ตรงเป็นสูตร

## Baseline preconditions

- รัน `scripts/setup.sh` ครั้งเดียว (ลง `playwright-core` ใน `~/.cache/reuanfai-verify`) แล้ว `scripts/launch.sh` ได้ web ที่ `http://localhost:3000` (หรือ `WEB_PORT`) และ api ที่ `http://localhost:8787`
- ไม่มี DB ไม่มี seed: ข้อมูลทั้งหมดอยู่ใน browser storage + mock data ในโค้ด; `drive.mjs` เปิด browser context ใหม่ทุกครั้ง จึงเริ่มจาก storage ว่างเสมอ
- รัน `scripts/doctor.sh` และต้องผ่าน (pid ของเรายังอยู่, listener ของพอร์ตอยู่ใน process group ของเรา, `/health` = `{"ok":true}`, `GET /ruenfai` = 200)
- ห้ามขับ dev server ที่เราไม่ได้เริ่มเอง และห้ามชี้ไป URL ที่ไม่ใช่ localhost (`drive.mjs` ปฏิเสธ)
- Storage keys ที่ใช้เป็นหลักฐาน side effect: localStorage `reuanfai-care-demo-v1` (นัด/คิว/ใบสั่งยา/สต็อก), `reuanfai-mother-profile-v1`, `reuanfai-care-journey-v1`, `reuanfai-demo-reviews-v1`, `ruenfai-emergency-phone`, `ruenfai-profile-details-v1` (ชื่อ/โรคประจำตัว/แพ้ยา/ผู้ติดต่อฉุกเฉิน จากหน้าแก้ไขโปรไฟล์); sessionStorage `ruenfai-payment-ui-v1`, `ruenfai-journal-entered`

## Driving conventions

- เริ่มทุก recipe จาก baseline (context ใหม่ = storage ว่าง) เว้นแต่ preconditions ของ recipe ระบุเป็นอย่างอื่น
- ใช้ ARIA role + accessible name + ข้อความไทยตรงตัว (ไม่มี `data-testid` ในโค้ดเลย) ห้ามใช้ CSS class (เป็น CSS module, ชื่อแปรผัน) หรือพิกัด
- ข้อความ UI ในเครื่องหมายคำพูดคือ literal ห้ามแก้
- ทุกจอ `/ruenfai/*` ใช้ viewport มือถือ 390x844 (ค่าเริ่มต้นของ `drive.mjs`); `/clinic` และ `/department` ต้องตั้ง `export const viewport = {width: 1440, height: 900}` ใน journey
- เขียน journey ใหม่เป็นไฟล์ `journeys/<name>.mjs` แล้วเรียก `node scripts/drive.mjs <name>`; ห่อแต่ละ action ด้วย `step(name, fn)` เพื่อให้ได้ screenshot + ARIA snapshot + storage dump ต่อขั้น
- หน้า `/ruenfai/onboarding?screen=...` ใช้ได้เฉพาะ dev (production รับแค่ `screen=booking`) ใช้เป็นทางลัดได้ แต่ต้องบอกในรายงานว่าใช้ทางลัด

## Proof and skip reporting

- เก็บทั้ง action ของผู้ใช้และสถานะที่เกิดขึ้น ไม่ใช่แค่หน้าสุดท้าย: ทุก `step` เซฟ `NN-<name>.png`, `.aria.txt`, `.storage.json`
- Mutation ต้องพิสูจน์ด้วย 2 อย่าง: (1) ค่าใน storage key ที่เกี่ยวข้อง และ (2) มุมมองผู้ใช้ที่สองที่อ่านจาก storage นั้น (เช่น หน้านัดหมาย หลัง reload)
- `meta.json` ต้องตรวจเสมอ: `externalRequests` ควรว่าง (แอปนี้ไม่เรียก network ใด; request ออกนอก localhost ถูก abort และบันทึกไว้), `consoleErrors`/`pageErrors` รายงานตามจริง
- บันทึก feature ID และ entry point ที่ใช้กับทุก artifact
- เส้นทางที่เข้าไม่ถึง: รายงานคำสั่งที่ลองและ precondition ที่ไม่ครบ ห้ามรายงานว่า verified ผ่านเส้นทางอื่น
- หน้าจอที่ยังไม่ผ่าน `docs/DESIGN-REVIEW.md` (checkin, refer, sharing ตาม `docs/specs/screen-map.md`) ถือว่ายังไม่ถูกรีวิว รายงานเป็น "unreviewed" ไม่ใช่ pass/fail ของดีไซน์

## Feature entry contract

ทุกไฟล์ feature เริ่มด้วย H1 และหนึ่งย่อหน้าบอกพฤติกรรมที่ผู้ใช้เห็น แล้วมี H2 สี่หัวตามลำดับนี้เท่านั้น

1. `Sub-features` ID สั้น + หนึ่งบรรทัดต่อพฤติกรรม
2. `How to get to it (user POV)` ทุกทางเข้าของผู้ใช้
3. `Driving it with drive.mjs` เริ่มด้วย `Preconditions:` แล้ว bullet ที่จับคู่ action ของผู้ใช้ กับ playwright call ที่แน่นอน กับผลที่สังเกตได้
4. `Gotchas` กับดักที่ทำให้การตรวจเสียเวลาหรือเป็นโมฆะ

## Features

- [จองคิวรับบริการ](./booking.md) (journeys `splash` และ `booking` พิสูจน์แล้ว) ครอบคลุมทางเข้าจากนัดหมาย/ผลประเมิน การเลือกหน่วย/หัตถการ/สิทธิ/วัน/เวลา ยืนยัน และคิวที่โผล่ในหน้านัดหมายกับ `/clinic`
- [โปรไฟล์คุณแม่ + ฉุกเฉิน](./profile.md) ADR-0016: ปุ่ม "ติดต่อฉุกเฉิน" และ `/ruenfai/profile` (ยังไม่มี journey)
- [คัดกรองและ onboarding](./onboarding-screening.md) ความยินยอม 4 ช่วงคำถาม การประมวลผล 6 วินาที และผลการประเมิน
- [ชำระเงิน](./payment.md) สรุปค่าใช้จ่าย เลือกวิธีชำระ สำเร็จ และสถานะ "เขียนรีวิว" ในหน้านัดหมาย
- [แดชบอร์ดหน่วยบริการ](./clinic-dashboard.md) `/clinic` ภาพรวม นัดหมาย ปฏิทินแพทย์ คลังยา รีวิว
- [แดชบอร์ดกรมฯ](./department-dashboard.md) `/department` 5 แท็บ ตัวกรอง และการปิดบังค่า n<5
