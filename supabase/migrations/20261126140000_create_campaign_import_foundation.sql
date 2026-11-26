-- Campaign workspace foundation: campaign roles and staged, review-only imports.
-- Campaign content is intentionally not written to final character/world tables here.

-- Event RSVP remains the source of campaign membership. This nullable role is
-- only meaningful for campaign events; the event host remains the GM by definition.
alter table public.event_participants
  add column if not exists campaign_role text
  check (campaign_role is null or campaign_role in ('player', 'observer'));

-- Each import batch belongs to one campaign and can contain multiple source files.
create table if not exists public.campaign_import_batches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'review', 'completed', 'partial', 'failed', 'cancelled')),
  source_count integer not null default 0 check (source_count >= 0),
  item_count integer not null default 0 check (item_count >= 0),
  ai_model text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- A batch may only be created for an actual campaign, never for a regular event.
create or replace function public.validate_campaign_import_batch_event()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if not (exists (
    select 1 from public.events e
    where e.id = new.event_id and e.event_type = 'campaign'
  )) then
    raise exception 'Campaign imports can only be attached to campaign events';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_validate_campaign_import_batch_event on public.campaign_import_batches;
create trigger trg_validate_campaign_import_batch_event
before insert or update of event_id
on public.campaign_import_batches
for each row execute function public.validate_campaign_import_batch_event();

create index if not exists campaign_import_batches_event_recent_idx
  on public.campaign_import_batches (event_id, created_at desc);
create index if not exists campaign_import_batches_status_idx
  on public.campaign_import_batches (status)
  where status in ('uploaded', 'processing', 'review');

-- Source records preserve original files and allow extracted items to point back
-- to a specific document/page/region. Files live in a dedicated private bucket.
create table if not exists public.campaign_import_sources (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.campaign_import_batches(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  source_kind text not null
    check (source_kind in ('pdf', 'document', 'image', 'text', 'other')),
  file_name text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  storage_path text,
  source_text text,
  checksum text,
  page_count integer check (page_count is null or page_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint campaign_import_sources_has_content
    check (storage_path is not null or source_text is not null)
);

-- Source records must point to a batch belonging to the same campaign.
create or replace function public.validate_campaign_import_source_links()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if not (exists (
    select 1 from public.campaign_import_batches b
    where b.id = new.batch_id and b.event_id = new.event_id
  )) then
    raise exception 'Campaign import source batch does not belong to this campaign';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_validate_campaign_import_source_links on public.campaign_import_sources;
create trigger trg_validate_campaign_import_source_links
before insert or update of batch_id, event_id
on public.campaign_import_sources
for each row execute function public.validate_campaign_import_source_links();

create index if not exists campaign_import_sources_batch_idx
  on public.campaign_import_sources (batch_id, created_at);
create unique index if not exists campaign_import_sources_storage_path_uidx
  on public.campaign_import_sources (storage_path)
  where storage_path is not null;

-- AI output is a proposal only. Accepted items will be committed to proper
-- campaign-domain tables in a later phase; JSONB keeps drafts flexible meanwhile.
create table if not exists public.campaign_import_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.campaign_import_batches(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  source_id uuid references public.campaign_import_sources(id) on delete set null,
  item_index integer not null check (item_index >= 0),
  entity_type text not null
    check (entity_type in ('character', 'person', 'location', 'faction', 'quest', 'item', 'creature', 'history', 'rule', 'other')),
  name text,
  raw_text text not null default '',
  parsed_data jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  source_reference jsonb not null default '{}'::jsonb,
  proposed_relationships jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'needs_review', 'accepted', 'rejected', 'imported', 'failed')),
  review_reason text,
  error_message text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, item_index)
);

create index if not exists campaign_import_items_batch_idx
  on public.campaign_import_items (batch_id, item_index);
create index if not exists campaign_import_items_event_type_idx
  on public.campaign_import_items (event_id, entity_type, status);
create index if not exists campaign_import_items_source_idx
  on public.campaign_import_items (source_id)
  where source_id is not null;

-- Keep event_id, batch_id and source_id relationships within the same campaign.
create or replace function public.validate_campaign_import_item_links()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if not (exists (
    select 1 from public.campaign_import_batches b
    where b.id = new.batch_id and b.event_id = new.event_id
  )) then
    raise exception 'Campaign import item batch does not belong to this campaign';
  end if;

  if new.source_id is not null and not (exists (
    select 1 from public.campaign_import_sources s
    where s.id = new.source_id
      and s.batch_id = new.batch_id
      and s.event_id = new.event_id
  )) then
    raise exception 'Campaign import item source does not belong to this batch';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_campaign_import_item_links on public.campaign_import_items;
create trigger trg_validate_campaign_import_item_links
before insert or update of batch_id, event_id, source_id
on public.campaign_import_items
for each row execute function public.validate_campaign_import_item_links();

-- Import records are host/GM-readable for now. Writes will go through validated
-- server actions; players do not receive access to raw source material or drafts.
alter table public.campaign_import_batches enable row level security;
alter table public.campaign_import_sources enable row level security;
alter table public.campaign_import_items enable row level security;

revoke all on public.campaign_import_batches from anon, authenticated;
revoke all on public.campaign_import_sources from anon, authenticated;
revoke all on public.campaign_import_items from anon, authenticated;

grant select on public.campaign_import_batches to authenticated;
grant select on public.campaign_import_sources to authenticated;
grant select on public.campaign_import_items to authenticated;

create policy campaign_import_batches_gm_read
  on public.campaign_import_batches
  for select to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id and e.event_type = 'campaign' and e.host_id = (select auth.uid())
  ));

create policy campaign_import_sources_gm_read
  on public.campaign_import_sources
  for select to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id and e.event_type = 'campaign' and e.host_id = (select auth.uid())
  ));

create policy campaign_import_items_gm_read
  on public.campaign_import_items
  for select to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id and e.event_type = 'campaign' and e.host_id = (select auth.uid())
  ));

-- Private source storage supports PDFs, office documents, text and common images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-import-sources',
  'campaign-import-sources',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Campaign GMs upload their own campaign sources"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'campaign-import-sources'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.event_type = 'campaign'
      and e.host_id = (select auth.uid())
  )
);

create policy "Campaign GMs read their campaign sources"
on storage.objects for select to authenticated
using (
  bucket_id = 'campaign-import-sources'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.event_type = 'campaign'
      and e.host_id = (select auth.uid())
  )
);

create policy "Campaign GMs delete their campaign sources"
on storage.objects for delete to authenticated
using (
  bucket_id = 'campaign-import-sources'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.event_type = 'campaign'
      and e.host_id = (select auth.uid())
  )
);
