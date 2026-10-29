---
name: verify-reuanfai
description: ขับเว็บต้นแบบเรือนไฟ (ReuanFai) ใน Chrome จริงเพื่อพิสูจน์ว่าการเปลี่ยนแปลง UI ทำงาน ครอบคลุมแอปมือถือคุณแม่ /ruenfai, หน่วยบริการ /clinic และกรมฯ /department (Next.js web บน localhost). ใช้เมื่อต้องยืนยันพฤติกรรมในเบราว์เซอร์จริง ไม่ใช่แค่ typecheck/test.
---

# verify-reuanfai

พิสูจน์ UI ของเรือนไฟด้วยการเปิดแอปจริง คลิกแบบผู้ใช้ แล้วเก็บหลักฐาน (screenshot + ARIA snapshot + storage dump) ทุกคำสั่งรันจาก repo root: `S=.claude/skills/verify-reuanfai`

ข้อเท็จจริงที่ต้องรู้ก่อนขับ:
- Web (Next 16) ไม่เรียก api เลย สถานะทั้งหมดอยู่ใน localStorage/sessionStorage + mock data ในโค้ด ไม่มี DB/auth/LIFF; "side effect" = storage key (รายการอยู่ใน `features/README.md`)
- api (Hono) มีแค่ `GET /health` -> `{"ok":true}` ที่พอร์ต 8787 (ฮาร์ดโค้ดใน `apps/api/src/dev.ts`)
- ไม่มี `data-testid`: ขับด้วย role + accessible name + ข้อความไทยตรงตัว
- `next dev` จะเขียนทับบล็อกใน `apps/web/AGENTS.md` และแตะ `apps/web/next-env.d.ts` เป็นเรื่องปกติ อย่า revert และอย่า commit เป็นส่วนของงาน

## Launch

```
$S/scripts/setup.sh     # ครั้งเดียว: playwright-core@1.64.1 -> ~/.cache/reuanfai-verify (นอก repo), ใช้ Google Chrome ในเครื่อง
$S/scripts/launch.sh    # WEB_PORT=3000 โดยค่าเริ่มต้น
```

`launch.sh` ปฏิเสธถ้าพอร์ต 8787 หรือพอร์ต web ถูกถือโดยโปรเซสที่เราไม่ได้เริ่ม, สร้าง `RUN_ID`, เริ่ม api และ `next dev -p $WEB_PORT` (`API_ORIGIN=http://localhost:8787`) คนละ process group, log อยู่ที่ evidence dir, state ที่ `.verify/runs/$RUN_ID/`, ชี้ด้วย `.verify/current`. พร้อมใช้ = `/health` เป็น `{"ok":true}` และ `GET /ruenfai` เป็น 200 html (compile ครั้งแรกช้า รอได้ถึง 120 วินาที). พิมพ์ `RUN_ID`, URL, และ path ของ evidence. เริ่มจาก storage ว่างเสมอ (browser context ใหม่ทุกรอบ ไม่มี DB/migration)

## Doctor

```
$S/scripts/doctor.sh
```

อ่านอย่างเดียว: pid ที่บันทึกยังอยู่, listener ของแต่ละพอร์ตอยู่ใน process group ของเรา, `/health` ถูก, `GET /ruenfai` = 200, base เป็น localhost, git HEAD (เตือนถ้าขยับหลัง launch). ออกด้วย non-zero พร้อมเหตุผล รันก่อนขับเสมอ และเมื่อสงสัยอะไรผิดปกติ

## Drive

```
node $S/scripts/drive.mjs booking            # journeys/booking.mjs
node $S/scripts/drive.mjs path/to/x.mjs --headed
```

- Journey คือโมดูล: `export const viewport = {width, height}` (ค่าเริ่มต้น 390x844 สำหรับ `/ruenfai`; `/clinic` และ `/department` ใช้ 1440x900) และ `export default async ({page, step, assert, url}) => {...}`
- `step(name, fn)` รัน action แล้วเซฟ `NN-<name>.png`, `.aria.txt`, `.storage.json` ต่อขั้น; ขั้นที่ fail หยุด journey
- context: locale `th-TH`, timezone `Asia/Bangkok`, Chrome (`channel: 'chrome'`, หรือ `CHROME_PATH=<binary>`); `BASE_URL` ที่ไม่ใช่ localhost ถูกปฏิเสธ และ request ออกนอก localhost ถูก abort + บันทึก
- Exit code 0 = ผ่านทุก step, 1 = มี step ล้มเหลว
- ต้องใช้ selector ที่อยู่ใน `features/*.md` (role/name จริงจาก source); อ่าน `features/README.md` ก่อน แล้วเปิดไฟล์ feature ที่ตรง
- Journey ที่มี: `splash`, `booking` และ `onboarding` (PASS ทั้งหมด; `onboarding` ผ่านทั้ง dev และ `next start`). ที่เหลือ (`payment`, `clinic-dashboard`, `department-dashboard`) มี recipe ใน features/ แต่ยังไม่ได้เขียนเป็นไฟล์ journey และยังไม่ได้รัน

## Evidence

เก็บที่ `.verify/evidence/$RUN_ID/<journey>/` (git ไม่ track: `.verify/.gitignore` = `*`): `NN-*.png|aria.txt|storage.json`, `result.json` (journey, steps pass/fail, error), `meta.json` (consoleErrors, pageErrors, externalRequests), `api.log`, `web.log` ที่ระดับ `$RUN_ID/`

มาตรฐานการพิสูจน์:
- ขับเส้นทางจริงแบบผู้ใช้ (คลิก/พิมพ์ผ่าน role+name) ไม่ใช่เขียน storage เองหรือเรียก setter; ทางลัด dev `?screen=` ใช้ได้แต่ต้องรายงานว่าเป็นทางลัดและห้ามนับเป็น verified ของช่วงที่ข้าม
- เก็บทั้ง action และสถานะผลลัพธ์ ไม่ใช่แค่หน้าสุดท้าย
- Mutation ต้อง assert **ค่าใน storage key** และ **มุมมองผู้ใช้ที่สอง** ที่อ่านจากข้อมูลนั้น (เช่น หน้านัดหมายหลัง reload) ทั้งสองอย่าง
- ตรวจ `meta.json`: แอปนี้ไม่ควรมี network call; `externalRequests` ไม่ว่างคือความผิดปกติต้องรายงาน
- `unsure` ห้ามถือเป็นผ่าน; หน้าจอที่ยังไม่ผ่าน `docs/DESIGN-REVIEW.md` รายงานเป็น unreviewed
- ถ้า journey ต้องการ precondition ที่ seed ไม่มี (เช่น สต็อกลดหลังจ่ายยา ซึ่ง `savePrescription` ยังไม่ถูกเรียกจาก UI) ให้รายงาน FAIL พร้อมเหตุผล ห้ามลดเกณฑ์ให้ผ่าน
- ห้ามอ้างว่า verified ผ่านทางเข้าอื่นที่ไม่ได้รัน

## Cleanup

```
$S/scripts/cleanup.sh
```

kill เฉพาะ process group ที่บันทึกไว้ (ไม่เคย kill ตามชื่อ), รอให้พอร์ตว่าง, ลบ `.verify/runs/$RUN_ID/` และ `.verify/current`, **เก็บ** `.verify/evidence/$RUN_ID/`, แล้วพิมพ์ `git status --short` กับ path ของ evidence ปลอดภัยที่จะรันหลัง launch ที่ล้มเหลว; รันทุกครั้งหลังความพยายามที่พัง จะได้ไม่ค้างโปรเซสและพอร์ต

## Helpers

| คำสั่ง | หน้าที่ |
| --- | --- |
| `scripts/setup.sh` | ติดตั้ง `playwright-core` ตามเวอร์ชันที่ pin ใน cache (idempotent) |
| `scripts/launch.sh` | เริ่ม api + web, รอจนใช้งานได้ |
| `scripts/doctor.sh` | ตรวจ instance (อ่านอย่างเดียว) |
| `scripts/drive.mjs <journey\|path> [--headed]` | รัน journey, เก็บหลักฐาน |
| `scripts/cleanup.sh` | ปิดเฉพาะที่เราเริ่ม, เก็บหลักฐาน |
| `scripts/_common.sh` | ฟังก์ชันร่วม (source เท่านั้น) |

ทุกสคริปต์ executable และหา repo root จากตำแหน่งตัวเอง

## Safety

- **Production ห้ามแตะ.** ห้ามอ่าน/โหลด/พิมพ์ `.vercel/.env.production.local` หรือไฟล์ env ใด ๆ ของ production; ห้ามชี้ไป `https://reuanfai-web.vercel.app` หรือ URL ที่ไม่ใช่ localhost; ห้าม push หรือ deploy (CI deploy `main` ขึ้น production)
- ใช้เฉพาะ `http://localhost:*`; `drive.mjs` ปฏิเสธอย่างอื่น
- Dev DB ไม่มีในโปรเจกต์นี้; ถ้าวันหนึ่งมี ให้ SELECT อย่างเดียว

## Isolation

พอร์ต api 8787 ฮาร์ดโค้ด จึงรันได้ **หนึ่ง instance ต่อเครื่อง** (web เปลี่ยนพอร์ตได้ด้วย `WEB_PORT`) `launch.sh` และ `doctor.sh` ปฏิเสธถ้าพอร์ต 8787 หรือพอร์ต web ถูกถือโดยโปรเซสที่เราไม่ได้เริ่ม (ตรวจ process group ด้วย `lsof`) **ห้ามขับ dev server ของผู้ใช้เอง** ถ้า launch ปฏิเสธ ให้หยุดแล้วรายงาน อย่า kill โปรเซสนั้น
