# API spec — `apps/api` (Hono)

> Base: `NEXT_PUBLIC_API_URL` · JSON · validate body ด้วย zod · error = `{ error: code, message }`
> Auth: cookie `rf_session` (JWT: `sub`, `role`, `unit_id?`) · `requireRole(...)` ทุก route ยกเว้นที่เขียนว่า public
> web เรียกผ่าน `hc<AppType>` ทุก route ต้อง chain บน app เดียวกันเพื่อให้ type ไหลไปถึง web

## Error codes
`unauthorized` 401 · `forbidden` 403 · `not_found` 404 · `validation` 422 · `consent_required` 403 · `referral_locked` 409 · `quota_exhausted` 409 · `slot_full` 409 · `outside_window` 409 · `same_day` 409 · `out_of_stock` 409 · `eligibility_unchecked` 422 · `share_required` 403

## 0. Public / system
| Method | Path | Auth | หมายเหตุ |
|---|---|---|---|
| GET | `/health` | public | ✅ มีแล้ว |
| POST | `/auth/line` | public | `{ idToken }` → set cookie, `{ mother: { id, hasConsent } }` |
| POST | `/auth/staff` | public | `{ username, password, unitId?, role }` → set cookie · rate limit 5/นาที/IP |
| POST | `/auth/logout` | any | |
| POST | `/line/webhook` | LINE signature | event `follow` → upsert mother + enqueue N1 |
| POST | `/cron/dispatch` | `x-cron-secret` | ส่ง outbox ที่ถึงเวลา ≤100 รายการ |
| POST | `/cron/sweep` | `x-cron-secret` | enqueue N7, N8, mark `no_show`, สร้าง slots ล่วงหน้า 30 วัน |
| POST | `/cron/ai` | `x-cron-secret` | AI-2 รายวัน, AI-1 รายสัปดาห์ |

## 1. Mother — `requireRole('mother')`
ทุก route ยกเว้น `/me/consent` ต้องมี consent `care` ไม่งั้น `consent_required`

| Method | Path | Screen | Req → Res |
|---|---|---|---|
| GET | `/me` | ทุกหน้า | → `{ profile, consent: {care, aggregate}, day, method, deadline, quota: {used, max, until}, lock: {qid, label} \| null, nextAppointment, unitPhone }` |
| POST | `/me/consent` | M1 | `{ care: true, aggregate: boolean }` |
| DELETE | `/me/consent/aggregate` | M11 | ถอน consent ชั้น 2 |
| PUT | `/me/profile` | M2 | `{ deliveryDate, deliveryMethod, chronic[], herbalAllergy, preeclampsia, regularMeds, coverage?, preferredUnitId? }` → `{ recomputed: boolean }` (ถ้าแก้วันคลอด/วิธีคลอด ผลคัดกรองกับนัดจะถูกคำนวณใหม่) |
| GET | `/me/screening/questions` | M3 | `?mode=screening\|checkin&appointmentId?` → `{ rulesetVersion, sections[{n, title}], questions[{id, section, text, hint, onYes, onNo, onUnsure, extra}] }` |
| POST | `/me/screenings` | M3→M4 | `{ answers[{qid, value, note?}] }` → `EvaluateResult` (rules.md §8) + `{ screeningId }` |
| GET | `/me/results/latest` | M4 | → `EvaluateResult` |
| POST | `/me/referral/contacted` | M4-R | บันทึก `contacted_at` |
| GET | `/me/calendar` | M5 | `?month=2026-11` → `{ days[{date, status: start\|not_yet\|deadline, dots: ('appt'\|'med')[], procedures: Record<Procedure, ProcStatus>}], cards }` |
| GET | `/me/units` | M6-1 | → `[{ id, name, district, distanceKm?, procedures[], preferred }]` (ชื่อสมมติ) |
| GET | `/me/units/:id/procedures` | M6-2 | → `[{ procedure, status, availableFrom?, bookable: boolean, bookAs: 'procedure'\|'eval'\|null }]` (อบ = ต้องนัดประเมิน / แพทย์เป็นคนสร้างคอร์ส) |
| GET | `/me/units/:id/availability` | M6-3 | `?procedures=massage,compress&from&to` → `{ days[{date, state: open\|full\|closed\|out_of_window\|has_booking, slots[{id, time, state: open\|full}]}] }` |
| POST | `/me/appointments` | M6-4 | `{ unitId, slotId, procedures[], kind, shareSummary }` → `{ appointment, quotaNo }` · errors: `referral_locked`, `quota_exhausted`, `slot_full`, `outside_window`, `same_day` |
| GET | `/me/appointments` | M7 | `?tab=upcoming\|history` |
| POST | `/me/appointments/:id/reschedule` | M7 | `{ slotId }` |
| POST | `/me/appointments/:id/cancel` | M7 | คืนสิทธิ์ |
| POST | `/me/appointments/:id/checkin` | M8 | `{ answers[], pain? }` → `{ outcome: unchanged\|awaiting_eval\|referred, reason?, unitNotified }` |
| GET | `/me/meds` | M9 | → `{ mode, prescriptions[{drugName, from, to}], today[{doseId, label, drugName, takenAt}] }` |
| PUT | `/me/meds/mode` | M9 | `{ mode: per_dose\|daily }` |
| POST | `/me/meds/doses/:id/taken` | M9 | |
| POST | `/me/meds/adverse` | M9 | `{ text? }` → หยุดเตือน + `staff_alert(adverse_med)` |
| POST | `/me/appointments/:id/review` | M10 | `{ painAfter, ratings{explain,clean,wait,overall}, text?, adverse, adverseText? }` |
| GET | `/me/shares` | M11 | |
| DELETE | `/me/shares/:unitId` | M11 | |
| DELETE | `/me` | M11 | ขอลบข้อมูล (ต้องส่ง `{ confirm: true }`) |

## 2. Provider — `requireRole('doctor'|'staff'|'pharmacist')` + scope `unit_id`
| Method | Path | Role | Screen | หมายเหตุ |
|---|---|---|---|---|
| GET/PUT | `/provider/services` | doctor | P2 | บริการที่เปิด, duration, capacity |
| GET/PUT | `/provider/start-days` | doctor | P2 | `start_day ≥ ค่าคู่มือ` ไม่งั้น `validation` |
| GET | `/provider/quota-policy` | any | P2 | อ่านจาก ruleset (⚠︎Q4 การปรับ) |
| GET/PUT | `/provider/schedule` | doctor | P2 | `?practitionerId` weekly template (แพทย์แก้ได้แค่ตารางของตัวเอง) |
| POST/DELETE | `/provider/closures` | doctor | P2 | |
| GET | `/provider/queue` | doctor, staff | P3 | `?date&view=day\|week` → rows `{ time, displayCode, day, method, procedures, quotaNo, eligibility: checked\|unchecked, screening: pass\|evaluate\|unsure_n\|checkin_changed }` + `banner[]` |
| POST | `/provider/appointments/:id/confirm` | staff | P3 | → N2 |
| POST | `/provider/appointments/:id/propose` | staff | P3 | `{ slotId }` → N4 |
| GET | `/provider/cases/:appointmentId` | doctor, staff | P4 | ต้องมี share ที่ยังใช้ได้ **และบันทึก access_log** → `{ header, mustReview[], history (หน้า 79, 97), timeline[], painPrev }` |
| POST | `/provider/appointments/:id/treatment` | doctor | P5 | `{ eligibilityChecked: true, decisions[], painBefore, painAfter, icd10tm, activityCodes[], course?, nextSlotId? }` → `{ warnings: ['incomplete_activity_set', 'course_exceeds_quota'] }` |
| POST | `/provider/mothers/:id/unlock` | doctor | P4 | ปลด referral lock |
| GET | `/provider/drugs` | doctor | P6 | 11 รายการ + qty รวม |
| POST | `/provider/prescriptions/check` | doctor | P6 | `{ appointmentId, drugId }` → `{ warnings[{ruleId, message, ref}] }` |
| POST | `/provider/prescriptions` | doctor | P6 | `{ appointmentId, drugId, dose, method, days, decision }` → ตัด stock FEFO + สร้าง med_doses + N5 · `out_of_stock` |
| GET | `/provider/inventory` | any | P7 | `[{ drug, qty, unitLabel, lot, expiry, reorderPoint, state }]` + banner |
| GET | `/provider/inventory/moves` | any | P7 | ประวัติการจ่าย |
| POST | `/provider/inventory/receive` | pharmacist | P7 | `{ drugId, lot, expiry, qty }` |
| POST | `/provider/inventory/adjust` | pharmacist | P7 | `{ lotId, delta, reason }` (ต้องมี reason) |
| GET | `/provider/reviews` | doctor, staff | P8 | ถ้า n<5 คืน `insufficient` → `{ n, averages, themes[{label, count, example}] }` |
| GET | `/provider/alerts` | staff | P3, P8 | |
| POST | `/provider/alerts/:id/contacted` | staff | P8 | |

## 3. DTAM — `requireRole('dtam_viewer'|'rule_approver')`
Filter มาตรฐาน (query): `region, province, unitId, range=3m\|6m\|12m, method` · ทุก response มี `{ mock: true, suppressedCells: n }`

| Method | Path | Screen |
|---|---|---|
| GET | `/dtam/filters` | ทุกหน้า (ตัวเลือก dropdown) |
| GET | `/dtam/overview` | D1 — 6 KPI + ตารางหน่วยบริการ |
| GET | `/dtam/outcomes` | D2 |
| GET | `/dtam/safety` | D3 |
| GET | `/dtam/access` | D4 |
| GET | `/dtam/drugs` | D5 |
| GET | `/dtam/satisfaction` | D6 |
| GET | `/dtam/ai-proposals` | D7 |
| POST | `/dtam/ai-proposals/:id/decision` | D7 — `{ decision: accepted\|rejected\|more_info, comment }` → ถ้าเกี่ยวกับเกณฑ์ สร้าง draft ruleset |
| GET | `/dtam/rulesets` | D8 — ทุกเวอร์ชัน + diff |
| POST | `/dtam/rulesets/:version/approve` | D8 · `rule_approver` เท่านั้น |
| POST | `/dtam/rulesets/:version/reject` | D8 · `rule_approver` เท่านั้น |

ค่า KPI ทุกตัว = `number | { suppressed: true }`

## 4. Shared types (export จาก api ให้ web ใช้)
`Procedure`, `ProcStatus`, `Answer`, `DeliveryMethod`, `EvaluateResult`, `AppointmentStatus`, `Role` — อยู่ใน `apps/api/src/types.ts` แล้ว re-export จาก `index.ts`
