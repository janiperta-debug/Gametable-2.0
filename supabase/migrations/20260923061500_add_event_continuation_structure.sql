create table if not exists public.event_sessions (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 title text not null, session_number integer, starts_at timestamptz, ends_at timestamptz, notes text,
 status text not null default 'planned' check (status = any(array['planned','active','completed','cancelled'])),
 config jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.event_rounds (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 round_number integer not null, title text, starts_at timestamptz,
 status text not null default 'planned' check (status = any(array['planned','active','completed','cancelled'])),
 config jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(event_id, round_number)
);
create table if not exists public.event_matches (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
 round_id uuid references public.event_rounds(id) on delete cascade,
 player_a_id uuid references auth.users(id) on delete set null, player_b_id uuid references auth.users(id) on delete set null,
 winner_id uuid references auth.users(id) on delete set null, result text, score_a numeric, score_b numeric,
 status text not null default 'scheduled' check (status = any(array['scheduled','in_progress','completed','cancelled'])),
 notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists event_sessions_event_id_idx on public.event_sessions(event_id);
create index if not exists event_rounds_event_id_idx on public.event_rounds(event_id);
create index if not exists event_matches_event_id_idx on public.event_matches(event_id);
alter table public.event_sessions enable row level security;
alter table public.event_rounds enable row level security;
alter table public.event_matches enable row level security;
create policy "Accessible event sessions" on public.event_sessions for select using (exists (select 1 from public.events e where e.id=event_id and (e.privacy='public' or e.host_id=auth.uid() or exists(select 1 from public.event_participants p where p.event_id=e.id and p.user_id=auth.uid()))));
create policy "Hosts manage event sessions" on public.event_sessions for all using (exists(select 1 from public.events e where e.id=event_id and e.host_id=auth.uid())) with check (exists(select 1 from public.events e where e.id=event_id and e.host_id=auth.uid()));
create policy "Accessible event rounds" on public.event_rounds for select using (exists (select 1 from public.events e where e.id=event_id and (e.privacy='public' or e.host_id=auth.uid() or exists(select 1 from public.event_participants p where p.event_id=e.id and p.user_id=auth.uid()))));
create policy "Hosts manage event rounds" on public.event_rounds for all using (exists(select 1 from public.events e where e.id=event_id and e.host_id=auth.uid())) with check (exists(select 1 from public.events e where e.id=event_id and e.host_id=auth.uid()));
create policy "Accessible event matches" on public.event_matches for select using (exists (select 1 from public.events e where e.id=event_id and (e.privacy='public' or e.host_id=auth.uid() or exists(select 1 from public.event_participants p where p.event_id=e.id and p.user_id=auth.uid()))));
create policy "Hosts manage event matches" on public.event_matches for all using (exists(select 1 from public.events e where e.id=event_id and e.host_id=auth.uid())) with check (exists(select 1 from public.events e where e.id=event_id and e.host_id=auth.uid()));