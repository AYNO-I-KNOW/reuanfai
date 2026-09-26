# ADR-0010: Scheduler — outbox table + pg_cron

- สถานะ: Accepted · 2026-09-26

## บริบท
ต้องเตือนยาทุกรอบ (N5), เตือนก่อนนัด 1 วัน (N3), หลังรับบริการ 1 วัน (N6), 7 วันก่อนเส้นตาย (N7), ไม่เช็กอินเกิน 7 วัน (N8) แต่ Vercel Cron บน Hobby รันได้แค่วันละครั้ง

## ตัดสินใจ
- ทุก event ที่ต้องส่ง เขียนลง `notification_outbox(scheduled_at, template, mother_id, dedupe_key, sent_at)` ใน transaction เดียวกับ event นั้น
- `POST /cron/dispatch` (ต้องมี `x-cron-secret`) ส่งรายการที่ถึงเวลา ครั้งละ ≤ 100 รายการ มี `dedupe_key` unique กันส่งซ้ำ
- `POST /cron/sweep` วันละครั้ง enqueue N7/N8 (เงื่อนไขที่ขึ้นกับวันเวลา)
- ใช้ Supabase `pg_cron` + `pg_net` เรียก dispatch ทุก 5 นาที และ sweep ทุก 07:00 (Asia/Bangkok)

## ผลที่ตามมา
- ข้อความช้าได้สูงสุด ~5 นาที ซึ่งพอสำหรับเตือนยา
- ถ้าย้ายไป Vercel Pro ค่อยเปลี่ยนตัวทริกเกอร์เป็น Vercel Cron ได้ endpoint เดิมใช้ต่อได้เลย
