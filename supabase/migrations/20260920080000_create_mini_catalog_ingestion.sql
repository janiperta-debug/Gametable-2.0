create table if not exists public.mini_catalog_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  system_code text not null,
  publisher text not null,
  source_type text not null check (source_type in ('html', 'pdf', 'json', 'manual')),
  source_url text not null,
  active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mini_catalog_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.mini_catalog_sources(id) on delete cascade,
  status text not null check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  discovered_count integer not null default 0,
  accepted_count integer not null default 0,
  rejected_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.mini_catalog_candidates (
  id uuid primary key default gen_random_uuid(),
  ingestion_run_id uuid not null references public.mini_catalog_ingestion_runs(id) on delete cascade,
  source_id uuid not null references public.mini_catalog_sources(id) on delete cascade,
  external_id text,
  system_code text not null,
  system_name text not null,
  edition text,
  group_name text,
  name text not null,
  item_type text not null check (item_type in ('unit', 'character', 'team', 'product')),
  product_code text,
  product_name text,
  source_name text not null,
  source_url text not null,
  source_payload jsonb not null default '{}'::jsonb,
  normalized_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'unchanged')),
  existing_unit_id uuid references public.mini_units(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mini_catalog_candidates_run_idx
  on public.mini_catalog_candidates (ingestion_run_id);

create index if not exists mini_catalog_candidates_system_idx
  on public.mini_catalog_candidates (system_code);

create index if not exists mini_catalog_candidates_status_idx
  on public.mini_catalog_candidates (status);

create unique index if not exists mini_catalog_candidates_source_key_idx
  on public.mini_catalog_candidates (source_id, normalized_key);

alter table public.mini_catalog_sources enable row level security;
alter table public.mini_catalog_ingestion_runs enable row level security;
alter table public.mini_catalog_candidates enable row level security;

insert into public.mini_catalog_sources
  (code, name, system_code, publisher, source_type, source_url)
values
  (
    'blood-bowl-warhammer-community',
    'Blood Bowl — Warhammer Community',
    'blood_bowl',
    'Games Workshop',
    'pdf',
    'https://www.warhammer-community.com/en-gb/downloads/blood-bowl/'
  ),
  (
    'marvel-crisis-protocol-atomic-mass-games',
    'Marvel: Crisis Protocol — Atomic Mass Games',
    'marvel_crisis_protocol',
    'Atomic Mass Games',
    'html',
    'https://www.atomicmassgames.com/assembly/'
  )
on conflict (code) do update set
  name = excluded.name,
  system_code = excluded.system_code,
  publisher = excluded.publisher,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  updated_at = now();
