# Screen map — หน้าจอ → API → ข้อมูล → กฎ

> ใช้คู่กับ `DESIGN-REVIEW.md` ตอนรับ design มาเทียบ · Tag: 🟢 ต้องมี · 🟡 ควรมี · ⚪ ไว้ทีหลัง · Route อยู่ใน `apps/web/src/app/`
> route ตาม design (ADR-0014): แม่ `ruenfai/*` · หน่วยบริการ `clinic` (หน้าเดียว สลับ view ด้วย state) · กรมฯ `department` (หน้าเดียว สลับ view) · route ที่เขียนว่า "ยังไม่มี design" คือหน้าที่ทีม design ยังค้างส่ง (handoff §3)

## คุณแม่ (มือถือ, LIFF) — ติดต่อด่วน (M12) เข้าจากไอคอนโทรศัพท์ในหัวแชท (M14) + route `ruenfai/emergency` · bottom nav ปุ่มขวาเปิดแชท ไม่ใช่ติดต่อด่วน (ADR-0015 แทน ADR-0014 ข้อ 6)
> สถานะหน้าที่ implement แล้ว (หลัง `0958fdd`) แต่ **ยังไม่ผ่าน `DESIGN-REVIEW.md`**: M4-R, M8, M11, M12, M14, M15 — ข้อมูลทั้งหมดเป็นของจำลอง (ADR-0012)
| ID | หน้า | Tag | Phase | Route | API | ตาราง | กฎ / ADR |
|---|---|---|---|---|---|---|---|
| M0 | ห้องแชท LINE | 🟢 | 1 | (LINE) rich menu | webhook, outbox | notification_outbox | notifications.md, ADR-0006 |
| M1 | ขอความยินยอม | 🟢 | 1 | `ruenfai/onboarding` | `POST /me/consent` | consents | ADR-0007 · ข้อ 2 ห้าม pre-check · ปุ่มกดได้เมื่อติ๊กข้อ 1 |
| M2 | ข้อมูลคุณแม่ | 🟢 | 1 | `ruenfai/onboarding?screen=stage-1` | `PUT /me/profile` | mothers | rules §1 · แก้วันคลอดต้องบอกว่าจะคำนวณใหม่ · `phone` + `emergencyPhone` บังคับ (ADR-0014) |
| M3 | คำถามคัดกรอง (รูปแบบ) | 🟢 | 1 | `ruenfai/onboarding?screen=stage-2…4` | `GET /me/screening/questions` | – | ฟอร์มต่อช่วง 7/6/7 แสดงครบ 20 ข้อทุกคน ไม่ซ่อนตาม askIf ไม่ไปข้อถัดไปอัตโนมัติ (ADR-0014) · rules §2 · ADR-0005 |
| M3-A1…A6 | ช่วง 1 อาการส่งต่อ | 🟢 | 1 | 〃 | 〃 | – | rules §2 ช่วง 1 · ไม่มีปุ่มโทรปรึกษา (ADR-0014) |
| M3-B1…B6 | ช่วง 2 คัดออก | 🟢 | 1 | 〃 | 〃 | – | rules §2 ช่วง 2 · B4 การ์ด 1323 |
| M3-C1…C8 | ช่วง 3 ข้อห้ามรายหัตถการ | 🟢 | 1 | 〃 | `POST /me/screenings` | screenings | rules §2 ช่วง 3 · C4 ตัดออก |
| M4 | ผลคัดกรอง | 🟢 | 1 | `ruenfai/onboarding?screen=results` | `GET /me/results/latest` | screenings | แสดง 3 สถานะ (ทำได้ / รอการประเมิน / ห้ามหลังคลอด) · `not_yet` แสดงอย่างไร = Q9 · ห้ามคำว่า "ปลอดภัย" · ไม่ต้องแตะดูเหตุผล (API ยังคืน reasons + ref) (ADR-0014) |
| M4-R | ควรไปพบแพทย์ | 🟢 | 1 | `ruenfai/refer` (implement แล้ว · ยังไม่ผ่าน design review · เข้าจากการ์ดนัดหมาย M7 เมื่อ `referralLocked` · ผลเช็กอิน `referred` ยังไม่เคยถูกสร้างในพรีวิว — Q26) | `POST /me/referral/contacted` | referral_locks | ADR-0005 · ไม่มีปุ่มจอง |
| M5 | ปฏิทินของฉัน | 🟢 | 1 | `ruenfai` | `GET /me/calendar`, `GET /me` | – | rules §4 · การ์ด 4 ใบ · ไม่เช็กอินเกิน 3 วัน → ชวนเช็กอิน |
| M6-1 | จองคิว 1/4 หน่วยบริการ | 🟢 | 2 | `ruenfai/onboarding?screen=booking` | `GET /me/units` | units | แถบสิทธิ์บนสุด · หน่วยที่เลือกไว้อยู่บนสุด |
| M6-2 | จองคิว 2/4 หัตถการ | 🟢 | 2 | 〃 | `GET /me/units/:id/procedures` | services | Q-MULTI · อบ = นัดประเมิน |
| M6-3 | จองคิว 3/4 วันเวลา | 🟢 | 2 | 〃 | `GET /me/units/:id/availability` | slots | window ∩ quota ∩ same-day |
| M6-4 | จองคิว 4/4 ยืนยัน | 🟢 | 2 | 〃 (dialog ยืนยัน + success) | `POST /me/appointments` | appointments, shares | ติ๊กแชร์เอง · ครบ 5 → ปิด |
| M7 | นัดหมายของฉัน | 🟢 | 2 | `ruenfai/appointments` | `GET/POST /me/appointments…` | appointments | state machine · คอร์สอบแยกการ์ดรายวัน |
| M8 | เช็กอินก่อนนัด | 🟢 | 2 | `ruenfai/checkin` (implement แล้ว · ยังไม่ผ่าน design review · หน้าเดียว เลือกนัดจาก dropdown ไม่ใช่ `[id]` · ไม่มีลิงก์เข้า — Q26) | `POST /me/appointments/:id/checkin` | checkins, screenings | 5 ข้อ + ความปวด · ทุกวันของคอร์ส · พรีวิวได้ผล `awaiting_eval` เสมอ รอ api rules engine (Q23, ADR-0001) |
| M9 | ยาของฉัน | 🟢 | 3 | `ruenfai/medicines` | `/me/meds…` | med_doses | ชื่อยาอยู่ในเว็บเท่านั้น · ปุ่มอาการผิดปกติ |
| M10 | รีวิวหลังรับบริการ | 🟢 | 4 | `ruenfai/review` | `POST /me/appointments/:id/review` | reviews, staff_alerts | ดาว 4 ข้อต่อนัด ไม่ถามแพทย์ในฟอร์ม · `painAfter`/adverse เป็น optional (ต้นทาง = Q10) (ADR-0014) |
| M11 | จัดการการแชร์ข้อมูล | 🟡 | 5 | `ruenfai/sharing` (implement แล้ว · ยังไม่ผ่าน design review · ไม่มีลิงก์เข้าจากหน้าใด — Q26) | `/me/shares`, `DELETE /me/consent/aggregate`, `DELETE /me` | shares, consents | ต้องมีหน้ายืนยันก่อนลบ/ถอน |
| M12 | ติดต่อด่วน | 🟢 | 1 | `ruenfai/emergency` (route · เข้าจาก M4-R เท่านั้น) + dialog ในหัวแชท M14 (ADR-0015) | `GET /me` (`emergencyPhone`, unitPhone) | – | โทร 1669 + โทร `emergencyPhone` · รายการ 7 อาการไม่บังคับ (ADR-0014) · ใช้ได้ทันที · ไม่ต้อง auth ถ้า session หมด · จาก tab ต้องกด 2 ครั้ง (ปุ่มแชท → ไอคอนโทรศัพท์) · พรีวิวอ่านเบอร์ฉุกเฉินจาก localStorage 2 แหล่ง (ADR-0015) |
| M13 | บันทึกของฉัน (journal) | 🟡 | 5 | `ruenfai/journal` | `GET/POST /me/journal` | journal_entries | อารมณ์ 5 ระดับ + ข้อความ · ADR-0006 ห้ามอยู่ในข้อความ LINE · consent/แชร์ = Q11 (ADR-0014) |
| M14 | แชทผู้ช่วย | ⚪ | – | `ruenfai/chat` (เข้าจากปุ่มขวาสุดของ bottom nav · ซ่อน bottom nav) | – (ยังไม่มี endpoint) | – | ADR-0015 · ข้อความตายตัว ไม่มี AI/LLM · ห้ามแนะนำยา/หัตถการรายบุคคล (SPEC §7) · "สอบถามเรื่องยา" = ข้อมูลทั่วไป/ชี้ไปหาแพทย์ · AI จริงต้องอยู่ใน ADR-0009 (Q21) · หัวแชทมีทางเข้า M12 |
| M15 | ชำระเงิน (สาธิต) | ⚪ | – | `ruenfai/payment?appointment=` (เข้าจากการ์ดนัดหมาย M7 · ซ่อน bottom nav) | – (ไม่มี endpoint/ตาราง) | – | ADR-0015 · ราคาตายตัว ไม่เรียกเก็บเงินจริง ไม่เชื่อมระบบใด · ต้องมีข้อความ "สาธิต · ยังไม่มีการเรียกเก็บเงินจริง" · ไม่กระทบ state ของนัด/quota (Q22) |

## หน่วยบริการ (คอมพิวเตอร์) — route `clinic` หน้าเดียว สลับ view (ADR-0014)
| ID | หน้า | Tag | Phase | Route | API | Role | กฎ / ADR |
|---|---|---|---|---|---|---|---|
| P1 | เข้าสู่ระบบ | 🟡 | 2 | `login` | `POST /auth/staff` | – | ADR-0011 · เมนูตาม role |
| P2 | ตั้งค่าบริการและตารางเวลา | 🟢 | 2 | `clinic` view `schedule` | `/provider/services`, `start-days`, `schedule`, `closures`, `doctors` | doctor, staff | T-START ≥ คู่มือ · อบ "จากคู่มือ" · เพิ่มแพทย์ + รูป + สีการ์ด (ADR-0014) |
| P3 | คิววันนี้ | 🟢 | 2 | `clinic` view `dashboard` / `appointments` | `GET /provider/queue`, confirm, propose, `POST /provider/appointments` | doctor, staff | แถบ awaiting_eval บนสุด · ชื่อย่อเท่านั้น (นัดที่ staff สร้างใช้ชื่อ free text — Q12) · staff เพิ่มนัดเองได้ (ADR-0014) |
| P4 | ใบสรุปเคส | 🟢 | 2 | `clinic` view `case` | `GET /provider/cases/:id` | doctor, staff | access_log · "ต้องดูก่อน" บนสุด · อ่านจบในจอเดียว |
| P5 | บันทึกการรักษา | 🟢 | 2 | `clinic` view `treatment` | `POST …/treatment` | doctor | eligibility_checked · rules §7 · Q-COURSE |
| P6 | สั่งยา | 🟢 | 3 | `clinic` view `prescribe` | `/provider/drugs`, `prescriptions/check`, `prescriptions` | doctor | rules §6 · เปลี่ยนยา / รับทราบและยืนยัน |
| P7 | คลังยา | 🟢 | 3 | `clinic` view `inventory` | `/provider/inventory…`, `/provider/drugs` | all (receive/adjust/เพิ่ม-แก้ยา: pharmacist) | FEFO (UI แสดงยอดรวมต่อยาได้) · low / < 60 วัน · เพิ่ม/แก้ไขยา + รูป (ADR-0014) |
| P8 | รีวิวของหน่วยบริการ | 🟡 | 5 | `clinic` view `reviews` | `/provider/reviews`, `/provider/alerts` | doctor, staff | n ≥ 5 (นับหลังกรอง) · กรอง/ดูรายแพทย์ได้ · ติดตามอาการ: ผู้รับผิดชอบ + สถานะ + บันทึก · ป้าย "สรุปโดย AI" ไม่บังคับ (ADR-0014) |

## กรมฯ (คอมพิวเตอร์) — route `department` หน้าเดียว สลับ view (ADR-0014) · ทุก view: ตัวกรองมาตรฐาน + "ข้อมูลรวมกลุ่ม ไม่ระบุตัวบุคคล" + "(จำลอง)"
| ID | หน้า | Tag | Phase | Route | API | View |
|---|---|---|---|---|---|---|
| D1 | ภาพรวม | 🟢 | 4 | `department` view ภาพรวมเครือข่าย | `GET /dtam/overview` | agg_overview |
| D2 | ผลลัพธ์การรักษา | 🟡 | 5 | `department` view ผลลัพธ์และคุณภาพ | `GET /dtam/outcomes` | agg_outcomes |
| D3 | ความปลอดภัย | 🟡 | 5 | `department` view ความปลอดภัย | `GET /dtam/safety` | agg_safety (unsure rate รายข้อ) |
| D4 | การเข้าถึงบริการ | 🟡 | 5 | 〃 อยู่ใน view ของ D1 | `GET /dtam/access` | agg_access |
| D5 | ยาและคลังยา | 🟡 | 5 | `department` view ยาและคลังเครือข่าย | `GET /dtam/drugs` | agg_drugs |
| D6 | ความพึงพอใจ | 🟡 | 5 | 〃 อยู่ใน view ของ D2 | `GET /dtam/satisfaction` | agg_satisfaction |
| D7 | ข้อเสนอจาก AI | 🟢 | 4 | `department` view ข้อเสนอจาก AI | `/dtam/ai-proposals…` | ai_proposals · ai.md |
| D8 | ชุดกฎ | ⚪ | 6 | `department` (ยังไม่มี design) | `/dtam/rulesets…` | ruleset_versions · rule_approver เท่านั้น |

D4/D6 แสดงใน view ของ D1/D2 แต่ endpoint และ `agg_*` แยกกันเหมือนเดิม · ข้อมูลจริงมาจาก `agg_*` + n<5 เท่านั้น (ADR-0008) ไม่ใช่ข้อมูลรายคนแบบใน prototype
