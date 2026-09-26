# ADR-0004: Supabase Postgres, API เป็นทางเดียวที่เข้าถึง DB

- สถานะ: Accepted · 2026-09-26

## ตัดสินใจ
- DB = Supabase Postgres (provision ผ่าน Vercel Marketplace) และ migration อยู่ใน `supabase/migrations/`
- **มีแค่ `apps/api` ที่ต่อ DB** (service role key) ส่วน web ไม่มี Supabase key
- เปิด RLS ทุกตาราง ไม่มี policy (deny-all) ถ้า anon key รั่วก็อ่านอะไรไม่ได้
- API ทำ authorization เองทุก route: role + unit scope + การแชร์ข้อมูลของแม่ (ADR-0007)
- ข้อมูลที่กรมฯ ใช้อ่านได้เฉพาะจาก SQL views รวมกลุ่ม (ADR-0008)

## เหตุผล
ถ้าให้ web ใช้ RLS ด้วย เงื่อนไข consent/share/unit ต้องเขียนซ้ำทั้งใน SQL policy และใน API จึงเลือกให้มีจุดตรวจเดียว

## ความเสี่ยง
service role key หลุด = ข้อมูลหลุดทั้งหมด → เก็บใน Vercel env ของ api project เท่านั้น
