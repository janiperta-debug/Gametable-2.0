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

alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;

-- Public and discoverable private groups can be listed. Invite-only groups stay hidden
-- unless the viewer is already an active member or the creator.
drop policy if exists "Groups are discoverable" on public.groups;
create policy "Groups are discoverable"
  on public.groups for select
  to authenticated
  using (
    visibility in ('public', 'private')
    or created_by = (select auth.uid())
    or exists (
      select 1 from public.group_memberships gm
      where gm.group_id = groups.id
        and gm.user_id = (select auth.uid())
        and gm.status = 'active'
    )
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
  using (
    exists (
      select 1 from public.group_memberships gm
      where gm.group_id = groups.id
        and gm.user_id = (select auth.uid())
        and gm.status = 'active'
        and gm.role in ('founder', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.group_memberships gm
      where gm.group_id = groups.id
        and gm.user_id = (select auth.uid())
        and gm.status = 'active'
        and gm.role in ('founder', 'admin')
    )
  );

drop policy if exists "Group founders can delete groups" on public.groups;
create policy "Group founders can delete groups"
  on public.groups for delete
  to authenticated
  using (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.group_memberships gm
      where gm.group_id = groups.id
        and gm.user_id = (select auth.uid())
        and gm.status = 'active'
        and gm.role = 'founder'
    )
  );

-- Membership rows are visible to active members of the group. Public group member
-- lists are intentionally not exposed in this first migration; the UI can later add
-- a deliberate visibility control without changing the membership model.
drop policy if exists "Group members can view memberships" on public.group_memberships;
create policy "Group members can view memberships"
  on public.group_memberships for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.group_memberships viewer
      where viewer.group_id = group_memberships.group_id
        and viewer.user_id = (select auth.uid())
        and viewer.status = 'active'
    )
  );

-- A user may join an open group directly or request membership in an approval group.
-- Role is always member on self-service inserts; founder/admin roles are never self-assigned.
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

-- Users can leave themselves; admins may remove members or approve requests.
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
    exists (
      select 1 from public.group_memberships admin
      where admin.group_id = group_memberships.group_id
        and admin.user_id = (select auth.uid())
        and admin.status = 'active'
        and admin.role in ('founder', 'admin')
    )
    and role <> 'founder'
  )
  with check (
    exists (
      select 1 from public.group_memberships admin
      where admin.group_id = group_memberships.group_id
        and admin.user_id = (select auth.uid())
        and admin.status = 'active'
        and admin.role in ('founder', 'admin')
    )
    and role in ('admin', 'member')
  );

-- The creator is added as the founder in a separate insert by the trusted server action.
-- This policy only permits that exact founder row; ordinary users cannot assign roles.
drop policy if exists "Creators add their founder membership" on public.group_memberships;
create policy "Creators add their founder membership"
  on public.group_memberships for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'founder'
    and status = 'active'
    and exists (
      select 1 from public.groups g
      where g.id = group_memberships.group_id
        and g.created_by = (select auth.uid())
    )
  );
