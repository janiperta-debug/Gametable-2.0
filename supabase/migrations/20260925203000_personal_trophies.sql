-- Live migration applied on 2026-09-25. Keep schema and award authorization in source control.
create table if not exists public.personal_trophies (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 organizer_id uuid not null references public.profiles(id),
 source_type text not null check (source_type in ('tournament','league_season')),
 event_id uuid references public.events(id) on delete set null,
 season_id uuid references public.league_seasons(id) on delete set null,
 source_name text not null,
 category text not null check (category in ('board-games','role-playing-games','miniatures','trading-card-games')),
 placement integer not null check (placement between 1 and 3),
 awarded_at timestamptz not null default now(),
 constraint trophy_source_check check ((source_type='tournament' and event_id is not null and season_id is null) or (source_type='league_season' and season_id is not null and event_id is null))
);
create unique index if not exists personal_trophies_event_place on public.personal_trophies(event_id,placement) where event_id is not null;
create unique index if not exists personal_trophies_season_place on public.personal_trophies(season_id,placement) where season_id is not null;
create index if not exists personal_trophies_recipient on public.personal_trophies(recipient_id,awarded_at desc);
alter table public.personal_trophies enable row level security;
drop policy if exists "Users can see own personal trophies" on public.personal_trophies;
create policy "Users can see own personal trophies" on public.personal_trophies for select to authenticated using (recipient_id=auth.uid());
drop policy if exists "Organizers can see trophies they awarded" on public.personal_trophies;
create policy "Organizers can see trophies they awarded" on public.personal_trophies for select to authenticated using (organizer_id=auth.uid());
create or replace function public.issue_personal_trophies(p_source_type text,p_source_id uuid,p_recipients uuid[])
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_category text; v_name text; v_owner uuid; v_status text; v_existing integer; v_index integer; v_count integer; v_champion uuid;
begin
 if v_user is null then raise exception 'Not authenticated'; end if;
 if p_source_type='tournament' then
  select host_id,status,title,event_config->'awards'->>'category' into v_owner,v_status,v_name,v_category from public.events where id=p_source_id and event_type='tournament' for update;
 elsif p_source_type='league_season' then
  select l.owner_id,s.status,l.name||' · '||s.name,s.award_config->>'category' into v_owner,v_status,v_name,v_category from public.league_seasons s join public.leagues l on l.id=s.league_id where s.id=p_source_id for update of s;
 else raise exception 'Invalid trophy source'; end if;
 if v_owner is null or v_owner<>v_user then raise exception 'Only the organizer can award trophies'; end if;
 if v_status<>'completed' then raise exception 'Complete the event or season first'; end if;
 if v_category not in ('board-games','role-playing-games','miniatures','trading-card-games') then raise exception 'No trophy series selected'; end if;
 v_count:=coalesce(array_length(p_recipients,1),0);
 if v_count<1 or v_count>3 then raise exception 'Select between one and three recipients'; end if;
 if (select count(distinct x) from unnest(p_recipients) x)<>v_count then raise exception 'Each recipient must be unique'; end if;
 if p_source_type='tournament' then
  select ee.user_id into v_champion from public.events e join public.event_entries ee on ee.id=(e.event_config->>'champion_entry_id')::uuid where e.id=p_source_id;
  if p_recipients[1] is distinct from v_champion then raise exception 'First place must match the confirmed champion'; end if;
  if exists(select 1 from unnest(p_recipients) r where not exists(select 1 from public.event_entries ee where ee.event_id=p_source_id and ee.user_id=r and ee.status='active')) then raise exception 'All recipients must be registered competitors'; end if;
 else
  if exists(select 1 from unnest(p_recipients) r where not exists(
   select 1 from public.league_season_events lse join public.event_matches m on m.event_id=lse.event_id and m.status='completed'
   left join public.event_entries a on a.id=m.entry_a_id left join public.event_entries b on b.id=m.entry_b_id
   where lse.season_id=p_source_id and (coalesce(a.user_id,m.player_a_id)=r or coalesce(b.user_id,m.player_b_id)=r)
  )) then raise exception 'Recipients must have played a completed season match'; end if;
 end if;
 select count(*) into v_existing from public.personal_trophies where (p_source_type='tournament' and event_id=p_source_id) or (p_source_type='league_season' and season_id=p_source_id);
 if v_existing>0 then raise exception 'Trophies have already been awarded for this event or season'; end if;
 for v_index in 1..v_count loop
  insert into public.personal_trophies(recipient_id,organizer_id,source_type,event_id,season_id,source_name,category,placement)
  values(p_recipients[v_index],v_user,p_source_type,case when p_source_type='tournament' then p_source_id end,case when p_source_type='league_season' then p_source_id end,v_name,v_category,v_index);
 end loop;
 return v_count;
end $$;
revoke all on function public.issue_personal_trophies(text,uuid,uuid[]) from public;
grant execute on function public.issue_personal_trophies(text,uuid,uuid[]) to authenticated;
