# เรือนไฟ

เพื่อนคู่ใจของแม่หลังคลอด บอกได้ว่าอยู่ไฟแบบไหนได้ เมื่อไร และจองได้ที่ไหน ตั้งแต่วันคลอดจนครบ 3 เดือน
DTAM Digital Hackathon 2026 — Track 3 ผดุงครรภ์ไทย

> ⚠︎ ต้นแบบ ใช้ข้อมูลจำลองทั้งหมด เกณฑ์ยังไม่ผ่านการตรวจจากแพทย์แผนไทย

## Demo
**https://reuanfai-web.vercel.app** — ไม่ต้องเข้าสู่ระบบ เลือกมุมมองได้ทันที

| มุมมอง | ลิงก์ | หน้าจอ |
|---|---|---|
| แม่หลังคลอด | [/ruenfai](https://reuanfai-web.vercel.app/ruenfai) | มือถือ (ออกแบบให้เปิดผ่าน LINE) |
| หน่วยบริการ | [/clinic](https://reuanfai-web.vercel.app/clinic) | คอมพิวเตอร์ |
| กรมการแพทย์แผนไทยฯ | [/department](https://reuanfai-web.vercel.app/department) | คอมพิวเตอร์ |

- หน้าเข้าสู่ระบบของหน่วยบริการ/กรมฯ เป็นต้นแบบ กรอกชื่อผู้ใช้และรหัสผ่านใดก็ได้
- มุมมองแม่ เปิดบนคอมพิวเตอร์ได้ แนะนำโหมดมือถือ (DevTools → Toggle device toolbar)
- ข้อมูลที่กรอกเก็บใน browser ของผู้ทดสอบ (localStorage/sessionStorage) ยกเว้นคำถามในแชตที่ส่งไป API เพื่อค้นคลังความรู้

## Stack
- `apps/web` — Next.js 16, React 19, TypeScript
- `apps/api` — Hono (export `AppType` ให้ web เรียกผ่าน `hc`)
- `supabase/` — Postgres + pgvector สำหรับคลังความรู้ (KB) ของแชต
- AI — Gemini ผ่าน OpenAI-compatible API ใช้ตอบแชตจาก KB เท่านั้น ไม่ใช้ตัดสินเกณฑ์อยู่ไฟ ([ADR-0001](docs/adr/0001-rules-decide-not-ai.md), [ADR-0009](docs/adr/0009-ai-scope.md))
- Deploy — Vercel ผ่าน GitHub Actions

## เริ่มต้น
ต้องมี Node ≥ 22 และ pnpm 10
```bash
pnpm install
cp .env.example apps/api/.env && cp .env.example apps/web/.env.local
pnpm dev   # web :3000, api :8787
```
หน้าจอต้นแบบรันได้โดยไม่ต้องตั้งค่า env ส่วนแชต KB ต้องตั้ง `SUPABASE_*` และ `AI_*` (ดูคำอธิบายใน [.env.example](.env.example))

คำสั่งอื่น: `pnpm build` · `pnpm typecheck` · `pnpm lint`

## เอกสาร
[SPEC](docs/SPEC.md) · [Architecture](docs/ARCHITECTURE.md) · [Specs](docs/specs) · [ADR](docs/adr) · [Design review](docs/DESIGN-REVIEW.md)

## Deploy
เมื่อ push เข้า `main` และ CI (typecheck, lint, build) ผ่าน GitHub Actions จะ deploy `apps/api` แล้วตามด้วย `apps/web` ไปที่ Vercel

GitHub Actions secrets ที่ต้องมี: `VERCEL_ORG_ID`, `VERCEL_API_PROJECT_ID`, `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TOKEN`
push branch อื่นจะไม่ deploy

## ทีม
ธนพัชร์ บูรณะรักษ์ธรรม (เกรพ) — Product · พันธวัช อินสุพัตรา (พู) — AI & Backend · ฐานิศร์ จรูญสิริเศรษฐ์ (ออฟ) — UX/UI
