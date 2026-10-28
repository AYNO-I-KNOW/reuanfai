-- track filter หลัง HNSW: index คืน candidate ~40 ตัว (ef_search) แล้วค่อย filter → ถ้าเป็นอีก track หมดจะได้ 0 แถว
-- (ตั้ง hnsw.iterative_scan ใน function ไม่ได้บน Supabase) → materialize แถวที่ผ่าน filter ก่อน แล้ว exact scan
-- ~2k chunks exact scan เร็วพอ; ถ้าโตหลักแสนค่อยแยก index ต่อ track
create or replace function public.match_kb_chunks(
  query_embedding extensions.vector(768),
  k int default 5,
  filter_track text default null
)
returns table (id bigint, source_id text, page int, text text, similarity float)
language sql stable
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
  order by sc.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(k, 1), 20);
$$;

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
  scoped as materialized (
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
