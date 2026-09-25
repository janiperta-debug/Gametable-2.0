-- Applied to GameTable Supabase on 2026-09-25.
-- Keep this script as a reproducible schema record for other environments.
create table if not exists public.marketplace_store_interest (
  user_id uuid primary key references auth.users(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.marketplace_store_interest enable row level security;
grant select, insert, update, delete on public.marketplace_store_interest to authenticated;
create policy "Users can read their own store interest" on public.marketplace_store_interest for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can submit their own store interest" on public.marketplace_store_interest for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own store interest" on public.marketplace_store_interest for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can withdraw their own store interest" on public.marketplace_store_interest for delete to authenticated using ((select auth.uid()) = user_id);

-- Admin-only SQL Editor query (do not expose aggregate data to the client):
-- select count(*) filter (where vote = 1) as interested,
--        count(*) filter (where vote = -1) as not_interested,
--        count(*) as total from public.marketplace_store_interest;
