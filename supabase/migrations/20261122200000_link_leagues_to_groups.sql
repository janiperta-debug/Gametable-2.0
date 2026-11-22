alter table public.leagues
  add column if not exists group_id uuid references public.groups(id) on delete set null;

create index if not exists leagues_group_created_at_idx
  on public.leagues (group_id, created_at desc)
  where group_id is not null;

comment on column public.leagues.group_id is
  'Optional group context for a league. League privacy remains independently controlled by leagues.privacy.';
