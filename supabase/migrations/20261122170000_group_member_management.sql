-- Founder-controlled role changes and admin/member removal.
create or replace function public.manage_group_member(
  p_group_id uuid,
  p_user_id uuid,
  p_action text,
  p_role text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_target_role text;
  v_target_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select role into v_actor_role
  from public.group_memberships
  where group_id = p_group_id
    and user_id = (select auth.uid())
    and status = 'active';

  if v_actor_role not in ('founder', 'admin') then
    raise exception 'Not authorized to manage this group';
  end if;

  select role, status into v_target_role, v_target_status
  from public.group_memberships
  where group_id = p_group_id and user_id = p_user_id;

  if v_target_role is null or v_target_status <> 'active' then
    return false;
  end if;

  if v_target_role = 'founder' then
    raise exception 'Founder membership cannot be changed';
  end if;

  if p_action = 'remove' then
    if v_actor_role <> 'founder' and v_target_role <> 'member' then
      raise exception 'Only the founder can remove an administrator';
    end if;
    delete from public.group_memberships
    where group_id = p_group_id and user_id = p_user_id and role <> 'founder';
    return found;
  elsif p_action = 'set_role' then
    if v_actor_role <> 'founder' then
      raise exception 'Only the founder can change administrator roles';
    end if;
    if p_role not in ('admin', 'member') then
      raise exception 'Invalid group role';
    end if;
    update public.group_memberships
    set role = p_role
    where group_id = p_group_id and user_id = p_user_id and role <> 'founder';
    return found;
  else
    raise exception 'Invalid action';
  end if;
end;
$$;

revoke all on function public.manage_group_member(uuid, uuid, text, text) from public, anon;
grant execute on function public.manage_group_member(uuid, uuid, text, text) to authenticated;
