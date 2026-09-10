-- Events repair: RSVP XP, hosting XP, Friends privacy enforcement and invitation notifications.
-- Rewards are performed through the existing atomic XP engine and keyed by event/user.

create or replace function public.user_can_access_event(
  p_event_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.events e
     where e.id = p_event_id
       and (
         e.host_id = p_user_id
         or e.privacy = 'public'
         or (
           e.privacy = 'friends'
           and exists (
             select 1
               from public.friendships f
              where f.status = 'accepted'
                and ((f.requester_id = e.host_id and f.addressee_id = p_user_id)
                  or (f.requester_id = p_user_id and f.addressee_id = e.host_id))
           )
         )
         or (
           e.privacy = 'private'
           and exists (
             select 1
               from public.event_participants ep
              where ep.event_id = e.id
                and ep.user_id = p_user_id
           )
         )
       )
  );
$$;

revoke all on function public.user_can_access_event(uuid, uuid) from public, anon, authenticated;
grant execute on function public.user_can_access_event(uuid, uuid) to authenticated;

drop policy if exists "Anon can view public events" on public.events;
drop policy if exists "Anyone can view public events" on public.events;
drop policy if exists "public events read" on public.events;
drop policy if exists "host manages event" on public.events;

create policy "Users can view accessible events"
  on public.events for select
  to authenticated
  using (public.user_can_access_event(id, auth.uid()));

create policy "Hosts can manage their events"
  on public.events for all
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists "Users can view event participants" on public.event_participants;
drop policy if exists "Users can create event participants" on public.event_participants;
drop policy if exists "Users can update event participants" on public.event_participants;
drop policy if exists "Users can delete event participants" on public.event_participants;

create policy "Users can view participants for accessible events"
  on public.event_participants for select
  to authenticated
  using (public.user_can_access_event(event_id, auth.uid()));

create policy "Users can RSVP to accessible events"
  on public.event_participants for insert
  to authenticated
  with check (
    (user_id = auth.uid() and public.user_can_access_event(event_id, auth.uid()))
    or exists (
      select 1 from public.events e
       where e.id = event_id
         and e.host_id = auth.uid()
    )
  );

create policy "Users can update their RSVP"
  on public.event_participants for update
  to authenticated
  using (
    (user_id = auth.uid() and public.user_can_access_event(event_id, auth.uid()))
    or exists (
      select 1 from public.events e
       where e.id = event_id
         and e.host_id = auth.uid()
    )
  )
  with check (
    (user_id = auth.uid() and public.user_can_access_event(event_id, auth.uid()))
    or exists (
      select 1 from public.events e
       where e.id = event_id
         and e.host_id = auth.uid()
    )
  );

create policy "Users can remove event participation"
  on public.event_participants for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.events e
       where e.id = event_id
         and e.host_id = auth.uid()
    )
  );

create or replace function public.award_event_host_xp()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.award_xp_internal(
    new.host_id,
    'event_hosted',
    75,
    new.id,
    'event_hosted:' || new.id::text
  );
  return new;
end;
$$;

drop trigger if exists trg_award_event_host_xp on public.events;
create trigger trg_award_event_host_xp
after insert on public.events
for each row execute function public.award_event_host_xp();

create or replace function public.award_event_attendance_xp()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  event_host_id uuid;
begin
  if new.status = 'attending'
     and (tg_op = 'INSERT' or old.status is distinct from 'attending') then
    select e.host_id into event_host_id
      from public.events e
     where e.id = new.event_id;

    if event_host_id is distinct from new.user_id then
      perform public.award_xp_internal(
        new.user_id,
        'event_attended',
        50,
        new.event_id,
        'event_attended:' || new.event_id::text || ':' || new.user_id::text
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_event_attendance_xp on public.event_participants;
create trigger trg_award_event_attendance_xp
after insert or update of status on public.event_participants
for each row execute function public.award_event_attendance_xp();

create or replace function public.create_event_invitation_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  event_title text;
  host_name text;
begin
  if new.status = 'invited' then
    select e.title, coalesce(p.display_name, p.username, 'Someone')
      into event_title, host_name
      from public.events e
      left join public.profiles p on p.id = e.host_id
     where e.id = new.event_id;

    insert into public.notifications (user_id, type, title, body, data, read)
    values (
      new.user_id,
      'event_invite',
      'Event Invitation',
      host_name || ' invited you to ' || coalesce(event_title, 'an event'),
      jsonb_build_object('event_id', new.event_id, 'participant_id', new.id),
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_event_invitation_notification on public.event_participants;
create trigger trg_event_invitation_notification
after insert on public.event_participants
for each row execute function public.create_event_invitation_notification();

revoke all on function public.award_event_host_xp() from public, anon, authenticated;
revoke all on function public.award_event_attendance_xp() from public, anon, authenticated;
revoke all on function public.create_event_invitation_notification() from public, anon, authenticated;
