# เรือนไฟ

เพื่อนคู่ใจของแม่หลังคลอด บอกได้ว่าอยู่ไฟแบบไหนได้ เมื่อไร และจองได้ที่ไหน ตั้งแต่วันคลอดจนครบ 3 เดือน
DTAM Thai Traditional Medicine Digital Health & AI — Track ผดุงครรภ์ไทย

> ⚠︎ ต้นแบบ ใช้ข้อมูลจำลองทั้งหมด เกณฑ์ยังไม่ผ่านการตรวจจากแพทย์แผนไทย

## เริ่มต้น
```bash
pnpm install
cp .env.example apps/api/.env && cp .env.example apps/web/.env.local
pnpm dev   # web :3000, api :8787
```

## เอกสาร
[SPEC](docs/SPEC.md) · [Architecture](docs/ARCHITECTURE.md) · [Specs](docs/specs) · [ADR](docs/adr) · [Design review](docs/DESIGN-REVIEW.md)

## Deploy

เมื่อ push เข้า `main` และ CI ผ่าน GitHub Actions จะ build และ deploy ไปที่
`https://reuanfai-web.vercel.app` ผ่าน Vercel CLI โดยไม่ต้องเชื่อม Git integration
กับ private repo ขององค์กร

ตั้ง GitHub Actions repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID` และ
`VERCEL_PROJECT_ID` ให้ตรงกับโปรเจกต์ `reuanfai-web` (Root Directory: `apps/web`)
ใช้ token สำหรับ CI โดยเฉพาะ และเปลี่ยน secret เมื่อ token หมดอายุหรือถูก revoke
การ push branch อื่นและ pull request จะรัน CI เท่านั้น

## ทีม
ธนพัชร์ บูรณะรักษ์ธรรม (เกรพ) — Product · พันธวัช อินสุพัตรา (พู) — AI & Backend · ฐานิศร์ จรูญสิริเศรษฐ์ (ออฟ) — UX/UI
