create table if not exists public.event_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text,
  entry_type text not null default 'player',
  status text not null default 'active' check (status = any(array['active','withdrawn'])),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create index if not exists event_entries_event_id_idx on public.event_entries(event_id);
create index if not exists event_entries_user_id_idx on public.event_entries(user_id);

alter table public.event_entries enable row level security;

create policy "Accessible event entries" on public.event_entries for select using (
  exists (
    select 1 from public.events e
    where e.id = event_id
      and (
        e.privacy = 'public'
        or e.host_id = auth.uid()
        or exists (
          select 1 from public.event_participants p
          where p.event_id = e.id and p.user_id = auth.uid()
        )
      )
  )
);

create policy "Hosts manage event entries" on public.event_entries for all using (
  exists (select 1 from public.events e where e.id = event_id and e.host_id = auth.uid())
) with check (
  exists (select 1 from public.events e where e.id = event_id and e.host_id = auth.uid())
);

alter table public.event_matches add column if not exists entry_a_id uuid references public.event_entries(id) on delete set null;
alter table public.event_matches add column if not exists entry_b_id uuid references public.event_entries(id) on delete set null;
alter table public.event_matches add column if not exists winner_entry_id uuid references public.event_entries(id) on delete set null;

create index if not exists event_matches_entry_a_id_idx on public.event_matches(entry_a_id);
create index if not exists event_matches_entry_b_id_idx on public.event_matches(entry_b_id);
