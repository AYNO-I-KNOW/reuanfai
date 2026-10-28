-- ชื่อสั้นของแหล่งอ้างอิงสำหรับแสดง citation แบบรวมต่อแหล่ง (ห้ามแก้ 0001–0005 — apply แล้ว; apply ไฟล์นี้ด้วย psql "$SUPABASE_DB_URL" -f)
-- ไม่แตะ grants/RLS เดิมของ kb_sources; null = web fallback ไปใช้ apa
alter table public.kb_sources add column if not exists short text;
