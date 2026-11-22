-- Group chat messages: separate storage, same interaction model as event chat.
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists group_messages_group_created_idx
  on public.group_messages (group_id, created_at);

alter table public.group_messages enable row level security;

revoke all on public.group_messages from public, anon;grant select, insert on public.group_messages to authenticated;

drop policy if exists "Active group members can read group messages" on public.group_messages;
create policy "Active group members can read group messages"
  on public.group_messages for select
  to authenticated
  using (private.is_group_member(group_id, (select auth.uid())));

drop policy if exists "Active group members can send group messages" on public.group_messages;
create policy "Active group members can send group messages"
  on public.group_messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_group_member(group_id, (select auth.uid()))
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'group_messages'
  ) then
    alter publication supabase_realtime add table public.group_messages;
  end if;
end $$;
