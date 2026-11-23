-- Restrict irreversible pre-deletion anonymization to the trusted server role.
-- The old authenticated-user callable signature is removed.
drop function if exists public.prepare_account_deletion();

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

  if exists(select 1 from public.groups where created_by = p_user_id)
     or exists(select 1 from public.events where host_id = p_user_id)
     or exists(select 1 from public.leagues where owner_id = p_user_id) then
    raise exception 'Transfer all group, event, and league responsibilities before deleting the account';
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
