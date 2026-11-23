-- Account deletion foundations: ownership transfer and retained community history.
-- This migration is intentionally source-controlled only; production is not modified here.

-- Retained chat history must not be deleted with its author.
alter table public.group_messages alter column sender_id drop not null;
alter table public.event_messages alter column sender_id drop not null;

alter table public.group_messages
  drop constraint if exists group_messages_sender_id_fkey;
alter table public.group_messages
  add constraint group_messages_sender_id_fkey
  foreign key (sender_id) references public.profiles(id) on delete set null;

alter table public.event_messages
  drop constraint if exists event_messages_sender_id_fkey;
alter table public.event_messages
  add constraint event_messages_sender_id_fkey
  foreign key (sender_id) references public.profiles(id) on delete set null;

-- Keep hosted events from being cascade-deleted if an account is removed.
-- Ownership must be transferred before the host profile can disappear.
alter table public.events
  drop constraint if exists events_host_id_fkey;
alter table public.events
  add constraint events_host_id_fkey
  foreign key (host_id) references public.profiles(id) on delete restrict;

-- Historical awards remain valid even when the organizer leaves.
alter table public.personal_trophies alter column organizer_id drop not null;
alter table public.personal_trophies
  drop constraint if exists personal_trophies_organizer_id_fkey;
alter table public.personal_trophies
  add constraint personal_trophies_organizer_id_fkey
  foreign key (organizer_id) references public.profiles(id) on delete set null;

-- A group ownership change is allowed only inside the dedicated SECURITY DEFINER RPC.
create or replace function private.guard_group_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by
     and coalesce(current_setting('app.group_owner_transfer', true), '') <> 'on' then
    raise exception 'Group creator can only be changed by the ownership transfer operation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.guard_group_metadata() from public, anon, authenticated;

-- Return the community entities that must be transferred before deletion.
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
      from public.events e where e.host_id = v_user
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

-- Expose only the current user's Storage ownership through a narrowly scoped RPC.
-- This avoids depending on the internal storage schema being exposed through PostgREST.
create or replace function public.get_owned_storage_objects()
returns table(bucket_id text, name text)
language plpgsql
security definer
set search_path = ''
as $$1declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  return query
    select o.bucket_id, o.name
    from storage.objects o
    where o.owner_id = v_user::text;
end;
$;
revoke all on function public.get_owned_storage_objects() from public, anon;
grant execute on function public.get_owned_storage_objects() to authenticated;



-- Service-role-only verification that a retained cover has no user owner.
create or replace function public.get_storage_object_owner(p_bucket_id text, p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$1begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required';
  end if;
  return (select o.owner_id from storage.objects o
    where o.bucket_id = p_bucket_id and o.name = p_name);
end;
$;
revoke all on function public.get_storage_object_owner(text, text) from public, anon, authenticated;
grant execute on function public.get_storage_object_owner(text, text) to service_role;

-- One atomic transfer operation for groups, events, and permanent leagues.
create or replace function public.transfer_account_responsibility(
  p_kind text,
  p_entity_id uuid,
  p_target_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_target_exists boolean;
begin
  if v_actor is null then raise exception 'Authentication required'; end if;
  if p_target_user_id is null or p_target_user_id = v_actor then
    raise exception 'Choose another existing GameTable user';
  end if;

  select exists(select 1 from public.profiles where id = p_target_user_id)
    into v_target_exists;
  if not v_target_exists then raise exception 'Transfer recipient does not exist'; end if;

  if p_kind = 'group' then
    perform 1 from public.groups where id = p_entity_id and created_by = v_actor for update;
    if not found then raise exception 'Only the group founder can transfer ownership'; end if;

    perform 1 from public.group_memberships
      where group_id = p_entity_id and user_id = p_target_user_id
        and status = 'active' for update;
    if not found then raise exception 'The new founder must be an active group member'; end if;

    -- Release the unique founder slot before promoting the recipient.
    update public.group_memberships
      set role = 'admin'
      where group_id = p_entity_id and user_id = v_actor and role = 'founder';
    update public.group_memberships
      set role = 'founder'
      where group_id = p_entity_id and user_id = p_target_user_id and status = 'active';

    perform set_config('app.group_owner_transfer', 'on', true);
    update public.groups set created_by = p_target_user_id where id = p_entity_id;
    perform set_config('app.group_owner_transfer', '', true);
    return true;

  elsif p_kind = 'event' then
    update public.events set host_id = p_target_user_id
      where id = p_entity_id and host_id = v_actor;
    if not found then raise exception 'Only the event host can transfer this event'; end if;
    return true;

  elsif p_kind = 'league' then
    update public.leagues set owner_id = p_target_user_id
      where id = p_entity_id and owner_id = v_actor;
    if not found then raise exception 'Only the league owner can transfer this league'; end if;
    return true;
  end if;

  raise exception 'Unsupported responsibility type';
end;
$$;
revoke all on function public.transfer_account_responsibility(text, uuid, uuid) from public, anon;
grant execute on function public.transfer_account_responsibility(text, uuid, uuid) to authenticated;

-- Clear historical attribution before the Auth user is removed. Personal trophies
-- received by the departing user and other personal data follow their existing cascades.
create or replace function public.prepare_account_deletion()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  if exists(select 1 from public.groups where created_by = v_user)
     or exists(select 1 from public.events where host_id = v_user)
     or exists(select 1 from public.leagues where owner_id = v_user) then
    raise exception 'Transfer all group, event, and league responsibilities before deleting the account';
  end if;

  update public.group_messages set sender_id = null where sender_id = v_user;
  update public.event_messages set sender_id = null where sender_id = v_user;
  update public.personal_trophies set organizer_id = null where organizer_id = v_user;
  update public.play_results set user_id = null where user_id = v_user;
  update public.rule_disputes set logged_by = null where logged_by = v_user;
  -- Miniature collection entries are personal inventory, including entries not
  -- attached to an army; do not leave orphaned user-owned rows behind.
  delete from public.mini_army_units where user_id = v_user;

  return true;
end;
$$;
revoke all on function public.prepare_account_deletion() from public, anon;
grant execute on function public.prepare_account_deletion() to authenticated;
