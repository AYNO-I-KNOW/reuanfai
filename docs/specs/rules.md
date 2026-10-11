# Rules — catalog, schema, test cases

> ร่างของทีมที่คัดมาจากคู่มือ **ยังไม่ผ่านการตรวจจากแพทย์แผนไทย** (ADR-0002)
> ที่มา: **คู่มือ** = คู่มือการจัดบริการผดุงครรภ์ไทยแบบบูรณาการฯ 2569 · **KH** = Knowledge Hub Track 3 · **สถาบันฯ** = คู่มือแนวทางการดูแลสุขภาพมารดาและทารกฯ

## 1. Vocabulary

| คำ | ค่า |
|---|---|
| `DeliveryMethod` | `normal` (คลอดปกติ), `assisted` (ใช้อุปกรณ์ช่วยคลอด), `cesarean` (ผ่าคลอด), `cesarean_sterilization` (ผ่าคลอดและทำหมัน) |
| `vaginal` | `normal \| assisted` |
| `cesareanAny` | `cesarean \| cesarean_sterilization` |
| `Chronic` | `diabetes, hypertension, heart, asthma, epilepsy, kidney, osteoporosis` (หรือ `none`) |
| `Answer` | `yes \| no \| unsure` |
| `Procedure` | `massage` นวดไทย · `compress` ประคบสมุนไพร · `salt_pot` ทับหม้อเกลือ · `steam` อบสมุนไพร (อบไอน้ำ) · `hot_stone` ก้อนเส้า · `eval` นัดประเมิน |
| `ProcStatus` | `ok` ทำได้ในช่วงนี้ · `evaluate` ให้ประเมินก่อน · `not_yet` ยังไม่ถึงกำหนด + วันเริ่ม · `forbidden` ห้าม + เหตุผล (ห้ามพื้นแดงทั้งกล่อง) — enum 4 ค่าไม่เปลี่ยน ส่วนสี/คำที่แสดงและการแสดงเป็น 3 สถานะบนจอแม่ (`not_yet` = SPEC Q9) ตาม design (ADR-0014) |

ความสำคัญของสถานะ ถ้ามีหลายกฎชนกันให้เลือกตัวที่แรงที่สุด: `forbidden > not_yet > evaluate > ok` และเก็บทุกเหตุผลที่เจอไว้ใน `reasons[]`

## 2. คำถามคัดกรอง (M3) — 3 ช่วง

> UI แสดงครบ 20 ข้อ (7/6/7) ทุกคน ไม่ซ่อนตาม `askIf` (ADR-0014) · `askIf` ใช้ใน engine เท่านั้น: คำตอบของข้อที่ `askIf` เป็น false สำหรับแม่คนนั้น (รวม A1a เมื่อ A1≠yes) **ถูกตัดทิ้ง**ก่อนคำนวณ ไม่ว่าจะตอบอะไร

`askIf` = เงื่อนไขว่าจะถามข้อนี้หรือไม่ · `onYes` / `onUnsure` = ผล (`refer` = ไป M4-R + lock, `evalAll` = ทุกหัตถการเป็น evaluate, `eval:<proc>` = หัตถการนั้นเป็น evaluate, `ask:<id>` = ไปถามข้อย่อยต่อ) · `checkin` = ใช้ในเช็กอินก่อนนัด (M8) ด้วยไหม

### ช่วง 1 — อาการที่ต้องไปโรงพยาบาล (เกณฑ์ส่งต่อ 7 ข้อ, คู่มือ หน้า 79)
| id | คำถาม | askIf | onYes | onUnsure | ที่มา | checkin |
|---|---|---|---|---|---|---|
| A1 | สองวันนี้มีไข้เกิน 37.5 องศาเซลเซียสไหม | all | `ask:A1a` | `evalAll` | ส่งต่อ 1, คัดออก 1 (หน้า 78–79) | #1 |
| A1a | ตอนมีไข้ มีอาการเต้านมคัดตึงร่วมด้วยไหม | A1=yes | `evalAll` (ไม่ส่งต่อ) | `refer` ⚠︎Q7 | ข้อยกเว้นของส่งต่อ 1 (หน้า 78–79); **onNo = `refer`** | เมื่อ A1=yes |
| A2 | มีอาการติดเชื้อไหม เช่น หนาวสั่น แผลบวมแดงร้อน หรือมีหนอง | all | `refer` | `evalAll` | ส่งต่อ 2 (หน้า 79) | – |
| A3 | น้ำคาวปลามีกลิ่นเหม็น สีหรือปริมาณผิดปกติไหม | all | `refer` | `evalAll` | ส่งต่อ 3, คัดออก 3 (หน้า 78–79) | #2 |
| A4 | แผลที่ช่องคลอดมีอะไรผิดปกติไหม | vaginal | `refer` | `evalAll` | ส่งต่อ 4 (หน้า 79) | #3 (ผ่าคลอด → ถามแผลผ่าคลอดแทน) |
| A5 | มีเลือดออกมากผิดปกติ (ตกเลือด) ไหม | all | `refer` | `evalAll` | ส่งต่อ 5, คัดออก 9 (หน้า 79) | #4 |
| A6 | มีฝีหรือก้อนบวมแดงและเจ็บที่เต้านมไหม | all | `refer` | `evalAll` | ส่งต่อ 6 (หน้า 79) | #5 |
| — | มดลูกไม่เข้าอู่ตามเวลา | ไม่ถาม | — | — | ส่งต่อ 7 — แพทย์ตรวจเอง แสดงในรายการ M12 | – |

### ช่วง 2 — ภาวะที่อาจทำให้รับบริการไม่ได้ (เกณฑ์คัดออก 10 ข้อ, หน้า 78–79) → `evalAll`
| id | คำถาม | askIf | onYes / onUnsure | ที่มา |
|---|---|---|---|---|
| B1 | ตอนนี้มีโรคติดเชื้อเฉียบพลันอยู่ไหม เช่น ไข้หวัดใหญ่ | all | `evalAll` | คัดออก 2 (หน้า 78) |
| B2 | มีกระดูกเชิงกรานแตก ร้าว หรือแยกจากการคลอดไหม | all | `evalAll` | คัดออก 4 (หน้า 78) |
| B3 | ตอนนี้มีโรคติดต่อร้ายแรงอยู่ไหม เช่น วัณโรค | all | `evalAll` | คัดออก 6 (หน้า 79) |
| B4 | มีภาวะซึมเศร้าหลังคลอดที่รุนแรงและยังคุมอาการไม่ได้ไหม | all | `evalAll` + การ์ดสายด่วน 1323 | คัดออก 7 (หน้า 79); ใช้คำนุ่มนวล ไม่ใช่แบบคัดกรองซึมเศร้า (หน้า 80) |
| B5 | {โรค} ที่คุณแม่แจ้งไว้ ตอนนี้ยังมีปัญหาคุมไม่ได้อยู่ไหม | chronic ∩ {heart, hypertension, diabetes} ≠ ∅ | `evalAll` | คัดออก 8 (หน้า 79) |
| B6 | มีผื่นหรือแผลที่ผิวหนังที่ติดเชื้อหรือติดต่อได้ไหม | all | `evalAll` | คัดออก 10 (หน้า 79) + ห้ามประคบ 2.3 (หน้า 92) |
| — | คัดออก 5 | ⚠︎Q1 | | |

### ช่วง 3 — เรื่องที่ต้องระวังก่อนทำหัตถการ (ข้อห้ามรายหัตถการ, หน้า 91–93)
| id | คำถาม | askIf | onYes / onUnsure | ที่มา |
|---|---|---|---|---|
| C1 | มีแผลพุพองที่ผิวหนังไหม | all | `eval:compress` | ข้อห้ามประคบ 2.2 (หน้า 92) |
| C2 | ช่วงนี้มีเรื่องไหนในนี้บ้างไหม: เพิ่งหายไข้ เพิ่งหายท้องเสีย อ่อนเพลีย อดนอน หรืออดอาหาร | all | `eval:steam` | ข้อห้ามอบ 2.1 (หน้า 93) |
| C3 | มีความดันต่ำ เวียนหัว คลื่นไส้ หรืออาเจียนไหม | all | `eval:steam` | ข้อห้ามอบ 2.2 (หน้า 93) |
| C4 | ~~หอบหืดกำเริบ~~ | **ตัดออก** | — | profile มี asthma → `eval:steam` อัตโนมัติ (2.8 หน้า 93) |
| C5 | ตอนนี้มีประจำเดือนพร้อมกับมีไข้ไหม | all | `eval:steam` | ข้อห้ามอบ 2.4 (หน้า 93) |
| C6 | ตอนนี้มีแผลที่อักเสบอยู่ไหม ไม่ว่าจะเป็นแผลที่ไหน | all | `eval:steam` + note ให้แพทย์เห็นตอนประคบ | อบ 2.5 (หน้า 93), ข้อควรระวังประคบ (หน้า 92) |
| C7 | แผลผ่าคลอดยังมีส่วนที่ไม่หายสนิทไหม | cesareanAny | `eval:steam` | อบ 2.6 (หน้า 93) |
| C8 | ตอนนี้มีประจำเดือนมามากกว่าปกติไหม | vaginal | ไม่เปลี่ยนหัตถการ → flag `heavy_menses` สำหรับคำเตือนยาประสะไพล | ข้อห้ามประสะไพล (หน้า 82) |

**จำนวนข้อที่ applies (นับในผล):** ผ่าคลอดไม่มีโรคประจำตัว = 16 · คลอดทางช่องคลอดไม่มีโรคประจำตัว = 17 · +A1a ถ้า A1=yes · +B5 ถ้ามีโรคที่เข้าเงื่อนไข → รวมเป็น 16–19 (จากที่แสดงให้ตอบ 20 ข้อ)

**Flow (ADR-0014):** ฟอร์มต่อช่วง ตอบได้ทุกข้อ ไม่ไปข้อถัดไปอัตโนมัติ `unsure` เปิดช่อง "เล่าเพิ่มสั้น ๆ (ไม่บังคับ)" ไม่มีปุ่มโทรปรึกษา · server เป็นคนตัดสิน: เจอ `refer` → M4-R + lock (จังหวะส่งคำตอบ = Q15) · ข้อที่ applies ต้องมีคำตอบ ไม่ตอบ ≠ ผ่าน · `unsure` ในข้อที่ applies ยังเป็นไปตาม `onUnsure` (ไม่ผ่าน — ADR-0005)

## 3. กฎจาก profile (ไม่ต้องถาม)
| id | เงื่อนไข | ผล | ที่มา |
|---|---|---|---|
| P-HOTSTONE-CS | cesareanAny | `hot_stone: forbidden` "ห้ามในหญิงผ่าคลอด" | สถาบันฯ หน้า 123 |
| P-STEAM-CHRONIC | chronic ∩ {asthma, heart, hypertension, diabetes, epilepsy} ≠ ∅ | `steam: evaluate` | อบ 2.8 (หน้า 93) — ⚠︎ ตรวจรายการโรคกับคู่มือ |
| P-MASSAGE-SCAR | cesareanAny ∧ day < 30 | massage: note "ห้ามนวดบริเวณที่ผ่าตัด" (ไม่เปลี่ยนสถานะ ถ้ายังไม่ถึงวันเริ่ม) | หน้า 91 |
| P-ALLERGY | herbal_allergy ∈ {yes, unsure} | `compress, steam: evaluate` | ⚠︎ ข้อเสนอทีม |

## 4. กรอบเวลา
| id | กฎ | ค่าคู่มือ | หน่วยบริการตั้งได้ | ที่มา |
|---|---|---|---|---|
| T-START-VAG | วันเริ่มรับบริการ คลอดทางช่องคลอด | 2 วัน (ปกติ 2–7) | ≥ 2 | หน้า 78, 96 |
| T-START-CS | วันเริ่มรับบริการ ผ่าคลอด | 30 วัน (1 เดือน) | ≥ 30 | หน้า 78, 96 |
| T-EARLY-APPROVAL | เริ่มภายใน 7 วันแรก ต้องให้ผู้มีสิทธิ์เห็นชอบ | — | — | หน้า 96 → เริ่มก่อนวัน 7 เป็น `evaluate` |
| T-SALTPOT-VAG | ทับหม้อเกลือ คลอดทางช่องคลอด | 7 วัน | — | หน้า 92 |
| T-SALTPOT-CS | ทับหม้อเกลือ ผ่าคลอด | 30 วัน | — | หน้า 92 |
| T-DEADLINE | เส้นตาย (หมดช่วงรับบริการ) | 3 เดือน | — | หน้า 78, 96 |
| T-STEAM-COURSE | คอร์สอบสมุนไพร | 30 นาที/ครั้ง ต่อเนื่อง 5–7 วัน | แพทย์สร้างคอร์ส คุณแม่จองเองไม่ได้ | คู่มือ (P2 ป้าย "จากคู่มือ") |

`day` = วันหลังคลอด, วันคลอด = day 0 ส่วน `deadline = delivery_date + 3 เดือน` (บวกตามปฏิทิน) · ถ้า day < วันเริ่ม → `not_yet` + `availableFrom` · ถ้า day > deadline → ทุกหัตถการ `forbidden` "หมดช่วงรับบริการ" · ถ้าคุณแม่ยังไม่ได้เลือกหน่วย ให้ใช้ค่าคู่มือแล้วบอกว่า "บางหน่วยบริการอาจให้เริ่มช้ากว่านี้"

## 5. สิทธิ์
| id | กฎ | ค่า | ที่มา |
|---|---|---|---|
| Q-GOLD | บัตรทอง | ≤ 5 ครั้งใน 3 เดือน, ≤ 1 ครั้งต่อวัน | KH หน้า 4 (ยังไม่เจอประกาศ สปสช. 2569 ฉบับเต็ม → เก็บเป็นค่าที่แก้ได้) |
| Q-MULTI | จองหลายหัตถการในครั้งเดียว | นับ 1 ครั้ง | UX M6-2 |
| Q-SCOPE | นับเฉพาะครั้งที่จองผ่านเรือนไฟ | — | ADR-0012 |
| Q-COURSE | คอร์สอบ N วัน | นับ N ครั้ง ถ้าเกินสิทธิ์ที่เหลือให้เตือน แต่ไม่บล็อก (แพทย์ตัดสิน) | UX P5 |

## 6. ข้อห้ามยา (P6) — ยา 11 รายการ ตาราง 4.1 (หน้า 81–89)
ยา: ยาเลือดงาม, ยาไฟประลัยกัลป์, ยาไฟห้ากอง, ยาประสะไพล, ยาปลูกไฟธาตุ, ยาสตรีหลังคลอด, ยาหอมเทพจิตร, ยาหอมแก้ลมวิงเวียน, ยาหอมทิพโอสถ, ยาหอมนวโกฐ, ยาหอมอินทจักร์

| id | เงื่อนไข | ยา | ข้อความ | ที่มา |
|---|---|---|---|---|
| D-CS6 | cesareanAny | เลือดงาม, ไฟประลัยกัลป์, ไฟห้ากอง, ประสะไพล, ปลูกไฟธาตุ, สตรีหลังคลอด | "ห้ามใช้: ผู้รับบริการผ่าคลอด" | ตาราง 4.1 หน้า 81–89 |
| D-FEVER | A1 = yes/unsure ในผลล่าสุด | ⚠︎Q3 | "ห้ามใช้ตอนมีไข้" | ตาราง 4.1 |
| D-MENSES | C8 = yes/unsure | ประสะไพล | "ห้ามรับประทานในหญิงที่มีระดูมากกว่าปกติ" | หน้า 82 |
| D-HOM | ยาหอม* | ยาหอม 5 ตัว | "ระวังในคนที่ใช้ยาต้านการจับตัวของเกล็ดเลือด และคนที่แพ้ละอองเกสร" | ตาราง 4.1 |

คำเตือนเป็นแค่คำเตือน **ไม่บล็อก** แพทย์เลือกได้ 2 อย่าง คือ `changed` (เปลี่ยนยา) หรือ `acknowledged` (รับทราบและยืนยัน) และทั้งสองแบบต้องบันทึกไว้ (D5 นับจำนวน)

## 7. รหัส (P5)
- กิจกรรมชุดบริการ 5 กิจกรรม: ทับหม้อเกลือ 9007712 · นวด 9007713 · ประคบสมุนไพร 9007714 · อบไอน้ำสมุนไพร 9007716 · คำแนะนำการปฏิบัติตัว 9007730 (ถ้าไม่ครบชุดให้เตือน แต่ยังบันทึกได้) ⚠︎Q8
- ICD-10-TM ระยะหลังคลอด เช่น U50.2 น้ำคาวปลาไม่เดิน, U50.3 อยู่ไฟไม่ได้ (หน้า 105–106) แพทย์เลือกเอง ระบบไม่เลือกให้

## 8. Ruleset JSON schema (สรุป)

```ts
type Ref = { source: 'คู่มือ' | 'KH' | 'สถาบันฯ' | 'team'; page?: string; quote?: string }

type Ruleset = {
  version: string                    // "1.0"
  status: 'draft' | 'active' | 'rejected'
  questions: {
    id: string; section: 1 | 2 | 3; text: string; hint?: string
    askIf?: Cond; onYes: Effect[]; onNo?: Effect[]; onUnsure: Effect[]
    checkin?: { order: number; askIf?: Cond }
    extra?: 'hotline_1323'
    ref: Ref[]
  }[]
  profileRules: { id: string; when: Cond; effects: Effect[]; ref: Ref[] }[]
  windows: { id: string; procedure: Procedure | '*'; method: 'vaginal' | 'cesareanAny'
             startDay: number; unitMayDelay: boolean; ref: Ref[] }[]
  deadlineMonths: number             // 3
  earlyApprovalBeforeDay: number     // 7
  quota: { coverage: string; maxVisits: number; perMonths: number; perDay: number; ref: Ref[] }[]
  drugs: { id: string; name: string; group?: 'hom' }[]
  drugRules: { id: string; when: Cond; drugs: string[]; message: string; ref: Ref[] }[]
  activityCodes: { procedure: Procedure | 'advice'; code: string }[]
}

type Cond =
  | { method: DeliveryMethod[] } | { chronicAny: Chronic[] } | { answer: [qid: string, Answer[]] }
  | { profile: [field: string, unknown[]] } | { dayLt: number } | { all: Cond[] } | { any: Cond[] }

type Effect =
  | { refer: true } | { evalAll: true } | { eval: Procedure } | { forbid: Procedure; message: string }
  | { ask: string } | { flag: string } | { note: Procedure; message: string }
```

engine API (pure):
```ts
questionsFor(ruleset, profile, mode: 'screening' | 'checkin'): (Question & { applies: boolean })[]  // screening = ครบ 20 ข้อ ไม่กรอง; checkin = เฉพาะข้อเช็กอินที่ applies
evaluate(ruleset, profile, answers, today, unit?): {
  referral: { qid: string; label: string } | null
  procedures: Record<Procedure, { status: ProcStatus; reasons: { text: string; ref: Ref[] }[]; availableFrom?: string }>
  day: number; deadline: string; summaryLine: string   // "มี 1 อย่างที่ต้องให้แพทย์แผนไทยดูก่อนนะคะ"
  rulesetVersion: string
}
drugWarnings(ruleset, profile, latestAnswers, drugId): { ruleId: string; message: string; ref: Ref[] }[]
```

## 9. Test cases ที่ engine ต้องผ่าน
| # | Input | Expect |
|---|---|---|
| 1 | cesarean, ไม่มีโรค | `questionsFor` screening = 20 ข้อ, `applies` = 16 ข้อ, C7 applies, A4/C8 ไม่ applies |
| 2 | normal, ไม่มีโรค | applies 17 ข้อ, A4/C8 applies, C7 ไม่ applies |
| 3 | cesarean + hypertension | applies 17 ข้อ (มี B5), `steam: evaluate` จาก P-STEAM-CHRONIC |
| 4 | A1=yes | A1a applies (นับเป็นข้อ 2 จาก 17) |
| 5 | A1=yes, A1a=no | `referral.qid = A1`, ห้ามจอง |
| 6 | A1=yes, A1a=yes | ไม่ส่งต่อ, ทุกหัตถการ `evaluate` |
| 7 | A1=unsure | ทุกหัตถการ `evaluate`, ไม่ส่งต่อ |
| 8 | A5=yes | `referral.qid = A5` ("มีเลือดออกมากผิดปกติ") |
| 9 | cesarean, day 20, ตอบ no ทั้งหมด | ทุกหัตถการ `not_yet`, availableFrom = day 30; `hot_stone: forbidden` |
| 10 | cesarean, day 33, C7=yes, ที่เหลือ no | massage/compress/salt_pot `ok`, steam `evaluate`, hot_stone `forbidden` — ตรงกับ M4 |
| 11 | normal, day 5 | salt_pot `not_yet` (วัน 7); ตัวอื่น `evaluate` (T-EARLY-APPROVAL) |
| 12 | day > deadline | ทุกหัตถการ `forbidden` "หมดช่วงรับบริการ" |
| 13 | C1=yes | เฉพาะ compress `evaluate` |
| 14 | cesarean + drug ยาไฟประลัยกัลป์ | warning D-CS6 อ้างหน้า 81–89 |
| 15 | normal, C8=yes + ประสะไพล | warning D-MENSES หน้า 82 |
| 16 | input เดิม 2 ครั้ง | ผลเหมือนกัน (deterministic) และมี `rulesetVersion` |
| 17 | ทุก reason | มี ref อย่างน้อย 1 อัน |
| 18 | cesarean, A4=yes (ข้อไม่ applies), ที่เหลือ no | ไม่ส่งต่อ, ไม่มี reason จาก A4 (คำตอบถูกตัด) |
| 19 | A1=no, A1a=no | ไม่ส่งต่อ (A1a ไม่ applies คำตอบถูกตัด) |
| 20 | ข้อที่ applies ไม่มีคำตอบ | `validation` ไม่ใช่ผ่าน |
| 21 | ข้อที่ applies ตอบ unsure | ไม่นับเป็นผ่าน (`evaluate`/ตาม `onUnsure`) |
