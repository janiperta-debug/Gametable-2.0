-- Shared, resumable collection import foundation.
-- Category-specific catalogue resolution and ownership writes are handled by server-side adapters.

create table if not exists public.collection_import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('board_game', 'rpg', 'tcg', 'miniatures')),
  input_type text not null check (input_type in ('text', 'image', 'file', 'screenshot')),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'review', 'committing', 'completed', 'partial', 'failed', 'cancelled')),
  source_text text,
  source_storage_path text,
  source_metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint collection_import_batch_source_check
    check (
      (input_type = 'text' and source_text is not null)
      or
      (input_type <> 'text' and (source_text is not null or source_storage_path is not null))
    )
);

create index if not exists collection_import_batches_user_recent_idx
  on public.collection_import_batches (user_id, created_at desc);
create index if not exists collection_import_batches_status_idx
  on public.collection_import_batches (status)
  where status in ('uploaded', 'processing', 'review', 'committing');

create table if not exists public.collection_import_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.collection_import_batches(id) on delete cascade,
  row_index integer not null check (row_index >= 0),
  raw_text text not null default '',
  parsed_data jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'needs_review', 'unmatched', 'accepted', 'rejected', 'imported', 'failed')),
  selected_candidate_id uuid,
  resolved_catalog_id text,
  review_reason text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, row_index)
);

create index if not exists collection_import_items_batch_idx
  on public.collection_import_items (batch_id, row_index);
create index if not exists collection_import_items_status_idx
  on public.collection_import_items (batch_id, status);

create table if not exists public.collection_import_candidates (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.collection_import_items(id) on delete cascade,
  catalog_id text not null,
  catalog_source text not null,
  match_score numeric(5,4) check (match_score is null or (match_score >= 0 and match_score <= 1)),
  match_reasons jsonb not null default '[]'::jsonb,
  candidate_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (item_id, catalog_source, catalog_id)
);

create index if not exists collection_import_candidates_item_idx
  on public.collection_import_candidates (item_id);

alter table public.collection_import_items
  add constraint collection_import_items_selected_candidate_fk
  foreign key (selected_candidate_id)
  references public.collection_import_candidates(id)
  on delete set null;

-- A committed import item is recorded in the same database transaction as its
-- category-specific ownership write. A unique item_id prevents replay.
create table if not exists public.collection_import_commits (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.collection_import_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('tcg', 'miniatures')),
  ownership_record_id uuid,
  result_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists collection_import_commits_user_idx
  on public.collection_import_commits (user_id, created_at desc);

-- Import records are readable by their owner. All writes are server-side only.
alter table public.collection_import_batches enable row level security;
alter table public.collection_import_items enable row level security;
alter table public.collection_import_candidates enable row level security;
alter table public.collection_import_commits enable row level security;

revoke all on public.collection_import_batches from anon, authenticated;
revoke all on public.collection_import_items from anon, authenticated;
revoke all on public.collection_import_candidates from anon, authenticated;
revoke all on public.collection_import_commits from anon, authenticated;

grant select on public.collection_import_batches to authenticated;
grant select on public.collection_import_items to authenticated;
grant select on public.collection_import_candidates to authenticated;
grant select on public.collection_import_commits to authenticated;

drop policy if exists collection_import_batches_own_read on public.collection_import_batches;
create policy collection_import_batches_own_read
  on public.collection_import_batches
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists collection_import_items_own_read on public.collection_import_items;
create policy collection_import_items_own_read
  on public.collection_import_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.collection_import_batches b
      where b.id = batch_id and b.user_id = (select auth.uid())
    )
  );

drop policy if exists collection_import_candidates_own_read on public.collection_import_candidates;
create policy collection_import_candidates_own_read
  on public.collection_import_candidates
  for select to authenticated
  using (
    exists (
      select 1
      from public.collection_import_items i
      join public.collection_import_batches b on b.id = i.batch_id
      where i.id = item_id and b.user_id = (select auth.uid())
    )
  );

drop policy if exists collection_import_commits_own_read on public.collection_import_commits;
create policy collection_import_commits_own_read
  on public.collection_import_commits
  for select to authenticated
  using (user_id = (select auth.uid()));
