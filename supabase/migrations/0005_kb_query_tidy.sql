-- tidy retrieval functions (ห้ามแก้ 0001–0004 — apply แล้ว; apply ไฟล์นี้ด้วย psql "$SUPABASE_DB_URL" -f)
-- create or replace คง ACL เดิม (service_role เท่านั้น) จึงไม่ต้อง grant ซ้ำ

-- 1) match_kb_chunks: security invoker ชัดเจน + order by distance, id (ผลลัพธ์ deterministic เวลา distance เท่ากัน)
create or replace function public.match_kb_chunks(
  query_embedding extensions.vector(768),
  k int default 5,
  filter_track text default null
)
returns table (id bigint, source_id text, page int, text text, similarity float)
language sql stable
security invoker
set search_path = ''
as $$
  with scoped as materialized (
    select c.id, c.source_id, c.page, c.text, c.embedding
    from public.kb_chunks c
    join public.kb_sources s on s.id = c.source_id
    where filter_track is null or s.track = filter_track
  )
  select sc.id, sc.source_id, sc.page, sc.text,
         1 - (sc.embedding operator(extensions.<=>) query_embedding) as similarity
  from scoped sc
  order by sc.embedding operator(extensions.<=>) query_embedding, sc.id
  limit least(greatest(k, 1), 20);
$$;

-- 2) match_kb_chunks_hybrid
-- - scoped CTE เลือกแค่ id, text, dist (ไม่ลาก embedding/source_id/page ที่ไม่ใช้)
-- - term_patterns เรียงตามลำดับ term ที่ส่งมา (with ordinality) ก่อน limit 20 → term แรก ๆ ไม่ถูกตัดแบบสุ่ม
-- - เรียงผลสุดท้ายเพิ่ม c.id เป็น tiebreak
create or replace function public.match_kb_chunks_hybrid(
  query_embedding extensions.vector(768),
  terms text[],
  k int default 5,
  filter_track text default null
)
returns table (id bigint, source_id text, page int, text text, similarity float)
language sql stable
security invoker
set search_path = ''
as $$
  with term_patterns as (
    select p.pattern
    from (
      select '%' || replace(replace(replace(t.term, '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern,
             min(t.ord) as ord
      from unnest(terms) with ordinality as t(term, ord)
      where length(btrim(t.term)) > 0
      group by 1
    ) p
    order by p.ord
    limit 20
  ),
  -- materialized: กัน planner ใช้ HNSW แล้ว filter track ทีหลัง (ได้ 0 แถว — ดู 0004) ถ้าเพิ่ม index กลับมา
  scoped as materialized (
    select c.id, c.text,
           c.embedding operator(extensions.<=>) query_embedding as dist
    from public.kb_chunks c
    join public.kb_sources s on s.id = c.source_id
    where filter_track is null or s.track = filter_track
  ),
  dense as (
    select d.id, row_number() over (order by d.dist, d.id) as rnk
    from (select sc.id, sc.dist from scoped sc order by sc.dist, sc.id limit 40) d
  ),
  keyword as (
    select m.id, row_number() over (order by m.hits desc, m.dist, m.id) as rnk
    from (
      select sc.id, sc.dist, count(*) as hits
      from scoped sc
      join term_patterns p on sc.text ilike p.pattern
      group by sc.id, sc.dist
      order by hits desc, sc.dist, sc.id
      limit 100
    ) m
  ),
  fused as (
    select coalesce(d.id, kw.id) as id,
           coalesce(1.0 / (60 + d.rnk), 0) + coalesce(1.0 / (60 + kw.rnk), 0) as rrf
    from dense d
    full join keyword kw on kw.id = d.id
  )
  select c.id, c.source_id, c.page, c.text,
         1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
  from fused f
  join public.kb_chunks c on c.id = f.id
  order by f.rrf desc, c.embedding operator(extensions.<=>) query_embedding, c.id
  limit least(greatest(k, 1), 20);
$$;

-- 3) index HNSW ไม่ถูกใช้แล้วตั้งแต่ 0004 (exact scan หลัง filter track) → ทิ้งเพื่อลดต้นทุน write
-- ถ้า chunk > ~10k ให้สร้าง partial HNSW แยกต่อ track กลับมา
drop index if exists public.kb_chunks_embedding_idx;
