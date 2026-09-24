-- Permanent league membership; linked events remain independent of membership.
create table if not exists public.league_members (
 league_id uuid not null references public.leagues(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key (league_id,user_id)
);
create index if not exists league_members_user_idx on public.league_members(user_id);
alter table public.league_members enable row level security;
create or replace function public.is_league_member(p_league_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.league_members m where m.league_id=p_league_id and m.user_id=(select auth.uid()))
$$;
revoke all on function public.is_league_member(uuid) from public;
grant execute on function public.is_league_member(uuid) to authenticated;
create policy "Read accessible league members" on public.league_members for select to authenticated using (
 user_id=(select auth.uid()) or exists(select 1 from public.leagues l where l.id=league_id and (l.privacy='public' or l.owner_id=(select auth.uid())))
);
create policy "Join public leagues" on public.league_members for insert to authenticated with check (
 user_id=(select auth.uid()) and exists(select 1 from public.leagues l where l.id=league_id and l.privacy='public')
);
create policy "Owners add league members" on public.league_members for insert to authenticated with check (
 exists(select 1 from public.leagues l where l.id=league_id and l.owner_id=(select auth.uid()))
);
create policy "Leave or remove league members" on public.league_members for delete to authenticated using (
 user_id=(select auth.uid()) or exists(select 1 from public.leagues l where l.id=league_id and l.owner_id=(select auth.uid()))
);
create policy "Members read their private leagues" on public.leagues for select to authenticated using(public.is_league_member(id));
create policy "Members read their league seasons" on public.league_seasons for select to authenticated using(public.is_league_member(league_id));
create policy "Members read their season event links" on public.league_season_events for select to authenticated using(
 exists(select 1 from public.league_seasons s where s.id=league_season_events.season_id and public.is_league_member(s.league_id))
);