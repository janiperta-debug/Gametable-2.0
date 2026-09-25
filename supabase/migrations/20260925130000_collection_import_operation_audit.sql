-- Server-owned import operation audit. No direct client writes.
create table if not exists public.collection_import_operations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check(category in ('board_game','rpg','tcg','miniatures')),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 baseline_ids jsonb not null default '[]'::jsonb,
 new_items integer not null default 0 check(new_items >= 0),
 status text not null default 'pending' check(status in ('pending','completed','empty')),
 constraint import_operation_finished check ((status='pending' and finished_at is null) or (status<>'pending' and finished_at is not null))
);
create unique index if not exists collection_import_one_pending_per_category on public.collection_import_operations(user_id,category) where status='pending';
create index if not exists collection_import_completed_by_user on public.collection_import_operations(user_id,finished_at) where status='completed';
alter table public.collection_import_operations enable row level security;
revoke all on public.collection_import_operations from anon,authenticated;
grant select on public.collection_import_operations to authenticated;
drop policy if exists import_operations_own_read on public.collection_import_operations;
create policy import_operations_own_read on public.collection_import_operations for select to authenticated using (user_id=auth.uid());
update public.badge_definitions set requirement_type='import_operations',requirement_value=case tier when 'bronze' then 3 when 'silver' then 15 when 'gold' then 50 end,description='Successful collection import operations across four categories',xp_reward=0 where series='portal-keeper';
