-- Let active group admins approve or reject pending membership requests.
create or replace function public.review_group_membership(
  p_group_id uuid,
  p_user_id uuid,
  p_approve boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_group_admin(p_group_id, auth.uid()) then
    raise exception 'Not authorized to manage this group';
  end if;

  if p_approve then
    update public.group_memberships
      set status = 'active'
      where group_id = p_group_id
        and user_id = p_user_id
        and status = 'pending'
        and role = 'member';
    return found;
  else
    delete from public.group_memberships
      where group_id = p_group_id
        and user_id = p_user_id
        and status = 'pending'
        and role = 'member';
    return found;
  end if;
end;
$$;

revoke all on function public.review_group_membership(uuid, uuid, boolean) from public, anon;
grant execute on function public.review_group_membership(uuid, uuid, boolean) to authenticated;
