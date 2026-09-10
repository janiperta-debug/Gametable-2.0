-- WP-005B: enrich event invitation notifications so email delivery has the
-- event and host context required by the event invitation template.
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
      jsonb_build_object(
        'event_id', new.event_id,
        'participant_id', new.id,
        'event_name', coalesce(event_title, 'an event'),
        'host_name', host_name
      ),
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
