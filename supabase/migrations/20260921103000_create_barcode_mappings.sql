-- GameTable barcode mapping
-- Maps physical product identifiers to the external game identifier used by GameTable.
-- The full external game data remains in the existing catalog/API flow.

create table if not exists public.barcode_mappings (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  barcode_type text not null
    check (barcode_type in ('ean13', 'ean8', 'upc', 'isbn10', 'isbn13', 'ean')),
  category text not null
    check (category in ('board_game', 'rpg')),
  external_game_id text not null,
  confirmed_by_user boolean not null default false,
  created_at timestamptz not null default now()
);

-- A physical barcode should resolve to one external game within a GameTable category.
create unique index if not exists barcode_mappings_barcode_category_idx
  on public.barcode_mappings (barcode, category);

create index if not exists barcode_mappings_external_game_idx
  on public.barcode_mappings (category, external_game_id);

alter table public.barcode_mappings enable row level security;

-- Barcode mappings are shared application data. Reads are safe for authenticated
-- users; writes are performed by the server-side resolver/confirmation flow.
drop policy if exists "Authenticated users can read barcode mappings"
  on public.barcode_mappings;

create policy "Authenticated users can read barcode mappings"
  on public.barcode_mappings
  for select
  to authenticated
  using (true);
