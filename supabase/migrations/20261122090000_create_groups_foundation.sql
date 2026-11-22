-- GameTable groups: foundational entity and membership model.
-- Groups are community actors, not user accounts. Existing profiles remain the only user identities.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 2 and 100),
  short_description text not null check (char_length(btrim(short_description)) between 1 and 180),
  description text,
  category text not null check (category in ('board_game', 'miniature', 'rpg', 'trading_card', 'other')),
  game_interests text[] not null default '{}',
  location text,
  visibility text not null default 'public'
    check (visibility in ('public', 'private', 'invite_only')),
  join_policy text not null default 'open'
    check (join_policy in ('open', 'approval', 'invite_only')),
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_visibility_join_policy_check check (
    (visibility = 'invite_only' and join_policy = 'invite_only')
    or (visibility in ('public', 'private') and join_policy in ('open', 'approval'))
  )
);

create index if not exists groups_discovery_idx
  on public.groups (visibility, category, created_at desc);
create index if not exists groups_created_by_idx
  on public.groups (created_by);

create table if not exists public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('founder', 'admin', 'member')),
  status text not null default 'active'
    check (status in ('active', 'pending')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists group_memberships_user_idx
  on public.group_memberships (user_id, status);
create index if not exists group_memberships_group_idx
  on public.group_memberships (group_id, status);
create unique index if not exists group_memberships_one_founder_idx
  on public.group_memberships (group_id)
  where role = 'founder';

-- RLS helper functions live outside the exposed public schema. They only answer
-- membership/role questions for the current authenticated user.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id = (select auth.uid())
    and exists (
      select 1 from public.group_memberships gm
      where gm.group_id = p_group_id
        and gm.user_id = p_user_id
        and gm.status = 'active'
    );
$$;

create or replace function private.is_group_admin(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id = (select auth.uid())
    and exists (
      select 1 from public.group_memberships gm
      where gm.group_id = p_group_id
        and gm.user_id = p_user_id
        and gm.status = 'active'
        and gm.role in ('founder', 'admin')
    );
$$;

create or replace function private.is_group_founder(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id = (select auth.uid())
    and exists (
      select 1 from public.group_memberships gm
      where gm.group_id = p_group_id
        and gm.user_id = p_user_id
        and gm.status = 'active'
        and gm.role = 'founder'
    );
$$;

revoke all on function private.is_group_member(uuid, uuid) from public, anon;
revoke all on function private.is_group_admin(uuid, uuid) from public, anon;
revoke all on function private.is_group_founder(uuid, uuid) from public, anon;
grant execute on function private.is_group_member(uuid, uuid) to authenticated;
grant execute on function private.is_group_admin(uuid, uuid) to authenticated;
grant execute on function private.is_group_founder(uuid, uuid) to authenticated;

-- Return aggregate membership counts without exposing individual membership rows.
create or replace function public.get_group_member_counts(p_group_ids uuid[])
returns table (group_id uuid, member_count bigint)
language sql
stable
security definer
set search_path = ''
as $
  select g.id, count(gm.id)::bigint
  from public.groups g
  left join public.group_memberships gm
    on gm.group_id = g.id and gm.status = 'active'
  where g.id = any(p_group_ids)
    and (select auth.uid()) is not null
    and (
      g.visibility in ('public', 'private')
      or private.is_group_member(g.id, (select auth.uid()))
      or g.created_by = (select auth.uid())
    )
  group by g.id;
$;

revoke all on function public.get_group_member_counts(uuid[]) from public, anon;
grant execute on function public.get_group_member_counts(uuid[]) to authenticated;

-- Membership identity must never be reassigned by an administrator.
create or replace function private.guard_group_membership_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
begin
  if new.group_id is distinct from old.group_id
     or new.user_id is distinct from old.user_id then
    raise exception 'Group membership identity cannot be changed';
  end if;
  return new;
end;
$;

revoke all on function private.guard_group_membership_identity() from public, anon, authenticated;
drop trigger if exists group_memberships_guard_identity on public.group_memberships;
create trigger group_memberships_guard_identity
before update on public.group_memberships
for each row execute function private.guard_group_membership_identity();

-- Keep ownership immutable and maintain updated_at on every group edit.
create or replace function private.guard_group_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'Group creator cannot be changed';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.guard_group_metadata() from public, anon, authenticated;

drop trigger if exists groups_guard_metadata on public.groups;
create trigger groups_guard_metadata
before update on public.groups
for each row execute function private.guard_group_metadata();

-- Create the founder membership in the same transaction as the group itself.
create or replace function private.create_group_founder_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_memberships (group_id, user_id, role, status)
  values (new.id, new.created_by, 'founder', 'active');
  return new;
end;
$$;

revoke all on function private.create_group_founder_membership() from public, anon, authenticated;

drop trigger if exists groups_create_founder_membership on public.groups;
create trigger groups_create_founder_membership
after insert on public.groups
for each row execute function private.create_group_founder_membership();

grant select, insert, update, delete on public.groups, public.group_memberships to authenticated;

alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;

drop policy if exists "Groups are discoverable" on public.groups;
create policy "Groups are discoverable"
  on public.groups for select
  to authenticated
  using (
    visibility in ('public', 'private')
    or created_by = (select auth.uid())
    or private.is_group_member(id, (select auth.uid()))
  );

drop policy if exists "Authenticated users can create groups" on public.groups;
create policy "Authenticated users can create groups"
  on public.groups for insert
  to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "Group admins can update groups" on public.groups;
create policy "Group admins can update groups"
  on public.groups for update
  to authenticated
  using (private.is_group_admin(id, (select auth.uid())))
  with check (private.is_group_admin(id, (select auth.uid())));

drop policy if exists "Group founders can delete groups" on public.groups;
create policy "Group founders can delete groups"
  on public.groups for delete
  to authenticated
  using (
    created_by = (select auth.uid())
    and private.is_group_founder(id, (select auth.uid()))
  );

drop policy if exists "Group members can view memberships" on public.group_memberships;
create policy "Group members can view memberships"
  on public.group_memberships for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_group_member(group_id, (select auth.uid()))
  );

-- Self-service: direct join for open public groups, or a pending request for
-- approval-based public/private groups. Users cannot assign themselves a role.
drop policy if exists "Users can join or request group membership" on public.group_memberships;
create policy "Users can join or request group membership"
  on public.group_memberships for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'member'
    and exists (
      select 1 from public.groups g
      where g.id = group_memberships.group_id
        and (
          (g.visibility = 'public' and g.join_policy = 'open' and group_memberships.status = 'active')
          or (g.visibility in ('public', 'private') and g.join_policy = 'approval' and group_memberships.status = 'pending')
        )
    )
  );

drop policy if exists "Users can leave groups" on public.group_memberships;
create policy "Users can leave groups"
  on public.group_memberships for delete
  to authenticated
  using (user_id = (select auth.uid()) and role <> 'founder');

drop policy if exists "Group admins manage memberships" on public.group_memberships;
create policy "Group admins manage memberships"
  on public.group_memberships for update
  to authenticated
  using (
    private.is_group_admin(group_id, (select auth.uid()))
    and role <> 'founder'
  )
  with check (
    private.is_group_admin(group_id, (select auth.uid()))
    and role in ('admin', 'member')
    and status in ('active', 'pending')
  );
