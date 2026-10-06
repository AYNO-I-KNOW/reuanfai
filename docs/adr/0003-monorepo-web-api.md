# ADR-0003: Monorepo — Next.js web + Hono api

- สถานะ: Accepted · 2026-09-26 · แก้เพิ่มโดย ADR-0013, ADR-0014 (route)

## ตัดสินใจ
- pnpm workspaces: `apps/web` (Next.js 16 App Router + shadcn + Tailwind 4) กับ `apps/api` (Hono)
- web เป็นแอปเดียวที่มี 3 route group: `/m` (แม่ บนมือถือใน LIFF), `/provider` (หน่วยบริการ), `/dtam` (กรมฯ) (route จริงตาม ADR-0014: `ruenfai/*`, `clinic`, `department`)
- type ของ API ส่งผ่าน **Hono RPC** (`export type AppType` → `hc<AppType>()`) เลยไม่ต้องมี shared package
- deploy เป็น Vercel 2 project (root `apps/web`, `apps/api`) และเบราว์เซอร์เข้า api ผ่าน `/api` rewrite ของ web (ADR-0013)
- ไม่ใช้ Turborepo (ใช้ `pnpm -r` พอ) → ถ้า build ช้าเกิน 5 นาทีค่อยเพิ่ม

## เหตุผล
- แยก back ออกมาเพื่อให้ rules engine, cron และ LINE webhook อยู่ที่เดียว และไม่ผูกกับ lifecycle ของ UI
- ใช้ TS ทั้ง repo ทำให้ type ตรงกันตั้งแต่ DB จนถึงหน้าจอ
- Next.js + shadcn เป็น stack เดียวกับ repo อื่นของ org (ainigma)
