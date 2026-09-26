# เรือนไฟ (ReuanFai)

เว็บแอปบน LINE OA สำหรับแม่หลังคลอด + หน่วยบริการ + กรมฯ — DTAM 2026 Track 3 ผดุงครรภ์ไทย

## อ่านก่อนทำงาน
- `docs/SPEC.md` — ขอบเขต, phase, คำถามที่ยังเปิด
- `docs/ARCHITECTURE.md` — ระบบ, ขอบเขตแต่ละส่วน, trust boundary
- `docs/specs/*` — data model, API, rules, notifications, AI, screen map
- `docs/adr/*` — การตัดสินใจที่ล็อกแล้ว

## กฎ (ห้ามละเมิด)
1. **Concept, UX brief และ ADR ที่ Accepted แล้วห้ามแก้ เว้นแต่เจ้าของโปรเจกต์สั่ง** (ADR-0000) ถ้าต้องเปลี่ยน ให้เขียน ADR ใหม่มา supersede
2. **ห้าม implement หน้าจอก่อน phase นั้นผ่าน `docs/DESIGN-REVIEW.md`** ส่วน backend ที่ไม่ขึ้นกับ design (schema, rules engine, booking, stock) ทำตาม spec ได้เลย
3. Rules engine ต้องเป็น pure + deterministic ห้ามมี LLM/I/O (ADR-0001)
4. `unsure` ห้ามถือเป็นผ่าน (ADR-0005)
5. ห้ามมีข้อมูลสุขภาพในข้อความ LINE (ADR-0006)
6. web ห้ามต่อ DB ตรง ต้องผ่าน api เท่านั้น (ADR-0004)
7. กรมฯ ใช้ได้แค่ `agg_*` + suppression n<5 (ADR-0008)
8. spec ขัดกับเอกสารใน `docs/concept/` → ถือเอกสารต้นฉบับ แล้วเพิ่มลงคำถามที่ยังเปิดใน SPEC.md

## Repo
- `apps/web` — Next.js 16 (อ่าน `apps/web/AGENTS.md` ก่อนเขียนโค้ด Next)
- `apps/api` — Hono, export `AppType` ให้ web ใช้ผ่าน `hc`
- `pnpm dev` · `pnpm build` · `pnpm typecheck` · `pnpm lint`
