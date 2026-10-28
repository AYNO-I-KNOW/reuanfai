-- ingest แบบ batch + hybrid retrieval (dense + keyword, RRF)
-- ห้ามแก้ 0001/0002 (apply แล้ว) — apply ไฟล์นี้ใน Supabase SQL editor

-- 1) kb_replace_source_chunks: เพิ่ม p_append
-- ส่งทั้ง source ใน jsonb ก้อนเดียวแล้ว statement timeout → ingest ส่งทีละ ~100 แถว:
--   batch แรก p_append=false (ลบแถวเดิมของ source แล้ว insert), batch ถัดไป p_append=true (insert ต่อ)
-- ข้อควรรู้: แต่ละ batch เป็นคนละ transaction → ถ้าพังกลางทาง source จะค้างแบบไม่ครบ; รัน ingest ซ้ำเพื่อแก้
--   (batch แรกลบของเดิมทิ้งเสมอ จึงไม่มีแถวซ้ำ)
-- drop overload 2 arg เพื่อไม่ให้ PostgREST เลือก overload กำกวม (call 2 arg จะตกมาที่ตัวใหม่ด้วย default false)
drop function if exists public.kb_replace_source_chunks(text, jsonb);

create or replace function public.kb_replace_source_chunks(
  p_source_id text,
  p_rows jsonb,
  p_append boolean default false
)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted int;
begin
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'p_rows must be a json array';
  end if;

  if not p_append then
    delete from public.kb_chunks where source_id = p_source_id;
  end if;

  insert into public.kb_chunks (source_id, page, chunk_index, text, embedding)
  select p_source_id, r.page, r.chunk_index, r.text, r.embedding::extensions.vector(768)
  from jsonb_to_recordset(p_rows) as r(page int, chunk_index int, text text, embedding text);

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke execute on function public.kb_replace_source_chunks(text, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.kb_replace_source_chunks(text, jsonb, boolean) to service_role;

-- 2) match_kb_chunks_hybrid
-- dense อย่างเดียวพลาดชื่อยาไทยที่หายากในคำถามสั้น ๆ → รวมกับ keyword (ILIKE) แล้ว fuse ด้วย RRF (k=60)
-- candidate = top 40 ตาม cosine ∪ chunk ที่มี term ใดก็ได้ (ILIKE, หนี % _ \ ใน term; seq scan พอที่ขนาดนี้;
--   ไม่ใช้ pg_trgm เพราะภาษาไทยไม่มีตัวคั่นคำ trigram word extraction ไม่น่าเชื่อถือ)
-- keyword rank: จำนวน term ที่ไม่ซ้ำที่ match มากสุดก่อน, เสมอกันดูที่ใกล้ใน dense กว่า
-- กันบวม: ใช้ term ไม่เกิน 20 ตัว, keyword candidate สูงสุด 100 แถว
-- similarity = 1 - cosine distance (คอลัมน์เดียวกับ match_kb_chunks) ไม่ใช่คะแนน RRF; เรียงผลตาม RRF
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
    select distinct
      '%' || replace(replace(replace(t.term, '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
    from unnest(terms) as t(term)
    where length(btrim(t.term)) > 0
    limit 20
  ),
  scoped as not materialized (
    select c.id, c.text,
           c.embedding operator(extensions.<=>) query_embedding as dist
    from public.kb_chunks c
    join public.kb_sources s on s.id = c.source_id
    where filter_track is null or s.track = filter_track
  ),
  dense as (
    select d.id, row_number() over (order by d.dist) as rnk
    from (select sc.id, sc.dist from scoped sc order by sc.dist limit 40) d
  ),
  keyword as (
    select m.id, row_number() over (order by m.hits desc, m.dist) as rnk
    from (
      select sc.id, sc.dist, count(*) as hits
      from scoped sc
      join term_patterns p on sc.text ilike p.pattern
      group by sc.id, sc.dist
      order by hits desc, sc.dist
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
  order by f.rrf desc, c.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(k, 1), 20);
$$;

revoke execute on function public.match_kb_chunks_hybrid(extensions.vector, text[], int, text) from public, anon, authenticated;
grant execute on function public.match_kb_chunks_hybrid(extensions.vector, text[], int, text) to service_role;
