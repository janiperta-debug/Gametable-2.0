alter table public.events
  add column if not exists group_id uuid references public.groups(id) on delete set null;

create index if not exists events_group_starts_at_idx
  on public.events (group_id, starts_at)
  where group_id is not null;

comment on column public.events.group_id is
  'Optional group context for an event. Event privacy remains independently controlled by events.privacy.';
