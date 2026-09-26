# ADR-0013: web proxy `/api/*` → api project (same origin)

- สถานะ: Accepted · 2026-09-26 · แก้เพิ่ม ADR-0003 (deploy) และ ADR-0011 (session cookie)

## บริบท
deploy แบบ 2 Vercel project (ADR-0003) ทำให้ได้โดเมนแยกกัน `reuanfai-web.vercel.app` กับ `reuanfai-api.vercel.app` ซึ่งอยู่ใน public suffix list เบราว์เซอร์จึงนับว่าเป็นคนละ site ผลคือ session cookie แบบ httpOnly + `SameSite=Lax` (ADR-0011) จะไม่ถูกส่งไปกับ `fetch` จาก web ไป api และ login จะใช้ไม่ได้

## ตัดสินใจ
- web มี rewrite `/api/:path*` → `${API_ORIGIN}/:path*` (`apps/web/next.config.ts`)
- เบราว์เซอร์เรียก **`/api/*` บนโดเมนของ web เท่านั้น** ทำให้ cookie เป็น first-party และไม่ต้องใช้ CORS (เอา CORS ออกจาก api แล้ว)
- route ใน api ไม่มี prefix `/api` (rewrite ตัด prefix ออกให้) ส่วน LINE webhook และ cron เรียก api project ตรง
- server component เรียก `API_ORIGIN` ตรง และต้อง forward cookie ของ request เอง
- env: `API_ORIGIN` เป็น server-only (ใช้แทน `NEXT_PUBLIC_API_URL`) และเลิกใช้ `WEB_ORIGIN`
- ยังเป็น 2 project deploy และ build แยกกันเหมือนเดิม (มี skip unaffected projects)

## ผลที่ตามมา
- ตอน provision Vercel ให้ตั้ง **Related Projects** (`relatedProjects` ใน `apps/web/vercel.json` + `@vercel/related-projects`) เพื่อให้ preview ของ web ชี้ไปที่ preview ของ api ในสาขาเดียวกัน ไม่งั้น preview ของ web จะยิงไปที่ api production
- request จากเบราว์เซอร์วิ่งผ่าน edge ของ web 1 hop (latency เพิ่มเล็กน้อย) ซึ่งยอมรับได้
- api project ยังเข้าถึงได้จาก public URL ตรง ๆ ความปลอดภัยจึงต้องพึ่ง auth ทุก route ไม่ใช่พึ่ง CORS
