-- Historical events remain in the archive, but no longer require a new host
-- solely because the original organizer is deleting their account.
alter table public.events alter column host_id drop not null;

create or replace function public.get_account_deletion_responsibilities()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select jsonb_build_object(
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name))
      from public.groups g where g.created_by = v_user
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.title, 'starts_at', e.starts_at))
      from public.events e
      where e.host_id = v_user
        and (
          e.starts_at >= now()
          or (e.starts_at < now() and e.ends_at is not null and e.ends_at > now())
        )
    ), '[]'::jsonb),
    'leagues', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name))
      from public.leagues l where l.owner_id = v_user
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.get_account_deletion_responsibilities() from public, anon;
grant execute on function public.get_account_deletion_responsibilities() to authenticated;

create or replace function public.prepare_account_deletion(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required';
  end if;
  if p_user_id is null then
    raise exception 'User id is required';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User profile does not exist';
  end if;

  -- Anonymize organizer attribution for events that have already ended.
  -- Future and currently active events must still be explicitly transferred.
  update public.events
     set host_id = null
   where host_id = p_user_id
     and starts_at < now()
     and (ends_at is null or ends_at <= now());

  if exists(select 1 from public.groups where created_by = p_user_id)
     or exists(
       select 1 from public.events
       where host_id = p_user_id
         and (
           starts_at >= now()
           or (starts_at < now() and ends_at is not null and ends_at > now())
         )
     )
     or exists(select 1 from public.leagues where owner_id = p_user_id) then
    raise exception 'Transfer all group, upcoming/active event, and league responsibilities before deleting the account';
  end if;

  update public.group_messages set sender_id = null where sender_id = p_user_id;
  update public.event_messages set sender_id = null where sender_id = p_user_id;
  update public.personal_trophies set organizer_id = null where organizer_id = p_user_id;
  update public.play_results set user_id = null where user_id = p_user_id;
  update public.rule_disputes set logged_by = null where logged_by = p_user_id;
  delete from public.mini_army_units where user_id = p_user_id;

  return true;
end;
$$;
revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
