-- Display league grand prizes to signed-in viewers who may see the league.
drop policy if exists "League trophy showcase visibility" on public.personal_trophies;
create policy "League trophy showcase visibility" on public.personal_trophies for select to authenticated
using (source_type='league_season' and exists (
 select 1 from public.league_seasons s join public.leagues l on l.id=s.league_id
 where s.id=season_id and (l.privacy='public' or l.owner_id=auth.uid()
 or exists(select 1 from public.league_members lm where lm.league_id=l.id and lm.user_id=auth.uid()))
));
-- Award only the design displayed for the season; winner is organizer-confirmed.
create or replace function public.issue_league_winner_trophy(p_season_id uuid,p_recipient_id uuid,p_variant text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid;v_status text;v_name text;v_category text;v_variant text;v_id uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated';end if;
 if p_variant not in ('crystal','pennant','sculpture') then raise exception 'Invalid league trophy variant';end if;
 select l.owner_id,s.status,l.name||' · '||s.name,s.award_config->>'category',s.award_config->>'variant'
 into v_owner,v_status,v_name,v_category,v_variant
 from public.league_seasons s join public.leagues l on l.id=s.league_id where s.id=p_season_id for update of s;
 if v_owner is null or v_owner<>auth.uid() then raise exception 'Only the league organizer can award trophies';end if;
 if v_status<>'completed' then raise exception 'Complete the league season first';end if;
 if v_category is null or v_category='none' then raise exception 'League awards not enabled';end if;
 if v_variant is not null and v_variant<>p_variant then raise exception 'Award must match the displayed season trophy';end if;
 if exists(select 1 from public.personal_trophies where season_id=p_season_id) then raise exception 'This season already has a winner trophy';end if;
 if not exists(select 1 from public.league_season_events lse join public.event_matches m on m.event_id=lse.event_id and m.status='completed'
 left join public.event_entries a on a.id=m.entry_a_id left join public.event_entries b on b.id=m.entry_b_id
 where lse.season_id=p_season_id and (coalesce(a.user_id,m.player_a_id)=p_recipient_id or coalesce(b.user_id,m.player_b_id)=p_recipient_id))
 then raise exception 'Winner must have played a completed season match';end if;
 insert into public.personal_trophies(recipient_id,organizer_id,source_type,season_id,source_name,category,placement,award_variant)
 values(p_recipient_id,auth.uid(),'league_season',p_season_id,v_name,'league',1,p_variant) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.issue_league_winner_trophy(uuid,uuid,text) from public;
grant execute on function public.issue_league_winner_trophy(uuid,uuid,text) to authenticated;
