-- Campaign world knowledge: GM-managed entities, relationships and import provenance.
create table public.campaign_entities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  entity_type text not null check (entity_type in ('character','person','location','faction','quest','item','creature','history','rule','other')),
  name text not null check (length(btrim(name)) between 1 and 180),
  summary text not null default '',
  details jsonb not null default '{}'::jsonb,
  visibility text not null default 'gm_only' check (visibility in ('gm_only','players')),
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index campaign_entities_active_name_uidx
  on public.campaign_entities (event_id, entity_type, lower(btrim(name)))
  where status = 'active';
create index campaign_entities_event_type_idx
  on public.campaign_entities (event_id, entity_type, status);

create table public.campaign_entity_sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  entity_id uuid not null references public.campaign_entities(id) on delete cascade,
  import_item_id uuid not null unique references public.campaign_import_items(id) on delete restrict,
  source_id uuid references public.campaign_import_sources(id) on delete set null,
  source_reference jsonb not null default '{}'::jsonb,
  quote text,
  created_at timestamptz not null default now()
);
create index campaign_entity_sources_entity_idx
  on public.campaign_entity_sources (entity_id);

create table public.campaign_entity_relations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  source_entity_id uuid not null references public.campaign_entities(id) on delete cascade,
  target_entity_id uuid not null references public.campaign_entities(id) on delete cascade,
  relation_type text not null check (length(btrim(relation_type)) between 1 and 80),
  description text not null default '',
  visibility text not null default 'gm_only' check (visibility in ('gm_only','players')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint campaign_entity_relations_not_self check (source_entity_id <> target_entity_id),
  constraint campaign_entity_relations_unique unique (event_id, source_entity_id, target_entity_id, relation_type)
);
create index campaign_entity_relations_source_idx
  on public.campaign_entity_relations (source_entity_id);
create index campaign_entity_relations_target_idx
  on public.campaign_entity_relations (target_entity_id);

create or replace function public.validate_campaign_entity_links()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if tg_table_name = 'campaign_entity_sources' then
    if not exists (
      select 1 from public.campaign_entities e
      join public.campaign_import_items i on i.id = new.import_item_id
      where e.id = new.entity_id
        and e.event_id = new.event_id
        and i.event_id = new.event_id
        and (new.source_id is null or exists (
          select 1 from public.campaign_import_sources s
          where s.id = new.source_id and s.event_id = new.event_id
        ))
    ) then
      raise exception 'Campaign entity provenance links must belong to the same campaign';
    end if;
  elsif tg_table_name = 'campaign_entity_relations' then
    if not exists (
      select 1 from public.campaign_entities e
      where e.id = new.source_entity_id and e.event_id = new.event_id
    ) or not exists (
      select 1 from public.campaign_entities e
      where e.id = new.target_entity_id and e.event_id = new.event_id
    ) then
      raise exception 'Campaign entity relationships must stay within one campaign';
    end if;
  end if;
  return new;
end;
$function$;

create trigger trg_validate_campaign_entity_sources
before insert or update of event_id, entity_id, import_item_id, source_id
on public.campaign_entity_sources
for each row execute function public.validate_campaign_entity_links();

create trigger trg_validate_campaign_entity_relations
before insert or update of event_id, source_entity_id, target_entity_id
on public.campaign_entity_relations
for each row execute function public.validate_campaign_entity_links();

alter table public.campaign_entities enable row level security;
alter table public.campaign_entity_sources enable row level security;
alter table public.campaign_entity_relations enable row level security;

revoke all on public.campaign_entities from anon, authenticated;
revoke all on public.campaign_entity_sources from anon, authenticated;
revoke all on public.campaign_entity_relations from anon, authenticated;
grant select on public.campaign_entities to authenticated;
grant select on public.campaign_entity_sources to authenticated;
grant select on public.campaign_entity_relations to authenticated;

create policy campaign_entities_campaign_read
  on public.campaign_entities
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.event_type = 'campaign' and e.host_id = (select auth.uid())
    )
    or (
      visibility = 'players'
      and exists (
        select 1 from public.event_participants p
        where p.event_id = campaign_entities.event_id
          and p.user_id = (select auth.uid())
          and p.status = 'attending'
      )
    )
  );

create policy campaign_entity_relations_campaign_read
  on public.campaign_entity_relations
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.event_type = 'campaign' and e.host_id = (select auth.uid())
    )
    or (
      visibility = 'players'
      and exists (
        select 1 from public.event_participants p
        where p.event_id = campaign_entity_relations.event_id
          and p.user_id = (select auth.uid())
          and p.status = 'attending'
      )
    )
  );

create policy campaign_entity_sources_gm_read
  on public.campaign_entity_sources
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.event_type = 'campaign' and e.host_id = (select auth.uid())
    )
  );
