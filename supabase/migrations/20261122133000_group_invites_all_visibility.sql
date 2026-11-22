-- Allow reusable invite links for every group visibility type.
-- A link is an explicit invitation and grants direct membership.
create or replace function public.get_group_by_invite_token(p_token uuid)
returns table (
  id uuid, name text, short_description text, description text,
  category text, game_interests text[], location text, cover_image_url text,
  member_count bigint
)
language sql stable security definer set search_path = ''
as $$
  select g.id, g.name, g.short_description, g.description, g.category,
         g.game_interests, g.location, g.cover_image_url,
         count(gm.id)::bigint
  from public.groups g
  left join public.group_memberships gm
    on gm.group_id = g.id and gm.status = 'active'
  where g.invite_token = p_token
  group by g.id;
$$;

create or replace function public.accept_group_invite(p_token uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_group_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select id into v_group_id
  from public.groups
  where invite_token = p_token;

  if v_group_id is null then
    raise exception 'Invite link is invalid or has been revoked';
  end if;

  insert into public.group_memberships (group_id, user_id, role, status)
  values (v_group_id, v_user_id, 'member', 'active')
  on conflict (group_id, user_id) do update
    set status = 'active'
    where public.group_memberships.status = 'pending';

  return v_group_id;
end;
$$;
