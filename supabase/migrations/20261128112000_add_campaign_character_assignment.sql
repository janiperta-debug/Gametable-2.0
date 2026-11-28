-- Allow campaign GMs to assign imported campaign characters to attending players.
alter table public.campaign_entities
  add column if not exists assigned_to_user_id uuid references public.profiles(id) on delete set null;

create index if not exists campaign_entities_assigned_player_idx
  on public.campaign_entities (event_id, assigned_to_user_id)
  where entity_type = 'character' and status = 'active';

drop policy if exists campaign_entities_campaign_read on public.campaign_entities;
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
    or (
      entity_type = 'character'
      and assigned_to_user_id = (select auth.uid())
      and exists (
        select 1 from public.event_participants p
        where p.event_id = campaign_entities.event_id
          and p.user_id = (select auth.uid())
          and p.status = 'attending'
      )
    )
  );
