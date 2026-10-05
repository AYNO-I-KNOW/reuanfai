# Design handoff — เรือนไฟ

> สถานะ: อัปเดต handoff รอบ 1 · 2026-10-05 · ตรวจโค้ดฐาน e0c7796 และร่าง handoff 518967c บน branch `thanid-design`
> ไฟล์นี้ไม่ใช่ผล design review — review แยกที่ `docs/design-review/` ตาม `DESIGN-REVIEW.md` (ยังไม่มีโฟลเดอร์นี้)
> ข้อเท็จจริงทุกข้ออ่านจากโค้ดใน `apps/web` · path ไม่มี prefix = ใต้ `apps/web/src/app/` · "ต้องยืนยัน" = โค้ดไม่พอให้สรุป
> ภาพรวม: ไม่มีหน้าใดเรียก API จริง ยกเว้น `/` (`api.health`) · ข้อมูลทั้งหมดมาจาก mock + localStorage/in-memory

## 0. Context สำหรับทีมพัฒนา
- Figma: [ไฟล์ UI](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ) · ตรวจ metadata ของ node ที่ระบุใน §2 อีกครั้งวันที่ 2026-10-05 ไม่ใช่การรับรองว่า Figma ตรงกับโค้ดทุก state
- Phase: รอบ handoff นี้เป็น **รอบ 1** ครอบคลุม UI prototype ที่เกี่ยวข้องกับ phase 1–5 ใน screen-map; **ยังไม่มี phase ใดที่ยืนยันว่าผ่าน design review ครบ** โดยเฉพาะ M4-R, M8, M11 และ D8 ยังไม่มี UI ในโค้ด
- ผู้ติดต่อด้าน UX/UI: ฐานิศร์ จรูญสิริเศรษฐ์ (ออฟ) ตาม `README.md:19`; Product: เกรพ · AI/Backend: พู
- แหล่งส่งต่อหลัก: โค้ดใน Git และเอกสารนี้ ใช้เส้นทาง `/ruenfai`, `/clinic`, `/department` สำหรับตรวจ prototype; `/` เป็นหน้า dev และ `/dtam` คงพื้นที่ว่าง
- ผลตรวจรอบนี้: `node --test apps/web/tests/*.mjs` ผ่าน 15/15 · web typecheck และ ESLint ผ่าน ไม่ได้ replay ทุก browser state ในรอบเอกสารนี้
- รูปแบบมือถือปัจจุบัน: consent → ข้อมูลคุณแม่ → อาการ 7 ข้อ → ภาวะสุขภาพ 6 ข้อ → ข้อควรระวัง 7 ข้อ → processing 6 วินาที → ผลตัวอย่าง → booking หน้าเดียว → confirmation → loading → success; ฟอร์มเก็บค่าขณะเปลี่ยนช่วง แต่ไม่ส่งคำตอบไป rules engine
- Booking/clinic/prescription/review เชื่อมกันใน browser demo store; journal และสถานะทานยาอยู่ใน React state การ refresh ไม่รับประกันข้อมูลทุกประเภท
- แถวที่เขียนว่า “ยังไม่ยืนยัน” เป็นข้อมูลที่ค้นแล้วไม่มีหลักฐานเพียงพอ ไม่ใช่การอนุมัติหรือการสรุปว่าไม่มีใน Figma ทั้งไฟล์

## 1. Design tokens & assets

| กลุ่ม | อยู่ที่ | ค่า |
|---|---|---|
| สี Brand (6) | `src/design/tokens.ts` `colorGroups` | primary `#6549F7` · hover `#5438DB` · pressed `#4328BD` · soft `#EBEFFC` · tint `#F4F1FF` · border `#C9BEFF` |
| สี Neutral (8) | 〃 | surface `#FFFFFF` · canvas `#F8F9FD` · subtle `#F1F3F9` · border `#E4E7F0` · control-border `#85889C` · text `#242338` · text-secondary `#62647A` · text-muted `#6C6E82` |
| สี Semantic (8) | 〃 | success `#21745C`/`#E5F5EE` · warning `#985018`/`#FFF0DF` · danger `#B13D50`/`#FCECF0` · info `#3566AD`/`#EAF2FF` (เข้ม/พื้นอ่อน) |
| สี Accent (5) | 〃 | `#B6A4F5` `#EAA9C7` `#A9DCCB` `#F4C69E` `#A8BFF4` — โค้ดเขียนว่า "ชุดทดลอง ยังไม่ผูกความหมายทางการแพทย์" |
| Foundation | 〃 `foundationTokens` | space 4–64px (10 ขั้น) · radius 8/12/16/24/999 · text 12–36px (xs…display) · leading 1.6/1.4 · weight 400/500/600/700 · control 32/40/48px · icon 16/20/24 · shadow card/popover · motion 150/200ms `cubic-bezier(0.2,0,0,1)` · focus 2px offset 3px · z 0/10/30/50/60 · layout: sidebar 240/72, min 1024, max 1600, gutter 24, page-padding 32 |
| CSS variable | `tokenStyle` → `--rf-*` | ใช้จริงเฉพาะ `dtam/layout.tsx` และ `provider/design-preview/page.tsx` (`department/*` และ `ruenfai/*` ไม่ใช้) |
| ฝั่งแม่ (ชุดแยก) | `ruenfai/foundation.module.css` `.scope` | `--mother-accent #6549f7` · hover `#5438db` · pressed `#4328bd` · border `#e4dfef` · muted `#625d70` · ที่เหลือเป็น hex ตรงใน `*.module.css` (เช่น canvas `#f6f4fd` `ruenfai/page.module.css:1`, selected `#e0d8fa`) — ไม่ผูกกับ `tokens.ts` |
| Tailwind/shadcn | `src/app/globals.css` | theme ดีฟอลต์ shadcn · ไม่ได้ผูกกับ `--rf-*` |
| ฟอนต์ | `src/design/fonts.css` + `public/fonts/` | family `LINE Seed Sans TH` (woff2 น้ำหนัก 250/400/700/800/900) · `Noto Sans Thai Local` (variable TTF 100–900) · `ReuanFai UI` = alias ใช้ LINE Seed ที่ 250/400/700/800/900 และ Noto ที่น้ำหนักอื่น · มีหน้าเทียบใน `/dtam/design-system` |
| ลิขสิทธิ์ฟอนต์ | `public/fonts/README.md` + `OFL.txt` ในแต่ละโฟลเดอร์ | LINE Seed Sans TH V1.003 © LY Corp. · SIL OFL 1.1 · Noto Sans Thai · SIL OFL 1.1 |
| ฟอนต์ที่สอง | `app/layout.tsx:2,6` | root layout โหลด `Noto_Sans_Thai` จาก `next/font/google` แยกจาก `fonts.css` (สองระบบฟอนต์) |

หมายเหตุ: `public/fonts/README.md` ระบุว่า "Imported by the DTAM-only layout" แต่ตอนนี้ `fonts.css` ถูก import ใน 11 ไฟล์ (ruenfai ทุกหน้า, login, provider/department design-preview, dtam layout) — README ล้าสมัย

| โฟลเดอร์ `public/images/` | เนื้อหา | ที่มา/ลิขสิทธิ์ |
|---|---|---|
| `ruenfai/` | UI แม่: nav-*.svg, avatar.png, header-gradient.png, selected.svg, `services/` (6 หัตถการ × `x.svg` + `x-base.svg` = 12 ไฟล์), `medicines/medicine-1..6.svg`, `journal/mood-1..5.png` + mood-strip, `results/` (baby.png, success-check.svg/.lottie/static), อื่น ๆ | SVG หัตถการ/ยา/onboarding เป็นไฟล์สร้างสำหรับ prototype; mood PNG เป็นภาพสร้างใหม่; avatar/gradient/baby/nav เดิมมาจากไฟล์ Figma ที่ระบุใน §2; success-check มาจากไฟล์ `.lottie` ที่ผู้ใช้ส่งและ export SVG/ปรับสี สิทธิ์ใช้งานภาพจากภายนอกและ animation ยังไม่ยืนยัน ไม่ถือว่าได้รับ license จากการมีไฟล์ |
| `provider-preview/` | `patient-1.png`, `activity-illustrations-v2.png`, `summary-illustrations-v1.png` (sprite ใช้เป็น background ใน `preview.module.css:404,1231,2328`), `medicine-bottle.svg`, `medicine-sachet.svg` | PNG ภาพประกอบกิจกรรม/สรุปเป็นภาพสร้างใหม่สำหรับ prototype; SVG บรรจุภัณฑ์อยู่ใน repo; ภาพ `patient-1.png` เป็น asset เดิมที่ยังไม่มีหลักฐานสิทธิ์ใช้งานครบ ห้ามถือว่าเป็นภาพวาดใหม่หรือได้รับอนุญาตแล้ว |
| `department/` | 13 svg (ai, alert, box, calendar, chat, clean, clipboard, clock, medicine, network, people, shield, star) | SVG สร้างสำหรับ prototype อยู่ใน `public/images/department/`; ไม่พบใบอนุญาตแยกใน repo |
| `logo-dtam.png` | โลโก้ใช้เป็นโลโก้เรือนไฟ (alt="เรือนไฟ") ใน login/provider/department/dtam | ไฟล์โลโก้เดิมของ workspace; ยังไม่มีเอกสารสิทธิ์หรือผู้ถือลิขสิทธิ์ที่ยืนยันใน repo ให้เจ้าของโครงการตรวจสิทธิ์ก่อนเผยแพร่ |

README ใน `public/` ครอบคลุมเฉพาะฟอนต์ ข้อมูลที่มาภาพข้างต้นเป็นประวัติการสร้าง/นำเข้า ไม่ใช่หลักฐาน license; ไม่เติมชื่อผู้วาดหรือสิทธิ์ใช้งานที่ยังยืนยันไม่ได้

## 2. Route ที่มีในโค้ด → screen-map ID

> 19 ไฟล์ `page.tsx` · ฝั่งหน่วยบริการ/กรมฯ เป็น SPA เดียวต่อฝั่ง สลับด้วย state (`view`) ไม่มี URL ต่อหน้า → แยกเป็นแถวตาม view
> ฝั่งแม่: onboarding เป็น route เดียวสลับด้วย `?screen=` (ทางลัด dev ใช้ได้เฉพาะ non-production ยกเว้น `booking` — `ruenfai/onboarding/page.tsx:27`)
> คอลัมน์ "API ที่ต้องต่อ" มาจาก `docs/specs/api.md` · "state" = เฉพาะที่เห็นในโค้ด

### 2.1 ทั่วไป / auth

| route ในโค้ด | ไฟล์ | map ID | route ตาม spec | แหล่งข้อมูลตอนนี้ | API ที่ต้องต่อ | state ที่มีแล้ว | Figma / หลักฐาน UI |
|---|---|---|---|---|---|---|---|
| `/` | `page.tsx` | – (หน้า dev) ลิงก์ไป `/m` `/provider` `/dtam` | – | `api.health.$get()` (เรียกจริง) | `GET /health` ✅ | แสดง `ok`/`down` | – |
| `/m` | `m/page.tsx` | placeholder (`<main>m</main>`) | `m/*` | – | – | – | – |
| `/provider` | `provider/page.tsx` | placeholder | `provider/*` | – | – | – | – |
| `/login` | `login/page.tsx` | P1 (บางส่วน; ไม่มี login ฝั่งแม่) | `provider/login` | ไม่มี — submit แล้วโชว์ปุ่มเลือก `/clinic` หรือ `/department` | `POST /auth/staff` `{username,password,unitId?,role}` | ซ่อน/แสดงรหัสผ่าน · ข้อความ "พรีวิวดีไซน์ · ยังไม่ตรวจสอบบัญชีจริง" · **ไม่มี** error/loading/rate-limit (5/นาที) · ไม่มีเลือก role/unit | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |

### 2.2 ฝั่งแม่ (`ruenfai/*`)

| route ในโค้ด | ไฟล์ | map ID | route ตาม spec | แหล่งข้อมูลตอนนี้ | API ที่ต้องต่อ | state ที่มีแล้ว | Figma / หลักฐาน UI |
|---|---|---|---|---|---|---|---|
| `/ruenfai` | `ruenfai/page.tsx` | M5 (บางส่วน) + dialog ยา (M9) + dialog เขียนบันทึก (extra) | `m/calendar` | array hard-code `scheduledAppointments` (`:19`), `medicineRounds` (`:18`), จุดบนปฏิทิน `[5,12,24,26]` (`:95`); รวมกับ `careDemo` (bookings/prescriptions) | `GET /me/calendar?month=`, `GET /me`, `GET /me/meds`, `POST /me/meds/doses/:id/taken` | empty "วันนี้ไม่มีรายการที่ต้องทำแล้ว" (`:101`) · ไม่มี loading/error · ไม่มี status start/not_yet/deadline · ไม่มีการ์ด 4 ใบ · ไม่มีชวนเช็กอิน | [Home 76:2473](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=76-2473) · ปรับเนื้อหาเป็นแม่หลังคลอด |
| `/ruenfai/onboarding` (ไม่มี `?screen` หรือ `consent`) | `onboarding/page.tsx` | M1 (บางส่วน) | `m/consent` | ไม่บันทึกที่ใด (state ใน component) | `POST /me/consent` `{care:true, aggregate}` | checkbox ไม่ pre-check (`:25`) · 2 ข้อ จำเป็น/ไม่บังคับ ✅ · ปุ่มกดได้เสมอ (ถ้ายังไม่ติ๊กจะเลื่อนไปที่ checkbox) · ไม่มี error `consent_required` | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| `…?screen=stage-1` | `onboarding/MotherForm.tsx` | M2 (บางส่วน) | `m/profile` | `motherProfile` localStorage `reuanfai-mother-profile-v1` (เก็บแค่ phone, emergencyPhone, birth, deliveryDate) + `ruenfai-emergency-phone` | `PUT /me/profile` | validation ฟอร์ม (วันที่ไม่เกินวันนี้ · เบอร์ `0xxxxxxxxx`) · **ไม่มี** โหมดแก้ไขหลัง onboarding / ข้อความ "จะคำนวณใหม่" · คำตอบโรคประจำตัว/แพ้/ยา/ครรภ์เป็นพิษ **ไม่ถูกบันทึกที่ใด** | [Form 11:1804](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=11-1804) · ฐาน controls เท่านั้น; คำถาม/ช่วงปรับในโค้ด |
| `…?screen=stage-2`/`stage-3`/`stage-4` | `onboarding/SymptomsForm.tsx` | M3-A / M3-B / M3-C (บางส่วน) | `m/screening/[step]` | คำถาม hard-code ในไฟล์ · คำตอบอยู่ใน state ไม่ถูกส่ง/เก็บ | `GET /me/screening/questions`, `POST /me/screenings` | ถามครบ 20 ข้อ (7/6/7) ทุกคน **ไม่แยกตามวิธีคลอด/โรคประจำตัว** (rules §2 = 16–19 ข้อ; A1a ถามเมื่อ A1=ใช่, A4/C8 เฉพาะคลอดทางช่องคลอด, C7 เฉพาะผ่าคลอด, B5 เฉพาะมีโรคที่เข้าเงื่อนไข) · แสดงทีละช่วง ไม่ใช่ทีละข้อ ไม่ไปต่ออัตโนมัติเมื่อตอบ มี/ไม่มี · ไม่มีปุ่มโทรปรึกษาตอน unsure · ไม่มีการ์ด 1323 (B4) · ไม่มีทางไป M4-R · unsure เปิดช่องหมายเหตุ (ตรง `Answer.note`) | [Form 11:1804](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=11-1804) · ฐาน controls เท่านั้น; คำถาม/ช่วงปรับในโค้ด |
| `…?screen=processing` | `onboarding/page.tsx:33` | (ระหว่าง M3→M4) | – | timer ปลอม 6 วินาที | (รอ `POST /me/screenings`) | loading "ระบบกำลังประมวลผล…" · ไม่มี error | [Result 168:2737](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=168-2737) · ฐานภาพ/องค์ประกอบ; motion และผลหัตถการปรับในโค้ด |
| `…?screen=results` | `onboarding/ResultsSummary.tsx` | M4 (บางส่วน) | `m/results` | array hard-code ใน `ResultsSummary.tsx:8` (ไม่คำนวณจากคำตอบ — โค้ดเขียนกำกับไว้) | `GET /me/results/latest` → `EvaluateResult` | 3 สถานะ (ทำได้/รอการประเมิน/ห้ามหลังคลอด) · ปุ่ม จองคิว / กลับหน้าแรก · ไม่มี reason/เลขหน้า/แตะดูเหตุผล · ไม่มีวันเริ่ม (`not_yet`) | [Result 168:2737](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=168-2737) · ฐานภาพ/องค์ประกอบ; motion และผลหัตถการปรับในโค้ด |
| `…?screen=booking` | `onboarding/BookingForm.tsx` | M6-1…M6-4 รวมเป็นหน้าเดียว | `m/booking/unit`, `/procedures`, `/slot`, `/confirm` | หน่วย/หัตถการ/สิทธิ hard-code (`:12-13`); ช่องเวลา 09:00–18:00 รายชั่วโมงสร้างในโค้ด, "เต็มแล้ว" คำนวณปลอม `(hour+day+unitIndex)%4===0` (`:38`); บันทึกลง `careDemo.bookings` | `GET /me/units`, `GET /me/units/:id/procedures`, `GET /me/units/:id/availability`, `POST /me/appointments` | dialog ยืนยัน · loading 1.5 วินาที (ปลอม) · success "ยืนยันการจองสำเร็จ" · หัตถการ ก้อนเส้า=ห้าม, อบ/นวดกระตุ้นน้ำนม=รอประเมิน (disabled) · วันที่/เวลาที่ผ่านแล้ว disabled · **ถ้า `saveBooking` คืน false กลับไปฟอร์มโดยไม่มีข้อความ** (`:22`) · ไม่มี `quota_exhausted`/`slot_full`/`referral_locked`/`outside_window`/`same_day` · ไม่มีแถบสิทธิ์บนสุด · ไม่มีช่องติ๊กแชร์ใบสรุป | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| `/ruenfai/appointments` | `appointments/page.tsx` | M7 (บางส่วน) | `m/appointments` | array hard-code `a1–a6` (`:13`) + `careDemo.bookings` | `GET /me/appointments?tab=`, `…/reschedule`, `…/cancel` | 4 สถานะการ์ด (จองคิว/ยังไม่พร้อม/นับถอยหลัง/เขียนรีวิว) · "กำลังตรวจเวลานัด" · ไม่มี empty/error · **ไม่มีแท็บ upcoming/history, เลื่อน, ยกเลิก** | [Cards 99:2594](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=99-2594) · ฐาน card; เนื้อหาปรับในโค้ด |
| `/ruenfai/medicines` | `medicines/page.tsx` | M9 (บางส่วน) | `m/meds` | `medicines/data.ts` (6 รายการ) + `careDemo.prescriptions` (เฉพาะ patient `M01`) · สถานะ "ทานแล้ว" = React state ใน `MedicineState.tsx` หายเมื่อรีโหลด | `GET /me/meds`, `PUT /me/meds/mode`, `POST /me/meds/doses/:id/taken`, `POST /me/meds/adverse` | bottom sheet รายละเอียด · ปุ่ม ทานรอบนี้/ทานครบ · **ไม่มี** ตัวเลือก per_dose/daily · **ไม่มีปุ่มอาการผิดปกติ** · ไม่มี empty/loading/error | [Sheet 3:924](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=3-924) · ฐาน sheet; รายการยา/controls ปรับในโค้ด |
| `/ruenfai/review` | `review/page.tsx` | M10 (บางส่วน) | `m/review/[id]` (code ไม่มี `[id]`) | บันทึกลง localStorage `reuanfai-demo-reviews-v1` | `POST /me/appointments/:id/review` | dialog ยืนยัน · loading 1.5 วินาที (ปลอม) · success · error "ส่งรีวิวไม่สำเร็จ กรุณาลองอีกครั้ง" · ให้คะแนน 4 ข้อ ✅ · **ไม่มี** painAfter, adverse/adverseText | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| `/ruenfai/journal` | `journal/page.tsx` | – ไม่มีใน screen-map | – | `JournalState.tsx` (in-memory, seed 3 รายการ, หายเมื่อรีโหลด) | ไม่มีใน api.md | empty-day card "เขียนบันทึก" · ไม่มี loading/error | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| `/ruenfai/growth` · `/baby` · `/profile` | `growth/` `baby/` `profile/` | alias (re-export `journal` / `medicines` / `appointments`) | – | – | – | `BottomNav.tsx:14` ทำให้ tab active ตาม alias | [Navigation 3:671](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=3-671) · [Canvas 3:582](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=3-582) · labels/icons/emergency ปรับในโค้ด |
| (ทุกหน้า `/ruenfai/*` ยกเว้น onboarding, review) | `ruenfai/BottomNav.tsx` | M12 (บางส่วน — เป็น dialog ไม่ใช่หน้า) | `m/emergency` | เบอร์ผู้ติดต่อฉุกเฉินจาก localStorage `ruenfai-emergency-phone` (default `0812345678`) | `GET /me` (`unitPhone`) | dialog: โทร 1669 + โทรผู้ติดต่อฉุกเฉินของแม่ · **ไม่มี** รายการ 7 อาการส่งต่อ · ไม่ใช้ `unitPhone` | [Navigation 3:671](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=3-671) · [Canvas 3:582](https://www.figma.com/design/vijW6m6e4GshKUfYWTiCaZ?node-id=3-582) · labels/icons/emergency ปรับในโค้ด |

### 2.3 ฝั่งหน่วยบริการ (`/clinic` = re-export ของ `/provider/design-preview`)

| route ในโค้ด | ไฟล์ | map ID | route ตาม spec | แหล่งข้อมูลตอนนี้ | API ที่ต้องต่อ | state ที่มีแล้ว | Figma / หลักฐาน UI |
|---|---|---|---|---|---|---|---|
| `/clinic`, `/provider/design-preview` view=`dashboard` + `appointments` | `provider/design-preview/page.tsx` | P3 (บางส่วน) | `provider/queue` | `careDemo.appointments` ← `mock-data.ts` | `GET /provider/queue`, `POST …/confirm`, `POST …/propose` | empty "ไม่พบนัดหมายที่ตรงกับตัวกรอง" (`:522`) · ตัวกรองสถานะ/ซ่อนเสร็จ/ซ่อนยกเลิก · ไม่มีแถบ awaiting_eval แยก (มีแต่ตัวกรอง "รอประเมิน") · ไม่มีปุ่ม confirm/propose · มีปุ่ม "เพิ่มนัดหมาย" (api.md ไม่มี route นี้) · ไม่มี loading/error | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view=`case` | 〃 `:577` | P4 | `provider/cases/[id]` | `careDemo.appointments` + **ข้อความ hard-code ทุกเคส** (โรคประจำตัว "รายงานว่าไม่มี", ประวัติ 4 พ.ย./1 พ.ย./28 ต.ค., ความปวด `4`) | `GET /provider/cases/:appointmentId` → `{header, mustReview[], history, timeline[], painPrev}` | กล่องเตือนบนสุดเมื่อ `screening !== 'ผ่าน'` · empty "ยังไม่มีประวัติรับบริการ" · ไม่มี access_log/สถานะ share หมดอายุ · ไม่มีอ้างอิงเลขหน้าคู่มือ (history) | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view=`treatment` | 〃 `:578` | P5 | `provider/treatment/[id]` | draft ใน state (`Draft`) | `POST /provider/appointments/:id/treatment` | checkbox ตรวจสิทธิ์ (บังคับก่อนบันทึก) · decisions 4 หัตถการ · ความปวด 0–10 · ICD-10-TM · กิจกรรม 5 รายการ · warning ไม่ครบ 5 กิจกรรม (`incomplete_activity_set`) · warning คอร์สเกินสิทธิ์ (`course_exceeds_quota`) | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view=`prescribe` | 〃 `:579` | P6 | `provider/prescribe/[id]` | `careDemo.medicines`, `savePrescription` | `GET /provider/drugs`, `POST /provider/prescriptions/check`, `POST /provider/prescriptions` | เตือนห้ามใช้ (ผ่าคลอด) + ปุ่ม "เปลี่ยนยา" · เตือนคลังไม่พอ (disable ปุ่ม) · **ไม่มี** ปุ่ม "รับทราบและยืนยัน" (`decision`) · ไม่มี `ruleId` ในคำเตือน | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view=`schedule` | `ScheduleCalendar.tsx` | P2 (บางส่วน) | `provider/schedule` | `sessionStorage` `provider-calendar-settings`, `localStorage` `provider-calendar-doctor-colors` | `/provider/services`, `/start-days`, `/schedule`, `/closures` | ปฏิทินรายสัปดาห์รายแพทย์ · เพิ่มแพทย์/รูป/บริการที่ทำได้ · แจ้งลาหยุด · error ชนเวลา/ชนวันลา/แพทย์ไม่ทำบริการนั้น (`role=alert`) · undo · **ไม่มี** ตั้ง duration/capacity, start-days (T-START), weekly template | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view=`inventory` | `page.tsx:581` | P7 | `provider/inventory` | `careDemo.medicines` | `GET /provider/inventory`, `…/moves`, `POST …/receive`, `…/adjust` | 11 ยา · สถานะ ปกติ/ใกล้หมด/หมด/ใกล้หมดอายุ · ประวัติการจ่าย (empty มี) · รับยาเข้า/ปรับยอด · ปรับยอดบังคับ reason ✅ แต่ UI ส่ง "ยอดใหม่" (absolute) ไม่ใช่ `delta`+`lotId` · รับยาเข้าเขียนทับ lot/expiry เดิมของยา (1 lot ต่อยา, ไม่ใช่ FEFO หลาย lot) · วันหมดอายุคำนวณจากวันที่ hard-code `2026-11-05` · มี "เพิ่มยาใหม่/แก้ไขยา/เปลี่ยนรูป" ที่ api.md ไม่มี · ไม่แยก role pharmacist | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view=`reviews` | `ReviewsPanel.tsx` | P8 | `provider/reviews` | `initialReviews` (8 แถว ใน `:11`) + localStorage `reuanfai-demo-reviews-v1` | `GET /provider/reviews`, `GET /provider/alerts`, `POST /provider/alerts/:id/contacted` | empty "ไม่พบรีวิวตามตัวกรอง" · ติดตามเรื่อง (ผู้รับผิดชอบ/สถานะ/บันทึก) · **ไม่มี** logic n<5 → `insufficient` · ไม่มีป้าย "สรุปโดย AI" (มี "จัดหมวดตัวอย่าง") · มีตัวกรองแพทย์ (ดู §6) | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |

### 2.4 กรมฯ (`/department` = re-export ของ `/department/design-preview`) และ `/dtam`

| route ในโค้ด | ไฟล์ | map ID | route ตาม spec | แหล่งข้อมูลตอนนี้ | API ที่ต้องต่อ | state ที่มีแล้ว | Figma / หลักฐาน UI |
|---|---|---|---|---|---|---|---|
| `/department` view 0 "ภาพรวมเครือข่าย" | `department/design-preview/page.tsx:68` | D1 + D4 (การเข้าถึงอยู่ในหน้าเดียวกัน) | `dtam/overview`, `dtam/access` | `units` hard-code (`:12`) × factor ตัวกรอง + **อ่าน `careDemo` ของแม่รายคน** (`:46-54`) | `GET /dtam/filters`, `/dtam/overview`, `/dtam/access` | empty "ไม่พบหน่วยบริการตามตัวกรอง" (`:68`) · ตัวเลข `<5` → "น้อยกว่า 5" (`:65`) | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view 1 "ผลลัพธ์และคุณภาพ" | `:69` | D2 + D6 | `dtam/outcomes`, `dtam/satisfaction` | ค่าคงที่ใน JSX | `GET /dtam/outcomes`, `/dtam/satisfaction` | ป้าย "สรุปโดย AI · จำลอง" | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view 2 "ความปลอดภัย" | `:70` | D3 | `dtam/safety` | ค่าคงที่ + `scopedCount` | `GET /dtam/safety` | – | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view 3 "ยาและคลังเครือข่าย" | `:71` | D5 | `dtam/drugs` | ค่าคงที่ + `careDemo.prescriptions` | `GET /dtam/drugs` | – | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| view 4 "ข้อเสนอจาก AI" | `:72` | D7 | `dtam/ai` | 2 ข้อเสนอ hard-code | `GET /dtam/ai-proposals`, `POST …/:id/decision` | ปุ่ม รับข้อเสนอ/ไม่รับ/ขอข้อมูลเพิ่ม (= accepted/rejected/more_info) · **ไม่มี** ช่อง `comment` · ข้อความ "เก็บเฉพาะในหน้าพรีวิว" | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |
| (ไม่มี) | – | D8 ชุดกฎ | `dtam/rules` | – | `/dtam/rulesets…` | – | ยังไม่ยืนยัน frame และยังไม่มี UI ในโค้ด |
| `/dtam` | `dtam/page.tsx` | – (คืน `null` ในกรอบ `DashboardShell`) | – | – | – | ว่าง | – |
| `/dtam/design-system` | `dtam/design-system/page.tsx` | – (หน้าเอกสาร tokens/คอมโพเนนต์ ไม่ใช่หน้า product) | – | `design/tokens.ts` | – | – | พัฒนาในโค้ด; ยังไม่มี frame เฉพาะที่ยืนยัน |

ตัวกรองกรมฯ ในโค้ด: เขตสุขภาพ (`1`,`4`) · จังหวัด · หน่วยบริการ · วิธีคลอด (ทั้งหมด/คลอดธรรมชาติ/ผ่าคลอด) · ช่วงเวลา (เดือนล่าสุด/3 เดือน/6 เดือน) — spec: `region, province, unitId, range=3m|6m|12m, method` → **ไม่มี 12 เดือน**, มี "เดือนล่าสุด" ที่ spec ไม่มี, วิธีคลอดมี 2 ค่า (spec ใช้ enum 4 ค่า)

## 3. หน้าใน screen-map ที่ยังไม่มีในโค้ด

| ID | หน้า | phase | สถานะ Figma |
|---|---|---|---|
| M0 | ห้องแชท LINE (rich menu) | 1 | ยังไม่ยืนยัน frame หรือขอบเขต rich menu; ไม่มี implementation ใน `apps/web` |
| M4-R | ควรไปพบแพทย์ (`referral_locks`, ไม่มีปุ่มจอง) | 1 | ยังไม่ยืนยัน frame; ไม่มี UI ในโค้ด |
| M8 | เช็กอินก่อนนัด | 2 | ยังไม่ยืนยัน frame; ไม่มี UI ในโค้ด |
| M11 | จัดการการแชร์ข้อมูล / ถอน consent / ลบข้อมูล | 5 | ยังไม่ยืนยัน frame; onboarding อ้างถึง “การแชร์ข้อมูลของฉัน” แต่ยังไม่มีหน้าในโค้ด |
| D8 | ชุดกฎ | 6 | ยังไม่ยืนยัน frame และยังไม่มี UI ในโค้ด |

มีในโค้ดแต่ไม่ครบตาม spec (รายละเอียดอยู่ §2): M1 ไม่บันทึก · M2 ไม่มีโหมดแก้ไข/คำนวณใหม่ · M3 ไม่แยกตามเงื่อนไข/ไม่มี refer · M4 ขาดสถานะ `not_yet`, reason, เลขหน้า · M6 รวม 4 หน้าเป็นหน้าเดียว · M9 ขาด mode, อาการผิดปกติ · M10 ขาด painAfter, adverse · M12 เป็น dialog ไม่มี 7 อาการ · P1 ไม่มี role/unit · D4/D6 ไม่มีหน้าแยก (รวมอยู่ใน view ของ D1/D2)
การตรวจ Figma รอบนี้ยืนยันเฉพาะ node ใน §2; ยังไม่มีหลักฐานว่าหน้า missing เหล่านี้มี frame แยก ไม่สรุปว่าไม่มีในไฟล์ทั้งชุด

## 4. หน้าในโค้ดที่ไม่มีใน screen-map

| route / ส่วนของหน้า | ทำอะไร | ขอบเขต prototype / ข้อเสนอใน §7 |
|---|---|---|
| `/ruenfai/journal` + dialog "เขียนบันทึก" ในหน้าแรก | บันทึกอารมณ์รายวัน (5 mood + ข้อความ) · ไม่มีใน screen-map, api.md, data-model.md | อยู่ใน prototype ตามงานที่ผู้ใช้เลือก; production scope รอตัดสินใน R-05 |
| `/ruenfai/growth` | alias → journal (ชื่อสื่อถึงพัฒนาการลูก แต่ไม่มีเนื้อหาเฉพาะ) | alias สำหรับ compatibility ของ prototype; ไม่ใช่ feature พัฒนาการลูกใหม่ (R-01) |
| `/ruenfai/baby` | alias → medicines | alias ของ prototype; ไม่ใช่ feature ลูกใหม่ (R-01) |
| `/ruenfai/profile` | alias → appointments (ไม่ใช่หน้าโปรไฟล์/M2/M11) | alias ของ prototype; ไม่ใช่ M2/M11 (R-01) |
| `/dtam/design-system` | หน้าเอกสาร design system (dev/design workspace) | เครื่องมือ design/dev; production exposure ยังไม่ตัดสิน (R-06) |
| ช่องเบอร์ติดต่อแม่ + เบอร์ฉุกเฉิน (M2) | `phone`, `emergencyPhone` — ไม่มีใน api.md `PUT /me/profile` และ `mothers` ใน data-model.md | ผู้ใช้เลือกให้บังคับทั้งสองเบอร์ใน prototype; API/consent/persistence รอตัดสิน (R-07) |
| ฝั่งหน่วยบริการ: "เพิ่มนัดหมาย" (กรอกชื่อ/เบอร์เอง) | api.md ไม่มี `POST /provider/appointments` · ช่องชื่อเป็น free text (`page.tsx:592`) | อยู่ใน prototype; staff API/role และ displayCode รอตัดสิน (R-08) |
| ฝั่งหน่วยบริการ: เพิ่ม/แก้ไขยา + เปลี่ยนรูปยา | api.md ไม่มี create/update drug (มีแค่ receive/adjust, ยา 11 รายการคงที่) | อยู่ใน prototype; production CRUD และสิทธิ์รอตัดสิน (R-09) |
| ฝั่งหน่วยบริการ: ติดตามเรื่อง (ผู้รับผิดชอบ/สถานะ 3 ค่า/บันทึก) | api.md มีแค่ `POST /provider/alerts/:id/contacted` | อยู่ใน prototype; mapping จากสถานะ UI ไป alert contract รอตัดสิน (R-10) |
| ฝั่งหน่วยบริการ: เพิ่มแพทย์ + รูป + สีการ์ด | data-model มี `staff` แต่ไม่มี photo/color · อยู่ใน P2? | อยู่ใน prototype; staff management/photo/color รอตัดสิน (R-11) |
| กรมฯ: ลิงก์ "ระบบหน่วยบริการ" ใน sidebar → `/clinic` | สลับฝั่งโดยตรง (api: คนละ role) | ทางลัดตรวจ prototype; ต้องตรวจ role จริงก่อน production (R-12) |
| Dev-only: panel `MobileFlowShortcuts` | แสดงเมื่อ `NODE_ENV !== 'production'` (`ruenfai/layout.tsx`) | – (dev) |

## 5. Data shape ใน mock vs API spec

> ใช้เป็นตาราง mapping ตอนต่อ `hc<AppType>` · "ไม่มีใน api.md" = ต้องให้ design/owner ตัดสิน ว่าเพิ่มใน spec หรือตัดจาก UI
> `apps/api/src/index.ts` ตอนนี้มีแค่ `GET /health` · `api.md` §4 อ้าง `apps/api/src/types.ts` แต่ไฟล์นี้ยังไม่มี

### 5.1 `careDemo.appointments` (`Appointment` ใน `provider/design-preview/mock-data.ts:1`) — localStorage `reuanfai-care-demo-v1`

| field ใน mock | ค่าที่ใช้ | field ใน api.md | หมายเหตุ |
|---|---|---|---|
| `id` | `'J10'`, `'booking-<uuid>'` | `appointment.id` | UI ใช้ id ปนกับรหัสแม่ |
| `name` (optional, fallback `id`) | `'A12'`, `'M01'` | `displayCode` (`GET /provider/queue`) | |
| `phone` | string | **ไม่มีใน api.md** | PII · ค้นหาในรายการนัดหมายใช้ field นี้ (`page.tsx:521`) |
| `day`, `month` (0–11), `year` (พ.ศ.) | วันที่นัด | `slot.starts_at` (data-model) | **ชื่อชน**: `day` ใน mock = วันที่ในเดือน แต่ `day` ใน queue row = วันหลังคลอด |
| `time`, `endTime`, `endDate` | `'HH:mm'` | `time` (queue) | api.md ไม่มี end time |
| `services` | string คั่นจุลภาค `'นวดไทย, ประคบสมุนไพร'`, `'นัดประเมิน'` | `procedures` (array of `Procedure`) , `kind` = `eval` | label ไทย ↔ enum `massage/compress/salt_pot/steam/hot_stone/eval` |
| `birth` | `'คลอดทางช่องคลอด'`/`'ผ่าคลอด'` | `method` (`DeliveryMethod`) | UI มี 2 ค่าฝั่ง provider · ฝั่งแม่มี 4 ค่า |
| `postpartum` | จำนวนวัน | `day` (queue) | |
| `visit` | 1–5 | `quotaNo` | "ครั้งที่ N จาก 5" (`page.tsx:524`) |
| `rights` | boolean | `eligibility: checked\|unchecked` | ต้องยืนยัน: UI ผูกกับ "ตรวจสิทธิ์" ของ P5 |
| `status` | `ยืนยันแล้ว/รอยืนยันนัด/รอประเมิน/บันทึกแล้ว/ยกเลิก` | `AppointmentStatus` = confirmed/pending/awaiting_eval/done/cancelled | UI ไม่มี `rescheduled`, `no_show`, `referred` |
| `screening` | `'ผ่าน'`/`'ให้ประเมิน'`/`'ไม่แน่ใจ 1 ข้อ'` | `screening: pass\|evaluate\|unsure_n\|checkin_changed` | UI ไม่มี `checkin_changed` · จำนวน unsure ฝังในข้อความ |
| `illustration` | 0–2 | – | UI-only |
| `doctor` | ชื่อแพทย์ | **ไม่มีใน queue row** | อยู่ที่ `slots.practitioner_id` |

### 5.2 `careDemo.bookings` (`Booking`) ← `saveBooking` (`design/care-demo.ts:52`)

| field | api.md `POST /me/appointments` | หมายเหตุ |
|---|---|---|
| `unit` (ชื่อ string) | `unitId` | UI ส่งชื่อ ไม่ใช่ id |
| `date` + `time` (เลือกรายชั่วโมงเอง) | `slotId` | ต้องมาจาก `GET …/availability` |
| `services[]` (label ไทย) | `procedures[]` | map เป็น enum |
| `rights` (บัตรทอง/ประกันสังคม/…) | **ไม่มีใน body** (มี `coverage?` ใน `PUT /me/profile`) | ต้องยืนยันว่าเลือกตอนจองหรือตอนโปรไฟล์ |
| – | `kind`, `shareSummary` | **UI ไม่มี `shareSummary`** (M6-4 ต้องติ๊กแชร์เอง) · `kind` UI ไม่ระบุ |
| `patient` (hard-code `'M01'`), `id` | – | |

### 5.3 `careDemo.prescriptions` (`Prescription`) ← `savePrescription`

| field | api.md `POST /provider/prescriptions` | หมายเหตุ |
|---|---|---|
| `medicine` (ชื่อ) | `drugId` | |
| `dose` | `dose` | |
| `frequency` (ข้อความ เช่น `07:00 12:00 18:00`) | `method` | `useMedicines.ts:14` ดึงเวลา `HH:mm` จากข้อความนี้ไปทำรอบยาฝั่งแม่ |
| `duration` | `days` | |
| `amount` (จำนวนจ่าย) | **ไม่มีใน body** | ต้องยืนยันว่าเซิร์ฟเวอร์คำนวณหรือรับจาก UI |
| `patient` (รหัสแม่) | `appointmentId` | UI ผูกกับรหัสแม่ ไม่ใช่นัด |
| – | `decision` | **UI ไม่มี** |
| `id`, `date` (ISO) | – | server กำหนด |

### 5.4 `careDemo.medicines` / `initialMedicines` (`Medicine`, `mock-data.ts:28`)

| field | api.md inventory row | หมายเหตุ |
|---|---|---|
| `name` | `drug` | 11 รายการ ตรงกับ "11 รายการ" ของ `GET /provider/drugs` |
| `quantity` | `qty` | |
| `unit` (ซอง/ห่อ/ขวด/…) | `unitLabel` | |
| `lot`, `expiry` | `lot`, `expiry` | UI ใช้ 1 lot ต่อยา · api เป็นราย lot (FEFO) |
| `threshold` | `reorderPoint` | **UI ไม่ใช้ค่านี้ตัดสิน** — ใช้ค่าคงที่ `LOW_STOCK_LIMIT = 10` (`mock-data.ts:56`) และยาที่เพิ่ม/แก้ตั้ง `threshold` = 10 |
| `days` (เหลืออีกกี่วันก่อนหมดอายุ) | – (คำนวณจาก `expiry`) | เกณฑ์ใกล้หมดอายุ `< 60` วัน (`mock-data.ts:57`) |
| สถานะ ปกติ/ใกล้หมด/หมด/ใกล้หมดอายุ | `state` | |
| `benefits` | **ไม่มี** (`drugs` ใน data-model: code, name, unit_label, group, reorder_point) | |
| `image` (data URL อัปโหลดได้) | **ไม่มี** | |

### 5.5 `motherProfile` (`design/care-demo.ts:42`) + state ใน `MotherForm.tsx` / `SymptomsForm.tsx`

| field | api.md `PUT /me/profile` | หมายเหตุ |
|---|---|---|
| `deliveryDate` (`YYYY-MM-DD`) | `deliveryDate` | ✅ |
| `birth` (label 4 ค่า: คลอดปกติ/ใช้อุปกรณ์ช่วยคลอด/ผ่าคลอด/ผ่าคลอดและทำหมัน) | `deliveryMethod` | ตรง `DeliveryMethod` 4 ค่า (map label→enum) |
| โรคประจำตัว (7 ค่า + "ไม่มี") | `chronic[]` | ตรง `Chronic` · **ไม่ถูกบันทึก** |
| ประวัติแพ้สมุนไพร (มี/ไม่มี/ไม่แน่ใจ + ชื่อสมุนไพร[] + note) | `herbalAllergy` | `answer` ตรง · **ชื่อสมุนไพร[] ไม่มีใน api.md/data-model** · **ไม่ถูกบันทึก** |
| ประวัติครรภ์เป็นพิษ (มี/ไม่มี/ไม่แน่ใจ + note) | `preeclampsia` | **ไม่ถูกบันทึก** · note ไม่มีใน api.md |
| ยาที่ใช้ประจำ (มี/ไม่มี/ไม่แน่ใจ + ชื่อยา[] + note) | `regularMeds` (data-model: `text`) | UI เป็น answer + รายการ ไม่ใช่ text · **ไม่ถูกบันทึก** |
| สิทธิการรักษา (ยังไม่ระบุ/บัตรทอง/ประกันสังคม/สิทธิข้าราชการ/ชำระเงินเอง) | `coverage?` | **ไม่ถูกบันทึก** |
| หน่วยบริการที่สะดวก (ชื่อ string) | `preferredUnitId?` | **ไม่ถูกบันทึก** · ส่งชื่อ ไม่ใช่ id |
| `phone`, `emergencyPhone` | **ไม่มีใน api.md** และไม่มีใน `mothers` (data-model) | `emergencyPhone` ถูกใช้ใน dialog ฉุกเฉิน (§2.2) |
| คำตอบคัดกรอง 20 ข้อ (`มี/ไม่มี/ไม่แน่ใจ` + note) | `POST /me/screenings` `answers[{qid,value,note?}]` | UI ไม่มี `qid` · map ลำดับ 7/6/7 → A1,A1a,A2–A6 / B1–B6 / C1,C2,C3,C5,C6,C7,C8 จาก text (`SymptomsForm.tsx:7-31` ตรงกับ `rules.md` §2) |

### 5.5b อื่น ๆ ฝั่งแม่

| store | field | ตรงกับ api.md | หมายเหตุ |
|---|---|---|---|
| `medicines/data.ts` (6 ยา) | `name`, `benefit`, `times[]`, `form`, `art` | `GET /me/meds` → `prescriptions[{drugName, from, to}]`, `today[{doseId, label, drugName, takenAt}]` | `benefit`, `form`, `times`, `art` ไม่มีใน api.md · เวลา 07:00/12:00/18:00 เป็นตัวอย่าง (โค้ดกำกับไว้) · ข้อความ `benefit` **ไม่ตรงกับ** `Medicine.benefits` ฝั่ง provider (เช่น ยาเลือดงาม, ยาไฟห้ากอง) → ควรมีแหล่งเดียว |
| `MedicineState.tsx` | `taken[]` key `${date}:${ยา}:${เวลา}` | `doseId` + `takenAt` | in-memory |
| `JournalState.tsx` | `Entry {id,date,title,body,mood}` mood ∈ เครียด/เหนื่อย/เรื่อย ๆ/สบายใจ/มีความสุข | **ไม่มีใน api.md** | in-memory |
| `ruenfai/page.tsx` | `scheduledAppointments`, จุดบนปฏิทิน | `GET /me/calendar` → `days[{date,status,dots,procedures}]`, `cards` | UI ไม่มี `status`, `procedures: Record<Procedure, ProcStatus>` |
| `ResultsSummary.tsx` | `{name,status,kind,art,description}` ×6 | `EvaluateResult` (rules.md §8) | ขาด `reasons[]`, วันเริ่ม, หน้าคู่มือ |

### 5.6 `demo-reviews.ts` (`DemoReview`) — localStorage `reuanfai-demo-reviews-v1`

| field | api.md | หมายเหตุ |
|---|---|---|
| `scores[4]` = [การอธิบาย, ความสะอาด, เวลารอ, โดยรวม] | `ratings{explain, clean, wait, overall}` | ✅ ลำดับตรง · ค่า 1–5 (validate ใน `validReview`) |
| `comment` | `text?` | ถ้าว่าง UI ใส่ `'ให้คะแนนหลังรับบริการ'` แทน (`review/page.tsx:17`) |
| `issue?` | `adverse`, `adverseText?` | ฝั่งแม่ **ไม่มีช่องให้กรอก** (มีเฉพาะข้อมูลตัวอย่างฝั่ง provider) |
| – | `painAfter` | **UI ไม่มี** |
| `id`, `patient`, `date`, `service` | – | server derive จาก appointment · UI hard-code `patient 'M01'`, `service 'นวดไทย'` |
| `doctor` | – | **api.md/data-model ไม่เก็บแพทย์ใน reviews** · UI hard-code `doctors[0]` และฝั่ง provider ใช้กรอง (ดู §6) |
| `topic`, `topics[]` | `themes` (AI-2) | UI hard-code `'โดยรวม'` · ฝั่ง provider ใช้เป็นหมวด |

### 5.7 `mock-data.ts` อื่น ๆ

| ตัวแปร | ค่า | หมายเหตุ |
|---|---|---|
| `doctors` | 3 ชื่อ (`พท. …`) | ใช้ใน calendar, appointment, reviews |
| `services` | นวดไทย, ประคบสมุนไพร, ทับหม้อเกลือ, อบสมุนไพร, นัดประเมิน | ไม่มี ก้อนเส้า (ฝั่งแม่มี) |
| `activities` | 5 รายการพร้อมรหัสฝังใน label เช่น `ทับหม้อเกลือ (9007712)` | → `activityCodes[]` ต้อง parse รหัส · `Q8` รหัสต้องเช็ก สปสช. (SPEC.md) |

## 6. ช่องโหว่ต่อ DESIGN-REVIEW §1 ที่เห็นจากโค้ด

> เฉพาะข้อที่ตรวจจากโค้ดได้ · เทียบ `DESIGN-REVIEW.md` §1 · ไม่ใช่ผล review รอบทางการ
> สรุป: ✅ 7 · ❌ 10 · ต้องยืนยัน 1 · ตรวจไม่ได้ 1
> รอบนี้ไม่เปลี่ยน ❌ เป็น ✅ เพราะไม่ได้แก้โค้ดของข้อเหล่านั้น; หลักฐานด้านล่างตรวจเทียบ source ปัจจุบัน การตัดแหล่งอ้างอิงจากหน้า design-system ไม่ได้ปิดข้อค้าง product

| # | ข้อ (DESIGN-REVIEW §1) | เห็นในโค้ด | หลักฐาน |
|---|---|---|---|
| 1 | ไม่มีคำว่า "ปลอดภัย" ในผลคัดกรอง | ✅ ไม่พบในโค้ดฝั่งแม่ (พบแค่ชื่อเมนูกรมฯ "ความปลอดภัย") | `ruenfai/**` ไม่มี · `department/design-preview/page.tsx:11` |
| 2 | ข้อความ "ผลจากข้อมูลที่คุณแจ้ง · ไม่ใช่ผลการวินิจฉัย" | ❌ ไม่พบข้อความนี้ในทั้ง `src` | `ruenfai/onboarding/ResultsSummary.tsx:22-24` (หัวข้อ "ผลการประเมิน" + คำอธิบายอื่น) |
| 3 | ปุ่ม มี/ไม่มี/ไม่แน่ใจ ขนาดเท่ากัน สีเดียว ไม่ใช้แดง/เขียว | ✅ 3 คอลัมน์เท่ากัน สไตล์เดียว | `ruenfai/onboarding/SymptomsForm.tsx:48` · `onboarding.module.css:111` |
| 4 | ตัวเลือกที่กดแล้วใช้ขอบหนาสีเข้ม ไม่ใช้แดง/เขียว (M2) | ❌ ใช้พื้นม่วงอ่อน `#e0d8fa` + ตัวอักษร `#4328bd` และ `border-color: transparent` (ไม่ใช่แดง/เขียว ✅ แต่ไม่ใช่ขอบหนา) | `onboarding.module.css:59,90` |
| 5 | ProcStatus 4 แบบ (ทำได้/ให้ประเมินก่อน/ยังไม่ถึงกำหนด+วันเริ่ม/ห้าม) | ❌ มี 3 แบบ ขาด `ยังไม่ถึงกำหนด` · คำเป็น "รอการประเมิน" ไม่ใช่ "ให้ประเมินก่อน" · สี "รอประเมิน" เป็นเหลืองน้ำตาล `#8A640D` บน `#FFF3CC` (spec: ส้มอิฐ; token warning `#985018`) · "ห้าม" เป็นตัวแดงบน pill ชมพู (ไม่ใช่พื้นแดงทั้งกล่อง ✅) | `ResultsSummary.tsx:8-15` · `results.module.css:26` |
| 6 | ทุกหน้าฝั่งแม่มีปุ่ม "ติดต่อด่วน" มุมขวาบน สูง ≥ 48px | ❌ ขนาด 56px ✅ แต่อยู่ใน bottom nav (fixed ล่าง) ไม่ใช่มุมขวาบน · เป็นไอคอนไม่มีข้อความ (`aria-label="ติดต่อฉุกเฉิน"`) · **ไม่แสดงใน `/ruenfai/onboarding` และ `/ruenfai/review`** | `ruenfai/BottomNav.tsx:14` · `ruenfai/page.module.css:29,64` |
| 7 | ปุ่มหลักกว้างเต็มจอและอยู่ล่างสุด | ✅ `width:100%` `min-height:48px` · footer `position:fixed; bottom:0` | `ruenfai/foundation.module.css:20-33` · `onboarding.module.css:30` · `results.module.css:9` |
| 8 | หัวคำถาม 22–24px | ❌ หัวข้อช่วง (h1) 24px ✅ แต่ตัวคำถามรายข้อ (legend) 14px/500 | `onboarding.module.css:81` · `onboarding.module.css:88` |
| 9 | ผล/กฎทุกข้อแตะแล้วเห็นเหตุผล + เลขหน้าคู่มือ (ADR-0002) | ❌ การ์ดผลเป็น `<article>` ไม่มี handler · ไม่มีข้อมูลเหตุผล/เลขหน้า | `ResultsSummary.tsx:26` |
| 10 | ผลจาก AI มีป้าย "ข้อเสนอจาก AI" / "สรุปโดย AI" — กรมฯ | ✅ เมนู/หัวหน้า "ข้อเสนอจาก AI" · "สรุปโดย AI · จำลอง" ที่ประเด็นจากความคิดเห็น | `department/design-preview/page.tsx:11,69` |
| 11 | ผลจาก AI มีป้าย — หน่วยบริการ (P8 "สรุปโดย AI") | ❌ ประเด็นจากความคิดเห็นมีแค่ "จัดหมวดตัวอย่าง" ไม่มีป้าย AI | `provider/design-preview/ReviewsPanel.tsx:55` |
| 12 | ฝั่งหน่วยบริการมีป้าย "ข้อมูลจำลอง" | ❌ ไม่พบคำว่า "จำลอง" ใน `provider/design-preview/*.tsx` (มีแค่ "ข้อมูลตัวอย่าง" ใน dialog รีวิว และ "พรีวิว" ในข้อความประวัติคลัง) | `provider/design-preview/page.tsx:537` (header sidebar ไม่มีป้าย) · `ReviewsPanel.tsx:58` |
| 13 | ฝั่งกรมฯ มีป้าย "ข้อมูลจำลอง" | ✅ ป้าย "จำลอง · ข้อมูลรวมไม่ระบุตัวบุคคล" ข้างหัวข้อทุก view | `department/design-preview/page.tsx:67` |
| 14 | ตัวเลขกรมฯ มี "(จำลอง)" | ต้องยืนยัน — มีเฉพาะบางการ์ด ("คะแนนจากชุดข้อมูลจำลอง", "รายงานจำลอง", "ข้อมูลจำลอง") · KPI หลักของ view 0 ไม่มี | `department/design-preview/page.tsx:68,69,70,71` |
| 15 | ฝั่งกรมฯ n<5 แสดง "น้อยกว่า 5" | ✅ ฟังก์ชัน `masked` ใช้กับจำนวนที่คำนวณ (อัตราร้อยละ/ค่ามัธยฐานที่ hard-code ไม่ผ่าน `masked`) | `department/design-preview/page.tsx:65` (ใช้ที่ `:60,68,70,71,73`) |
| 16 | ไม่มีหน้าไหนจัดอันดับหรือให้คะแนนแพทย์รายคน | ❌ รีวิวมีตัวกรอง "แพทย์", แสดงชื่อแพทย์ในแถว/dialog, เรียงตาม "บริการ / แพทย์" → ดูคะแนนรายแพทย์ได้ · ฟอร์มรีวิวฝั่งแม่ไม่ถามแพทย์ ✅ แต่บันทึก `doctor: doctors[0]` ทุกรีวิว | `ReviewsPanel.tsx:57,58,45` · `ruenfai/review/page.tsx:17` · `provider/design-preview/mock-data.ts:7` |
| 17 | ชื่อคุณแม่ฝั่งหน่วยบริการเป็นชื่อย่อเท่านั้น | ✅ แสดง "คุณแม่ {รหัส}" (A12, B07, M01) — แต่ช่อง "เพิ่มนัดหมาย" รับ free text + เบอร์ และใบสรุปเคส/รายการนัดแสดงเบอร์ติดต่อ (ต้องยืนยันกับ ADR ว่าให้แสดงได้หรือไม่) · spec ตัวอย่าง "แม่ B07" ต่างจาก "คุณแม่ B07" | `mock-data.ts:10-24` · `provider/design-preview/page.tsx:524,516,522,577,592` |
| 18 | ชื่อหน่วยบริการ/ยาในเดโมเป็นชื่อสมมติ ("(ตัวอย่าง)") | ❌ ฝั่งแม่ใส่ "(ตัวอย่าง)" ✅ แต่ฝั่งหน่วยบริการ "ศูนย์แพทย์แผนไทย" และแพทย์ `พท. พิมพ์ชนก ใจดี…` ไม่มี · กรมฯ "หน่วยบริการ ก–จ" · ชื่อยาเป็นชื่อตำรับจริง 11 รายการ (ต้องยืนยันว่าถือเป็นชื่อสมมติหรือไม่) | `BookingForm.tsx:13` · `MotherForm.tsx:39` · `provider/design-preview/page.tsx:537` · `mock-data.ts:7,29` · `department/design-preview/page.tsx:12` |
| 19 | ข้อความในแชท LINE ไม่มีชื่อโรค/ยา/ผลคัดกรอง (ADR-0006) | ตรวจไม่ได้ — ยังไม่มีโค้ดแจ้งเตือน/LINE | – |

นอก §1 แต่เกี่ยวข้อง: ADR-0012 ให้ UI บอกว่า "นับสิทธิ์เฉพาะครั้งที่จองผ่านเรือนไฟ" — ไม่พบข้อความนี้ในโค้ด (grep "ผ่านเรือนไฟ" ไม่พบ) — คงเป็นข้อค้างด้าน copy ก่อน production

## 7. Design ที่ต่างจาก spec / ข้อเสนอให้เจ้าของตัดสิน

ตารางนี้บันทึกความต่างของ prototype ไม่เปลี่ยน spec/ADR และไม่ถือว่าข้อเสนอได้รับอนุมัติ

| ID | ต่างจาก spec ตรงไหน | เหตุผลของ prototype / หลักฐาน | ข้อเสนอ |
|---|---|---|---|
| R-01 | ใช้ `/ruenfai`, `/clinic`, `/department` และ state ใน route เดียว แทน production paths; aliases growth/baby/profile ไม่ใช่ feature ตามชื่อ | แยกพื้นที่ตรวจ UI จาก foundations เดิม; `ruenfai/BottomNav.tsx:14`, `clinic/page.tsx:1`, `department/page.tsx:1`; `/dtam` คงว่างตามขอบเขตงาน | ให้ owner เลือกคง paths ตาม spec หรือเสนอ screen-map ใหม่; อย่า redirect/rewrite production โดยอัตโนมัติ |
| R-02 | M3 แสดงทีละช่วง 7/6/7 ถามทุกข้อ ไม่มี askIf/auto-next/unsure call/refer | ผู้ใช้เลือกแบบฟอร์มรวมต่อช่วงและคงคำตอบเมื่อย้อนกลับ; `ruenfai/onboarding/SymptomsForm.tsx:7`, `:33`, `:48` | คง rules engine ตาม spec; review UX ที่ต้องแสดงเงื่อนไข/refer ก่อนเชื่อม API |
| R-03 | M4 ผลตัวอย่างมี 3 สถานะ ไม่มี not_yet/reasons/หน้าคู่มือ; badges/static cards และคำกำกับยังต่างจาก spec | ผู้ใช้เลือก cards บอกสถานะและตัดรายละเอียดคลิก; `ruenfai/onboarding/ResultsSummary.tsx:8`, `:26` | owner review ความต่างนี้; ต้องส่ง reasons/manual page และข้อความไม่ใช่วินิจฉัยตาม spec ก่อน production |
| R-04 | M6 รวม unit/procedure/rights/date/time หน้าเดียว ไม่มีสิทธิ์บนสุด/checkbox share/errors ครบ; อบ disabled แทนจองนัดประเมิน | ผู้ใช้เลือก single-page booking + confirmation + success; `ruenfai/onboarding/BookingForm.tsx:12`, `:22` | ตัดสิน single-page vs 4 routes; review quota/referral/consent/error states โดยใช้ contract เดิม |
| R-05 | Journal/mood ไม่มีใน screen-map หรือ API | ผู้ใช้เลือกแท็บบันทึกและการสร้างบันทึกรายวันใน prototype; `ruenfai/journal/page.tsx:1`, `ruenfai/JournalState.tsx:1` | owner ตัดสิน scope/persistence/consent; ไม่เพิ่ม API จาก UI เอง |
| R-06 | Design-system เป็น route เปิดได้ใน production build | เครื่องมือ tokens/component preview; `dtam/design-system/page.tsx:1` | owner ตัดสินให้อยู่ dev-only หรือเปิดเป็นเอกสารทีม; ยังไม่เปลี่ยน config/auth |
| R-07 | เบอร์แม่/ฉุกเฉิน required แต่ API ไม่มี; emergency อยู่ล่าง/ไม่แสดง onboarding-review และไม่มี 7 อาการ/unitPhone | ผู้ใช้เลือกสองเบอร์และ bottom-nav contact sheet; `ruenfai/onboarding/MotherForm.tsx:1`, `ruenfai/BottomNav.tsx:14`, `src/design/care-demo.ts:42` | review ขอบเขตข้อมูล/consent และ emergency UX ตาม M12; อย่าขยาย schema โดยอัตโนมัติ |
| R-08 | Staff สร้างนัดเองด้วย free text/เบอร์ แต่ API ไม่มี create route | prototype สำหรับตรวจการเพิ่มนัด/agenda; `provider/design-preview/page.tsx:592` | กำหนด role/displayCode และ contract โดย owner ก่อน production |
| R-09 | เพิ่ม/แก้ยา/รูป และรับยาเข้าแทน lot เดิม ไม่ใช่ FEFO หลาย lot | prototype inventory; `provider/design-preview/page.tsx:581`, `src/design/care-demo.ts:65` | production ใช้ lot/receive/adjust ตาม spec; CRUD ใหม่รอ owner |
| R-10 | รีวิวกรองแพทย์/มีชื่อแพทย์ และติดตามเรื่องเกิน contacted; ฝั่งแม่ขาด painAfter/adverse | prototype review metrics/comments; `provider/design-preview/ReviewsPanel.tsx:45`, `:57`, `ruenfai/review/page.tsx:17` | review ให้เป็น unit-level ตาม spec ไม่สร้างคะแนนรายแพทย์; ตัดสิน field/alert mapping |
| R-11 | เพิ่มแพทย์/รูป/สีแทน template duration/capacity/start-days | calendar prototype; `provider/design-preview/ScheduleCalendar.tsx:1` | review P2 ที่ยังขาด และ staff-management scope |
| R-12 | Department ใช้ careDemo รายคนร่วมกับ mock aggregate; filters 2 delivery methods/ไม่มี 12m; รวม D4/D6 กับหน้าสรุป | prototype 5 views; `department/design-preview/page.tsx:46`, `:67` | production ใช้ agg endpoints และ role isolation ตาม spec; owner ตัดสิน filters/route grouping/ทางลัด clinic |
| R-13 | เลือกด้วยพื้น lavender แทนขอบหนา; คำถามรายข้อ 14px แทน 22–24px; ป้ายจำลอง/copy ยังไม่ครบ | ใช้ controls กระชับตาม refinement; `ruenfai/onboarding/onboarding.module.css:90`; §6 ข้อ 4,8,11,12,14,18 | review typography/selection/copy กับ DESIGN-REVIEW โดยคงรายการค้างตามหลักฐาน |

## 8. dev ทำต่อได้เลย vs ต้องรอ

อ้างอิง `CLAUDE.md` กฎข้อ 2: backend ที่ไม่ขึ้นกับ design ทำตาม spec ได้ · หน้าจอรอ `DESIGN-REVIEW.md`

**ทำต่อได้เลย (ไม่ขึ้นกับ design)**
- schema/migrations ตาม `data-model.md` + `supabase/seed.sql` ข้อมูลจำลอง (ADR-0012)
- rules engine (pure, deterministic — ADR-0001) ตาม `rules.md` §2 รวมเงื่อนไข `askIf` (16–19 ข้อ) — UI ปัจจุบันถามครบ 20 ข้อ จึงต้องไม่ยึด UI เป็นข้อกำหนด
- booking transaction, quota, referral lock, stock FEFO, access_log, state machine ของ `appointments` (`data-model.md` §3)
- route ใน `api.md` ทั้งหมดบน `apps/api` (chain บน app เดียว) + สร้าง `apps/api/src/types.ts` (ยังไม่มี) พร้อม type ที่ re-export
- adapter/enum mapping label ไทย ↔ enum ตาม §5 (วิธีคลอด, หัตถการ, สถานะนัด, screening) เป็น type ใน api เพื่อให้ web ใช้ต่อ
- รัน test เดิมของฝั่ง web: `node --test apps/web/tests/*.mjs` (15 ผ่านตอนร่างเอกสารนี้; ยังไม่ผูกกับ `pnpm` script ใด)

**ต้องรอ (design review / ตัดสินใจ)**
- ต่อ `hc` เข้าหน้าจอทุกแถวใน §2 — ต้องรอ phase นั้นผ่าน `docs/design-review/` ก่อน
- M3: รูปแบบถามทีละข้อ vs ทีละช่วง + กลไก unsure/refer → M4-R (§2.2, §3)
- M4: สถานะที่ 4 `not_yet`, เหตุผล/เลขหน้า, ข้อความกำกับผล (§6 ข้อ 2, 5, 9)
- ปุ่มติดต่อด่วน (ตำแหน่ง, แสดงทุกหน้า, หน้า M12 เต็ม) (§6 ข้อ 6)
- M6 แยก 4 หน้าตาม spec หรือรวมหน้าเดียว (R-01 + §2.2)
- ฟิลด์ที่ api.md ไม่มี: `phone`/`emergencyPhone`, ชื่อสมุนไพรที่แพ้, `benefits` ของยา, create/edit drug, staff สร้างนัดเอง, journal (§4, §5) — ต้องมี ADR/แก้ spec ก่อนทำ API
- P8: ตัวกรองแพทย์, n<5, ป้าย "สรุปโดย AI" (§6 ข้อ 11, 16)
- ป้าย "ข้อมูลจำลอง" ฝั่งหน่วยบริการ และ "(ตัวอย่าง)" ชื่อหน่วย/แพทย์ (§6 ข้อ 12, 18)
- กรมฯ: ตัวกรอง 12 เดือน/วิธีคลอด 4 ค่า, D8, และ view ปัจจุบันอ่านข้อมูลแม่รายคนจาก `careDemo` (`department/design-preview/page.tsx:46-54`) — production ต้องใช้ `agg_*` เท่านั้น (ADR-0008)

## 9. งานออกแบบที่ต้องเพิ่มตาม spec ของเดฟ

อ่านร่วมกับ `docs/SPEC.md` §6, `docs/specs/screen-map.md`, `docs/specs/api.md` และ §6–7 ของเอกสารนี้ ตารางนี้เป็น backlog สำหรับคุยกับทีม ไม่ใช่การอนุมัติแก้ backend หรือ spec

| ลำดับ / phase | สิ่งที่มีแล้ว | สิ่งที่ designer ต้องเพิ่ม/ปรับ | สิ่งที่ต้องให้ dev/owner ยืนยัน |
|---|---|---|---|
| 1 · Phase 1 · M1/M2 | consent 2 ข้อ, maternal form, required gating | consent save/loading/error; โหมดแก้ profile พร้อมข้อความว่าคำนวณผลและนัดใหม่เมื่อแก้วัน/วิธีคลอด; selected border และขนาดหัวคำถามตาม review | contract ของ phone/emergencyPhone และข้อมูลที่ต้องเก็บ; ตัดสิน UX ที่ต่างใน R-07/R-13 |
| 2 · Phase 1 · M3/M4-R | คำถาม/หมายเหตุ 7/6/7 | แสดงตาม askIf, ทางเลือกไม่แน่ใจพร้อมโทรปรึกษา, การ์ด 1323; **หน้า M4-R** มีเหตุผลส่งต่อ/ติดต่อโรงพยาบาล/สถานะติดต่อแล้ว/การจองถูกล็อก; ไม่ใส่ปุ่มจองบนหน้าส่งต่อ | ใช้ Question IDs/effects จาก API/rules; owner ตัดสินทีละข้อ vs ทีละช่วง; Q1/Q7 ยังเปิด ไม่เดาเกณฑ์เอง |
| 3 · Phase 1 · M4 | results cards ตัวอย่าง 3 สถานะ | `ok/evaluate/not_yet/forbidden` ครบ, วันเริ่ม, เหตุผล+เลขหน้าคู่มือ, ข้อความ “ผลจากข้อมูลที่คุณแจ้ง · ไม่ใช่ผลการวินิจฉัย”; นัดประเมินเมื่อ evaluate | ผลมาจาก EvaluateResult ไม่ใช่คำนวณ clinical rules ใน UI; lactation เป็นบริการตัวอย่างที่ยังไม่มี enum ใน rules.md ให้ owner ตัดสิน |
| 4 · Phase 1 · M5/M12/M0 | calendar/timeline และ emergency sheet | calendar cards/status/day/deadline ตาม API; ข้อความชวนเช็กอินเมื่อหายเกิน 3 วัน; ติดต่อด่วนทุกหน้ามุมขวาบน ≥48px, 7 อาการส่งต่อ/unitPhone/session expired; rich menu LINE หากอยู่ใน scope design | ตัดสินตำแหน่ง emergency ที่ต่างจาก prototype; LINE แสดง notification เท่านั้น ไม่ใส่ชื่อโรค/ยา/ผล |
| 5 · Phase 2 · M6/M7 | single-page booking, confirmation, local success และ appointment cards | แถบสิทธิ์/หน่วยที่เลือก, นัดประเมินสำหรับอบ, availability states, shareSummary checkbox ไม่ pre-check; errors quota_exhausted/slot_full/referral_locked/outside_window/same_day; upcoming/history, เลื่อน/ยกเลิก | ตัดสิน single-page vs 4 routes; UI รับ quota/window/slotId จริงจาก API ไม่มีการเดาสิทธิ์หรือจำนวน slot |
| 6 · Phase 2 · M8 | ยังไม่มี | **หน้าเช็กอินก่อนนัด** 5 คำถาม + pain และผล unchanged/awaiting_eval/referred; loading/error; entry จากนัด/notification; course check-in รายวัน | ใช้ check-in questions/outcome จาก API และ Q5; จัด banner หน่วยบริการเมื่อ awaiting_eval |
| 7 · Phase 2 · P1–P5 | login visual, calendar/queue/case/treatment preview | role/unit/login errors; duration/capacity/start-days/template; awaiting_eval banner, confirm/propose; share-expired/no-access และ unlock action; treatment success/error/warnings | auth/role/access_log/referral unlock เป็นงาน dev; doctor แก้ตารางตนเอง, staff confirm/propose; ยืนยัน routing/fields ก่อนต่อ API |
| 8 · Phase 3 · P6/P7/M9 | prescribe/stock deduction demo, inventory, medicine rounds | warnings ยา 4 กลุ่มพร้อม ref และ action เปลี่ยนยา/รับทราบและยืนยัน; stock shortage states; lot/expiry/FEFO display; M9 mode per_dose/daily + ปุ่มอาการผิดปกติและผลหยุดเตือน/แจ้งหน่วย | Q3 ยังเปิด; ไม่สร้างคำสั่งยาใหม่เอง; stock transaction/notification/permissions เป็นงาน dev |
| 9 · Phase 4 · M10/D1/D7 | 4 ratings/comment, department overview/AI cards | painAfter + adverse/adverseText; appointment-bound review; D1 KPI “(จำลอง)”/suppressed state ทุกประเภท; D7 6 ส่วน, comment และ decision loading/error, ข้อมูลยังน้อยเมื่อ <30 | staff_alert และ aggregate-only response; ไม่ให้คะแนนแพทย์รายคน; rules draft เป็นงาน dev/owner |
| 10 · Phase 5 · M11/P8/D2–D6 | provider reviews, department grouped views | **M11 จัดการแชร์/ถอน consent/ลบข้อมูลพร้อม confirmation**; P8 insufficient เมื่อ n<5 และ label สรุปโดย AI; filters มาตรฐาน 3m/6m/12m และ DeliveryMethod 4 ค่า; loading/empty/error ของแต่ละ view | owner ตัดสิน D4/D6 แยกหน้าหรือรวม; aggregate consent/role boundary; journal/CRUD เพิ่มเติมรอตกลงใน §7 |
| 11 · Phase 6 · D8 | ยังไม่มี | ruleset version/diff/approve/reject/history สำหรับ rule_approver | อยู่ลำดับท้ายตาม spec; ยังไม่ต้องนำหน้าข้อค้าง Phase 1–4 |

**ลำดับคุยกับทีมก่อนออกแบบเพิ่ม:** M3/M4-R/M4 → M6/M8 → P2/P3/P4 → P6/M9 → M10/D1/D7; ปรับ copy/ป้ายจำลองใน §6 ควบคู่กัน ส่วนงานนอก screen-map ให้ตัดสิน scope ใน §7 ก่อน

**ทุกหน้าที่ต่อ API ต้องส่ง state เพิ่ม:** loading, empty, success, validation และ errors ที่ endpoint คืนจริง พร้อม keyboard/focus/reduced-motion ที่ใช้ใน UI เดิม เทสต์ 15 รายการของ frontend demo ไม่ใช่หลักฐานว่ารายการข้างต้นครบแล้ว
