-- hardening หลัง 0001: grant ชัดเจน, replace chunks แบบ atomic ต่อ source
-- ห้ามแก้ 0001 (apply แล้ว)

revoke all on public.kb_sources, public.kb_chunks from anon, authenticated;
revoke all on sequence public.kb_chunks_id_seq from anon, authenticated;

-- hnsw.iterative_scan ตั้งใน function ไม่ได้ (Supabase: permission denied, ต้อง superuser)
-- ถ้า filter track แล้วผลขาดเมื่อ chunk เยอะ → ให้ api ตั้ง hnsw.ef_search แทน
revoke execute on function public.match_kb_chunks(extensions.vector, int, text) from public, anon, authenticated;
grant execute on function public.match_kb_chunks(extensions.vector, int, text) to service_role;

-- ingest: delete + insert in one transaction (a function call is atomic) so a failed run never leaves a half-replaced source
-- p_rows: [{page, chunk_index, text, embedding: "[0.1,...]"}]
create or replace function public.kb_replace_source_chunks(p_source_id text, p_rows jsonb)
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

  delete from public.kb_chunks where source_id = p_source_id;

  insert into public.kb_chunks (source_id, page, chunk_index, text, embedding)
  select p_source_id, r.page, r.chunk_index, r.text, r.embedding::extensions.vector(768)
  from jsonb_to_recordset(p_rows) as r(page int, chunk_index int, text text, embedding text);

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke execute on function public.kb_replace_source_chunks(text, jsonb) from public, anon, authenticated;
grant execute on function public.kb_replace_source_chunks(text, jsonb) to service_role;
