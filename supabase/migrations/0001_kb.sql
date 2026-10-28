-- Knowledge base: เอกสารอ้างอิงแม่หลังคลอด (open license เท่านั้น) สำหรับ RAG พร้อม citation source_id + page
-- เข้าถึงผ่าน apps/api ด้วย service role เท่านั้น (ADR-0004) → เปิด RLS ไม่มี policy

create extension if not exists vector with schema extensions;

create table public.kb_sources (
  id text primary key,
  apa text not null,
  type text not null,
  evidence_level text,
  track text not null check (track in ('intl', 'thai_trad')),
  license text not null,
  url text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.kb_chunks (
  id bigint generated always as identity primary key,
  source_id text not null references public.kb_sources (id) on delete cascade,
  page int not null check (page > 0),
  chunk_index int not null default 0,
  text text not null,
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now(),
  unique (source_id, page, chunk_index)
);

create index kb_chunks_embedding_idx on public.kb_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.kb_sources enable row level security;
alter table public.kb_chunks enable row level security;

create function public.match_kb_chunks(
  query_embedding extensions.vector(768),
  k int default 5,
  filter_track text default null
)
returns table (id bigint, source_id text, page int, text text, similarity float)
language sql stable
set search_path = ''
as $$
  select c.id, c.source_id, c.page, c.text,
         1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.kb_chunks c
  join public.kb_sources s on s.id = c.source_id
  where filter_track is null or s.track = filter_track
  order by c.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(k, 1), 20);
$$;

revoke execute on function public.match_kb_chunks from public, anon, authenticated;
