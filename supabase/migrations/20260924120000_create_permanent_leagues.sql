-- Permanent leagues own seasons; seasons reference existing events without duplicating them.
create table if not exists public.leagues (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 name text not null check (length(trim(name)) between 2 and 120),
 game text, description text, privacy text not null default 'public' check (privacy in ('public','private')),
 created_at timestamptz not null default now()
);
create table if not exists public.league_seasons (
 id uuid primary key default gen_random_uuid(),
 league_id uuid not null references public.leagues(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 120),
 starts_on date, ends_on date,
 placement_points jsonb not null default '[10,7,5,3,1]'::jsonb,
 created_at timestamptz not null default now(),
 constraint season_date_order check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create table if not exists public.league_season_events (
 season_id uuid not null references public.league_seasons(id) on delete cascade,
 event_id uuid not null unique references public.events(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (season_id,event_id)
);
create index if not exists league_seasons_league_idx on public.league_seasons(league_id);
create index if not exists league_season_events_season_idx on public.league_season_events(season_id);
alter table public.leagues enable row level security;
alter table public.league_seasons enable row level security;
alter table public.league_season_events enable row level security;
create policy "Read accessible leagues" on public.leagues for select using (privacy='public' or owner_id=(select auth.uid()));
create policy "Owners create leagues" on public.leagues for insert with check (owner_id=(select auth.uid()));
create policy "Owners update leagues" on public.leagues for update using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "Owners delete leagues" on public.leagues for delete using (owner_id=(select auth.uid()));
create policy "Read accessible seasons" on public.league_seasons for select using (exists(select 1 from public.leagues l where l.id=league_id and (l.privacy='public' or l.owner_id=(select auth.uid()))));
create policy "Owners create seasons" on public.league_seasons for insert with check (exists(select 1 from public.leagues l where l.id=league_id and l.owner_id=(select auth.uid())));
create policy "Owners update seasons" on public.league_seasons for update using (exists(select 1 from public.leagues l where l.id=league_id and l.owner_id=(select auth.uid())));
create policy "Owners delete seasons" on public.league_seasons for delete using (exists(select 1 from public.leagues l where l.id=league_id and l.owner_id=(select auth.uid())));
create policy "Read accessible season events" on public.league_season_events for select using (exists(select 1 from public.league_seasons s join public.leagues l on l.id=s.league_id where s.id=season_id and (l.privacy='public' or l.owner_id=(select auth.uid()))));
create policy "Owners attach season events" on public.league_season_events for insert with check (exists(select 1 from public.league_seasons s join public.leagues l on l.id=s.league_id join public.events e on e.id=event_id where s.id=season_id and l.owner_id=(select auth.uid()) and e.host_id=(select auth.uid()) and e.event_type in ('tournament','game_night')));
create policy "Owners detach season events" on public.league_season_events for delete using (exists(select 1 from public.league_seasons s join public.leagues l on l.id=s.league_id where s.id=season_id and l.owner_id=(select auth.uid())));
