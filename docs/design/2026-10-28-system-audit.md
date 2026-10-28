# ตรวจระบบและเอกสารส่งมอบ — 28 ตุลาคม 2569

เอกสารสรุปสำหรับเดฟจากการอ่าน source, Git history, เอกสารเดิม และตรวจ local browser รอบนี้ ไม่ใช่ผลรับรองระบบ production/ข้อมูลทางคลินิก และไม่เปลี่ยน developer-owned specs/ADRs

## 1. โค้ดที่ตรวจและลำดับการอ่าน

| ชุดงาน | ฐานที่ตรวจ | สิ่งที่มีเฉพาะชุดนี้ |
|---|---|---|
| worktree `9728/reuanfai` / พอร์ต 3001 | `7f38980` + diff ปัจจุบัน | 6 การ์ดบริการคงที่, 8 stage, copy/สี/Chevron, ระยะ PageHeader ≤24px, focus แชต |
| checkout `Documents/GitHub/reuanfai` / พอร์ต 3000 | `2f49d3e` เมื่ออ่านในรอบนี้ | ชื่อเล่น/12 avatar/สุ่มรูป, form geometry, profile draft, สมุดบันทึกปฏิทินรายเดือน, mood refinements, งาน research บันทึกสุขภาพ |

**Update for commit/push:** six service cards, eight stages, shared header spacing and worktree documentation have now been integrated into the main checkout alongside the latest journal/avatar/chat work. Statements below about separate checkouts describe the earlier audit snapshot, not the integrated checkout.

อ่านตามลำดับ:
1. เอกสารนี้: inventory/ช่องว่างปัจจุบัน
2. `handoff.md` ส่วนข้อสรุป 28 ตุลาคม: ตาราง stage/copy/สีและระยะ 24px
3. `2026-10-28-ui-update.md`: งานอีก checkout รวมรายละเอียดล่าสุดถึงหัวข้อ 15 (คัดลอกจาก checkout หลักโดยคงเนื้อหาเดิม)
4. `2026-10-28-daily-health-journal-review.md`: ข้อเสนอใหม่ที่ยังไม่ได้ implement
5. `docs/adr/0014-align-spec-to-approved-design.md` และ `docs/specs/*`: สิ่งที่ dev รับรองและ contract ที่ใช้อยู่
6. handoff §0–§9: ประวัติฐาน 5 ตุลาคม ไม่ใช่รายการงานค้างปัจจุบัน

## 2. สรุปผลตรวจความครบของ MD

ก่อน audit: **ยังไม่ครบและมีข้อความล้าสมัย** งานใหม่อยู่กระจายคนละ checkout ขณะที่ handoff หลักยังมีข้ออ้างว่า Profile เป็น alias, M4-R/M8/M11 ไม่มีหน้า, journal อยู่นอก scope และหลายเรื่องยังรอ owner ทั้งที่ ADR-0014 รับรองบางส่วนแล้ว

หลัง audit: มี index กลางและรายการ coverage ด้านล่าง รวมงานที่คุยใหม่และช่องว่างเชื่อมต่อแล้ว แต่ไม่ใช่การรับรองว่าทุก feature implement หรือผ่าน end-to-end ครบ ไม่มีการยกระดับข้อเสนอเป็นข้อกำหนดแพทย์/API โดยอัตโนมัติ

## 3. Ruenfai — สิ่งที่มีและขอบเขตจริง

Path ในตารางอ้างจาก `apps/web/src/app/ruenfai/` เว้นแต่ระบุอย่างอื่น

| พื้นที่ | สิ่งที่มีปัจจุบัน | สิ่งที่ยังต้องส่งต่อ / ข้อจำกัด |
|---|---|---|
| ทางเข้า `/` | เลือกแม่/หน่วยบริการ/กรมฯ จาก `src/app/page.tsx` | ไม่ใช่ auth/role enforcement และไม่เรียก health แล้ว |
| Onboarding | consent, ฟอร์มแม่, คำถาม 7/6/7, ผลตัวอย่าง, booking/confirmation/success (`onboarding/*`) | ผลหัตถการยังเป็น fixture ไม่ได้คำนวณจาก rules engine; validation ฝั่ง client ไม่แทน server |
| ชื่อเล่นและ avatar | **checkout หลัก** มีชื่อเล่นบังคับ ≤40 ตัวอักษร, 12 ภาพ, สุ่มไม่ซ้ำรูปปัจจุบัน, sheet เลือกภาพ, Home/Profile ใช้ข้อมูลเดียวกัน (`mother-identity.ts`, `MotherAvatarPicker.tsx`) | ยังไม่มีใน worktree นี้; เป็น browser store `ruenfai-mother-identity-v1`, ไม่ใช่ข้อมูลบัญชี server; คำแนะนำก่อนหน้าที่เสนอชื่อ optional ถูกแทนที่ด้วยข้อสรุปบังคับของงานอีกแชต |
| Home | ปฏิทินสัปดาห์/เดือน, timeline ยา/นัด/บันทึก, เลื่อน/undo, greeting จากวันคลอด, เข้าหน้า Profile (`page.tsx`, `useMotherAppointments.ts`) | seed บางรายการยังเป็น UI ตัวอย่าง; การเพิ่ม 6 service stage ไม่ได้ทำให้ Home อ่านแผนหมอรอบถัดไปโดยอัตโนมัติ |
| นัดหมาย | **worktree นี้** แสดง 6 บริการเท่านั้น; จองหลายบริการ map กลับกล่องเดิม; pending/confirmed/completed จาก browser booking/provider record; receipt ทำให้ payment → review (`appointments/page.tsx`) | ดูวงจรละเอียดใน handoff; เริ่มต้นยังเป็น fixture 2 paid/review examples ไม่ได้เกิดจาก onboarding จริง |
| 8 service stage | จองคิวม่วง+Chevron / รอยืนยันเหลือง / นัดหมายแล้วเขียว / ชำระเงินม่วง+Chevron / รีวิวม่วง+Chevron / รอประเมินเหลือง / อีก N วันม่วง / ทำไม่ได้เทา (`appointments/service-stage.ts`) | วันเปิดรอบใหม่และเหตุผลจากหมอยังไม่มีใน store ปัจจุบัน; query previewStatus เป็น dev-only ไม่ใช่ข้อมูลหมอ |
| จ่ายเงิน | summary + ยา/ภาพ/3 วิธีจ่าย + busy/success (`payment/*`) | ยอดปัจจุบัน **500 บาทคงที่** = บริการ300 + ยา80+120; ไม่ใช่ bill/dispense จริง; receipt เก็บ sessionStorage `ruenfai-payment-ui-v1` และไม่เรียก payment gateway |
| รีวิว | 4 คะแนน + note, confirmation/success, เก็บ browser store (`review/*`) | แม้ URL ส่ง appointment id แต่ `DemoReview`/save ยังไม่เก็บ appointment id; ยังระบุไม่ได้ว่ารอบไหนรีวิวแล้ว จึงยังไม่ปิดลูป review → plan โดยอัตโนมัติ |
| ยา | seed6รายการ + prescriptions ของ M01, sheet รายละเอียด, ทำเครื่องหมายทานแล้ว/undo (`medicines/*`, `MedicineState.tsx`) | taken เป็น React state; frequency ใช้เวลาที่สั่งชัดเจน ไม่มีการอนุมาน dose; mode/adverse ใน care-journey ไม่ได้แปลว่ามี control ครบในหน้า medicines |
| บันทึกปัจจุบัน | mood5, optional symptoms4, optionalเรื่องราว, save/edit/read + fixed footer (`JournalForm.tsx`, `JournalState.tsx`, `journal/*`) | React state มี seed3รายการ รีโหลดไม่รับประกัน persistence; ไม่ใช่ผลคัดกรองสุขภาพจิต |
| บันทึกรายเดือน | **checkout หลัก** เป็นปฏิทินหลายเดือนเรียงต่อเนื่อง, mood ต่อวัน, หน้าอ่านมีเส้นบรรทัด, title “บันทึกประจำวัน”, ขนาด/สี/animation mood ปรับแล้ว | worktree นี้ยังเป็นรายการรายวันหัวเดือน; ไม่อ้างว่าปฏิทินใหม่ผ่าน spacing rule ของ worktree จนกว่าจะรวมแล้ววัดใหม่ |
| Profile | เป็นหน้าจริงแล้ว แสดง/แก้ข้อมูล มี draft/save/cancel/toast (`profile/*`) | ไม่ใช่ alias → appointments ตาม handoff เก่า; ข้อมูลเสริมแยก browser store; checkout หลักเพิ่ม nickname/avatar draft แล้ว |
| เช็กอินก่อนนัด | `/checkin` เลือกนัด,5คำถาม+pain+คำถามตามบริบท, save (`checkin/page.tsx`) | form บันทึกผล `awaiting_eval` เสมอใน preview ไม่ได้ประเมินกฎจริง และไม่แจ้งคลินิก; ไม่ใช่ daily journal ตัวเดียวกัน |
| ส่งต่อ | `/refer` มีเหตุผลตัวอย่าง, ช่องทางติดต่อ, “ฉันติดต่อแล้ว”, local lock (`refer/page.tsx`) | ไม่รับ engine outcome/ไม่ปลดล็อกจริง; provider/server ต้องบังคับ lock ด้วย |
| แชร์/ถอน/ลบ | `/sharing` มี confirmation และเปลี่ยน careJourney flags (`sharing/page.tsx`) | ขอลบล้างเพียง flags/shares ใน careJourney ไม่ได้ลบ journal/profile/booking ทั้งหมดและไม่ส่งคำขอ server; ห้ามเรียกว่าลบข้อมูลสำเร็จทั้งระบบ |
| Emergency | Home/Chat ใช้ `EmergencyAction`: 1669/เบอร์ที่บันทึก, mother/baby, พิกัด,อ่านข้อความ/คัดลอก/แชร์; มี route `/emergency` อีกหน้า | ไม่มี dispatch; GPS/telephone/native share ต้องทดสอบอุปกรณ์จริง; ไม่ควรสับสน sheet ล่าสุดกับ emergency route ที่มีเนื้อหาคนละรูปแบบ |
| Chat | typed message, reply timer, chips/ลาก, invitationพรีฟิลไม่ส่งเอง, กลับต้นทาง, viewport keyboard (`chat/*`, `chat-topics.ts`, `ChatInvitation.tsx`) | คำตอบตายตัว ไม่ต่อ AI; focus pointerไม่มีกรอบ/Tabมีกรอบทำแล้ว; invitation audit/ข้อเสนออื่นดู ui-update §8 ไม่ถือว่าแก้ทุกข้อแล้ว |
| Shared UI | PageHeader, Toast, PickerSheet/date/month/year, BottomNav/TabMotion, bottom-sheet/reduced-motion | title-only header → content24px, Homeกลุ่มทักทาย → ปฏิทิน18px; ไม่ใช่การตรวจทุก modal/profile/onboarding heading ที่ใช้โครงต่างกัน |
| Compatibility | `/baby` re-export medicines, `/growth` re-export journal; `/m`/`provider` redirect | ไม่ใช่ feature พัฒนาการลูก; `/dtam` เป็น workspace foundations นอก product 3 ส่วน |

## 4. Clinic — coverage และข้อจำกัด

Route `/clinic` re-export `provider/design-preview/page.tsx`; navigation เปลี่ยน view ภายใน route เดียว

| กลุ่ม | สิ่งที่มี | สิ่งที่ยังต้องทำต่อ |
|---|---|---|
| ภาพรวม | metric/รายการนัด/กิจกรรม/ปฏิทิน/เปิดเคส | วันอ้างอิงพรีวิว5พ.ย.2569 ไม่ใช่วันจริง; metricไม่ได้มาจาก API |
| นัดหมาย/เคส | ตาราง ค้นหา กรอง สถานะ สร้างนัด/เปิดเคส และบันทึกการรักษา | booking id ↔ แม่จริง/role/share permissions ยังต้องเชื่อม server; ไม่อนุมานว่าการสร้างด้วยชื่อ free text เป็นบัญชีแม่จริง |
| ปฏิทินแพทย์ | มุมมอง/นัด/ลา/overlap/capability checks (`ScheduleCalendar*`, `calendar-logic*`) | production slot/quota/concurrency/แพทย์และสิทธิ์เข้าถึงยังต้องต่อ contract |
| สั่งยา/คลัง | savePrescription ลด stock พร้อมบันทึก, search/filter/edit/ภาพยา/receive ใน preview | ไม่ใช่ stock transaction ฝั่ง server หรือ FEFO หลายlot ที่พร้อมใช้งานจริง |
| รีวิว/ติดตาม | คะแนน/ความคิดเห็น/ตัวกรอง/ติดตามใน `ReviewsPanel.tsx` | ผูกรีวิวกับนัด/หน่วย/ผู้รับผิดชอบจริงและ aggregate privacy; อย่าใช้ previewเป็นauth boundary |
| แผนรอบถัดไปใหม่ | มีข้อสรุป UX บริการ6กล่องฝั่งแม่แล้ว | **ยังไม่มีการบันทึก per-service แผนวันเริ่มจอง/reason/forbidden/next assessment จากหมอให้แม่** ต้องออกแบบ provider input และ mapping ร่วมเดฟ ห้ามถือว่าเปลี่ยน status นัดเก่าพอแล้ว |

## 5. Department — coverage และข้อจำกัด

Route `/department` re-export `department/design-preview/page.tsx` มี5มุมมอง: ภาพรวมเครือข่าย / ผลลัพธ์และคุณภาพ / ความปลอดภัย / ยาและคลังเครือข่าย / ข้อเสนอจาก AI ตรวจเปิดได้ทุกมุมมองใน browser รอบนี้

- filters ช่วงเวลา/เขต/จังหวัด/หน่วย/วิธีคลอด, search และ scope counts จากข้อมูล mock + careDemo ไม่ใช่ aggregate endpoint จริง
- มี masking บางค่าและ logicปัด bucket ให้รวมตรง headline; ไม่ใช่หลักฐานว่าบังคับ privacy/role/suppression ทุก field บน server แล้ว
- ปุ่มรับ/ไม่รับ/ขอข้อมูลเพิ่มของ AI เก็บ React state ไม่แก้ชุดกฎ ไม่ส่ง approval workflow จริง; ไม่ใช่ D8 ruleset editor/versioning
- D8 ไม่มี route/UIเฉพาะในชุดที่ตรวจ ยังเป็นงานค้าง ส่วน D4/D6 รวมใน viewตาม ADR-0014 แล้ว ไม่ต้องอ้างว่าเป็นหน้าขาดเพราะไม่แยก route

## 6. งานใหม่ที่จะเพิ่ม — ยังไม่ใช่สิ่งที่ทำแล้ว

| งาน | สถานะที่ต้องอ่านให้ถูก | รายละเอียดส่งต่อ |
|---|---|---|
| บันทึกสุขภาพ7กลุ่ม | review/ข้อเสนอ ยังไม่ได้ implement | อารมณ์, ความปวด, น้ำคาวปลา, ไข้, แผล, เต้านม, note; missing state, progressive fields, readerสรุป ดู daily-health-journal-review |
| แชร์บันทึกวัน/สัปดาห์/เดือน/ปี | review/ข้อเสนอ ยังไม่มี export | ช่วงวันจริง+Bangkok timezone, previewก่อนแชร์, เลือกรวมชื่อ/note, ไม่ตีความวันที่ไม่มีข้อมูลเป็นปกติ, ไม่ส่งข้อมูลคลินิกอัตโนมัติ |
| warningจากข้อมูลสุขภาพ | รอทีมคลินิก/contractที่อนุมัติ | auditนี้ไม่กำหนดเกณฑ์เตือนหรือทำ clinical rules ใหม่ อ้างรายละเอียดเดิมใน reviewเท่านั้น |
| แผนหมอและloopรอบใหม่ | UXสถานะเคาะแล้ว / server integrationยังขาด | วันเริ่มจองต่อบริการ, reason, order/versionของแผน, first/subsequent assessment, เปลี่ยน stageตามแผนล่าสุด ไม่ล็อกด้วยการยังไม่รีวิว |
| ประวัติรอบเก่า | ยังต้องเพิ่มทางเข้าที่ชัด | ต้องเก็บนัด/ใบเสร็จ/รีวิวรอบเก่าโดยไม่เพิ่มกล่องบริการใบที่7; current six-card UIยังไม่มี history entryครบ |

ชุด avatarทดลองบุคลิกใหม่/13–24 เป็นตัวเลือกงานภาพ ไม่ใช่รายการที่เลือกใช้จริงในแอป ชุดใช้จริงตาม checkoutหลักคือหน้าตรง01–12เท่านั้น

## 7. ข้อมูลและข้อที่ต้องรวมก่อนส่งเดฟ

1. รวมงานสอง checkout: โดยเฉพาะ `page.module.css`, `PageHeader`, `journal/*`, `page.tsx` Home, `chat/*`, `handoff.md` และ docsใหม่; ห้ามทับไฟล์จากชุดใดชุดหนึ่งทั้งไฟล์โดยไม่ตรวจ diff
2. วัด header24pxกับ **ปฏิทินบันทึกใหม่** หลังรวม ไม่อ้างผล24pxจาก journalเวอร์ชันรายการเก่าแทนของใหม่
3. service identity/enum mapping: UI “นวดแผนไทย” ↔ booking “นวดไทย”; นวดกระตุ้นน้ำนมและก้อนเส้าต้องให้เดฟ/ทีมคลินิกตกลง enum/eligibility ห้ามเพิ่ม ruleจากชื่อตัวการ์ดเอง
4. ผูก appointment/encounter id สำหรับ bill/receipt/review/prescription/แผนรอบถัดไป; จองหลายบริการหนึ่งรอบต้องไม่คิดเงินซ้ำหรือ reviewซ้ำเพราะมีหลายการ์ด
5. ตั้ง precedenceแผนใหม่กับงานค้างชำระ/รีวิวจากรอบก่อน ให้มีทางเข้าประวัติ; ยังไม่สมมติว่าตารางลูปใหม่เป็น backend state machineที่อนุมัติแล้ว
6. เปลี่ยน UI fixtures → ผลประเมินส่วนบุคคลจาก server; แยก not_yetครั้งแรกกับวันเปิดจองรอบใหม่ให้ชัดใน mapper
7. ตรวจ data persistence: care-demo, profile-details, mother-identity, care-journey, reviews ใช้ browser stores; payments sessionStorage; journal/takenใช้React state ไม่มีหลักฐานว่าข้อมูลคงทนข้ามบัญชีหรือเครื่อง
8. APIปัจจุบัน `apps/api/src/index.ts` มีเพียง `/health` ยังไม่มี feature endpoints; `src/lib/api.ts` เป็น client foundation ไม่ใช่หลักฐานว่าแต่ละหน้าต่อAPIแล้ว
9. Consent/share/delete/role/aggregate/referral/notificationต้องบังคับจริงฝั่ง server ข้อความยืนยันในpreviewไม่เท่ากับการดำเนินการจริง
10. ตรวจ loading/empty/error/validation/session expired/permission denied และ native telephone/GPS/share/keyboard หลังรวม ไม่ใช้HTTP200หรือbuildแทนinteraction QA

## 8. ADR-0014 กับรายการเก่า

- R-01…R-13หลายเรื่องได้รับการรับรองแล้ว: routesหลัก3ส่วน, ฟอร์ม7/6/7, bookingหน้าเดียว, journalในscope, เบอร์ติดต่อ, staffสร้างนัด, CRUDยา, doctor management/reviews, grouped departmentviews, typography/selection/ป้าย
- ดังนั้นคำเก่าอย่าง “ต้องรออนุมัติว่า journalจะอยู่ในscopeไหม”, “ต้องเพิ่มaskIfซ่อนข้อในUI”, “ต้องแยกbooking4หน้า”, “ต้องมีป้ายจำลองทุกหน้าคลินิก”, “ต้องแยกD4/D6” ไม่ใช่todoปัจจุบันโดยอัตโนมัติ
- Q9/Q14ในSPECเกี่ยวกับnot_yet/นัดประเมินมีทิศทางUXใหม่ในแชตนี้แล้ว แต่ยังไม่ได้แก้SPECหรือenumทางการ; เดฟต้อง reconcile ไม่ถือว่าคำถามเปิดถูกปิดทางcontractแล้ว
- M4-R/M8/M11มีUIpreviewจริงแล้ว (refer/checkin/sharing); เปลี่ยนจาก “ยังไม่มีหน้า” เป็น “ยังต้องintegration/QA” ส่วนM0 LINE rich menuและD8ยังไม่พบimplementationในชุดนี้

## 9. หลักฐานรอบ audit นี้

- อ่าน inventoryทุก `page.tsx`, storesและcomponentหลักทั้ง3พื้นที่ เทียบกับhandoff, ADR-0014, SPECคำถามเปิด และ8commitใหม่ในcheckoutหลัก
- GET17เส้นทางหลักบน3001ได้HTTP200: `/`, `/login`, `/ruenfai`, `/ruenfai/onboarding`, `/ruenfai/appointments`, `/ruenfai/medicines`, `/ruenfai/journal`, `/ruenfai/profile`, `/ruenfai/payment`, `/ruenfai/review`, `/ruenfai/chat`, `/ruenfai/checkin`, `/ruenfai/refer`, `/ruenfai/emergency`, `/ruenfai/sharing`, `/clinic`, `/department` เป็นหลักฐานreachabilityเท่านั้น
- Browserเปิดเมนูหลักคลินิก5รายการ และกรมฯ5มุมมอง เห็นเนื้อหาเปลี่ยนตามเมนู ไม่มีerrorในlogฝั่งกรมฯที่ตรวจ ไม่ได้กดsave/treatment/stock/approvalทุกกรณี
- `node --test apps/web/tests/*.mjs`:15ผ่าน /0ตก; `tsc --noEmit -p apps/web/tsconfig.json` ผ่าน
- ผลUI8stage/390px/ปุ่ม3action/วันกรุงเทพฯและheader24pxอยู่ในhandoffรอบก่อนหน้า ไม่ใช่การเล่นfull-loopใหม่ในauditนี้
- เอกสารจากcheckoutหลักคัดลอกเป็นหลักฐานงานอีกชุด; รายงานQAเดิมในไฟล์เหล่านั้นเป็นผลของรอบที่ระบุ ไม่อ้างว่าreplayแล้วในworktreeนี้
- ยังไม่ใช่production acceptance, physical-device acceptance, การรักษา/ชำระเงินจริง หรือการตรวจความถูกต้องของเกณฑ์ทางคลินิก

## 10. Integration before commit/push: 28 October 2026
- Copied appointments/page.tsx, service-stage.ts, PageHeader.module.css and page.module.css after verifying no competing changes since the common baseline.
- Retained main checkout chat, identity/avatar, journal, SheetResize and export work; did not overwrite those with older worktree files.
- Included conditional-field motion and ui-update section19. Exported avatar PNG/ZIP and QA evidence under output remain local artifacts; only production-consumed avatar assets under public/images are delivered. Competitor screenshots in docs/research also remain excluded.
- The seven-group health journal and mock PDF export are now implemented UI in the main checkout (ui-update sections16-18), superseding earlier proposed-only labels above. Actual PDF generation, production persistence and clinician follow-up integration remain outstanding.
