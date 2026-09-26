# Screen map — หน้าจอ → API → ข้อมูล → กฎ

> ใช้คู่กับ `DESIGN-REVIEW.md` ตอนรับ design มาเทียบ · Tag: 🟢 ต้องมี · 🟡 ควรมี · ⚪ ไว้ทีหลัง · Route อยู่ใน `apps/web/src/app/`

## คุณแม่ (มือถือ, LIFF) — ทุกหน้ามีปุ่ม "ติดต่อด่วน" มุมขวาบน
| ID | หน้า | Tag | Phase | Route | API | ตาราง | กฎ / ADR |
|---|---|---|---|---|---|---|---|
| M0 | ห้องแชท LINE | 🟢 | 1 | (LINE) rich menu | webhook, outbox | notification_outbox | notifications.md, ADR-0006 |
| M1 | ขอความยินยอม | 🟢 | 1 | `m/consent` | `POST /me/consent` | consents | ADR-0007 · ข้อ 2 ห้าม pre-check · ปุ่มกดได้เมื่อติ๊กข้อ 1 |
| M2 | ข้อมูลคุณแม่ | 🟢 | 1 | `m/profile` | `PUT /me/profile` | mothers | rules §1 · แก้วันคลอดต้องบอกว่าจะคำนวณใหม่ |
| M3 | คำถามคัดกรอง (รูปแบบ) | 🟢 | 1 | `m/screening/[step]` | `GET /me/screening/questions` | – | rules §2 · ADR-0005 |
| M3-A1…A6 | ช่วง 1 อาการส่งต่อ | 🟢 | 1 | 〃 | 〃 | – | rules §2 ช่วง 1 · มีปุ่มโทรปรึกษาตอน unsure |
| M3-B1…B6 | ช่วง 2 คัดออก | 🟢 | 1 | 〃 | 〃 | – | rules §2 ช่วง 2 · B4 การ์ด 1323 |
| M3-C1…C8 | ช่วง 3 ข้อห้ามรายหัตถการ | 🟢 | 1 | 〃 | `POST /me/screenings` | screenings | rules §2 ช่วง 3 · C4 ตัดออก |
| M4 | ผลคัดกรอง | 🟢 | 1 | `m/results` | `GET /me/results/latest` | screenings | ProcStatus 4 แบบ · ห้ามคำว่า "ปลอดภัย" · แตะแล้วเห็นเหตุผล + เลขหน้า |
| M4-R | ควรไปพบแพทย์ | 🟢 | 1 | `m/refer` | `POST /me/referral/contacted` | referral_locks | ADR-0005 · ไม่มีปุ่มจอง |
| M5 | ปฏิทินของฉัน | 🟢 | 1 | `m/calendar` | `GET /me/calendar`, `GET /me` | – | rules §4 · การ์ด 4 ใบ · ไม่เช็กอินเกิน 3 วัน → ชวนเช็กอิน |
| M6-1 | จองคิว 1/4 หน่วยบริการ | 🟢 | 2 | `m/booking/unit` | `GET /me/units` | units | แถบสิทธิ์บนสุด · หน่วยที่เลือกไว้อยู่บนสุด |
| M6-2 | จองคิว 2/4 หัตถการ | 🟢 | 2 | `m/booking/procedures` | `GET /me/units/:id/procedures` | services | Q-MULTI · อบ = นัดประเมิน |
| M6-3 | จองคิว 3/4 วันเวลา | 🟢 | 2 | `m/booking/slot` | `GET /me/units/:id/availability` | slots | window ∩ quota ∩ same-day |
| M6-4 | จองคิว 4/4 ยืนยัน | 🟢 | 2 | `m/booking/confirm` | `POST /me/appointments` | appointments, shares | ติ๊กแชร์เอง · ครบ 5 → ปิด |
| M7 | นัดหมายของฉัน | 🟢 | 2 | `m/appointments` | `GET/POST /me/appointments…` | appointments | state machine · คอร์สอบแยกการ์ดรายวัน |
| M8 | เช็กอินก่อนนัด | 🟢 | 2 | `m/checkin/[id]` | `POST /me/appointments/:id/checkin` | checkins, screenings | 5 ข้อ + ความปวด · ทุกวันของคอร์ส |
| M9 | ยาของฉัน | 🟢 | 3 | `m/meds` | `/me/meds…` | med_doses | ชื่อยาอยู่ในเว็บเท่านั้น · ปุ่มอาการผิดปกติ |
| M10 | รีวิวหลังรับบริการ | 🟢 | 4 | `m/review/[id]` | `POST /me/appointments/:id/review` | reviews, staff_alerts | ไม่ให้คะแนนแพทย์รายคน |
| M11 | จัดการการแชร์ข้อมูล | 🟡 | 5 | `m/sharing` | `/me/shares`, `DELETE /me/consent/aggregate`, `DELETE /me` | shares, consents | ต้องมีหน้ายืนยันก่อนลบ/ถอน |
| M12 | ติดต่อด่วน | 🟢 | 1 | `m/emergency` | `GET /me` (unitPhone) | – | 7 อาการส่งต่อ · ใช้ได้ทันที · ไม่ต้อง auth ถ้า session หมด |

## หน่วยบริการ (คอมพิวเตอร์) — ทุกหน้ามีป้าย "ข้อมูลจำลอง"
| ID | หน้า | Tag | Phase | Route | API | Role | กฎ / ADR |
|---|---|---|---|---|---|---|---|
| P1 | เข้าสู่ระบบ | 🟡 | 2 | `provider/login` | `POST /auth/staff` | – | ADR-0011 · เมนูตาม role |
| P2 | ตั้งค่าบริการและตารางเวลา | 🟢 | 2 | `provider/schedule` | `/provider/services`, `start-days`, `schedule`, `closures` | doctor | T-START ≥ คู่มือ · อบ "จากคู่มือ" |
| P3 | คิววันนี้ | 🟢 | 2 | `provider/queue` | `GET /provider/queue`, confirm, propose | doctor, staff | แถบ awaiting_eval บนสุด · ชื่อย่อเท่านั้น |
| P4 | ใบสรุปเคส | 🟢 | 2 | `provider/cases/[id]` | `GET /provider/cases/:id` | doctor, staff | access_log · "ต้องดูก่อน" บนสุด · อ่านจบในจอเดียว |
| P5 | บันทึกการรักษา | 🟢 | 2 | `provider/treatment/[id]` | `POST …/treatment` | doctor | eligibility_checked · rules §7 · Q-COURSE |
| P6 | สั่งยา | 🟢 | 3 | `provider/prescribe/[id]` | `/provider/drugs`, `prescriptions/check`, `prescriptions` | doctor | rules §6 · เปลี่ยนยา / รับทราบและยืนยัน |
| P7 | คลังยา | 🟢 | 3 | `provider/inventory` | `/provider/inventory…` | all (receive/adjust: pharmacist) | FEFO · low / < 60 วัน |
| P8 | รีวิวของหน่วยบริการ | 🟡 | 5 | `provider/reviews` | `/provider/reviews`, `/provider/alerts` | doctor, staff | n ≥ 5 · "สรุปโดย AI" · ไม่จัดอันดับแพทย์ |

## กรมฯ (คอมพิวเตอร์) — ทุกหน้า: ตัวกรองมาตรฐาน + "ข้อมูลรวมกลุ่ม ไม่ระบุตัวบุคคล" + "(จำลอง)"
| ID | หน้า | Tag | Phase | Route | API | View |
|---|---|---|---|---|---|---|
| D1 | ภาพรวม | 🟢 | 4 | `dtam/overview` | `GET /dtam/overview` | agg_overview |
| D2 | ผลลัพธ์การรักษา | 🟡 | 5 | `dtam/outcomes` | `GET /dtam/outcomes` | agg_outcomes |
| D3 | ความปลอดภัย | 🟡 | 5 | `dtam/safety` | `GET /dtam/safety` | agg_safety (unsure rate รายข้อ) |
| D4 | การเข้าถึงบริการ | 🟡 | 5 | `dtam/access` | `GET /dtam/access` | agg_access |
| D5 | ยาและคลังยา | 🟡 | 5 | `dtam/drugs` | `GET /dtam/drugs` | agg_drugs |
| D6 | ความพึงพอใจ | 🟡 | 5 | `dtam/satisfaction` | `GET /dtam/satisfaction` | agg_satisfaction |
| D7 | ข้อเสนอจาก AI | 🟢 | 4 | `dtam/ai` | `/dtam/ai-proposals…` | ai_proposals · ai.md |
| D8 | ชุดกฎ | ⚪ | 6 | `dtam/rules` | `/dtam/rulesets…` | ruleset_versions · rule_approver เท่านั้น |
