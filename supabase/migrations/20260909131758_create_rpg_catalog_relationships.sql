create table public.rpg_catalog (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id integer not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rpg_catalog_source_source_id_key unique (source, source_id),
  constraint rpg_catalog_source_id_positive check (source_id > 0),
  constraint rpg_catalog_source_not_empty check (btrim(source) <> ''),
  constraint rpg_catalog_name_not_empty check (btrim(name) <> '')
);

create table public.rpg_catalog_items (
  rpg_id uuid not null references public.rpg_catalog(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint rpg_catalog_items_pkey primary key (rpg_id, game_id)
);

create index rpg_catalog_items_game_id_idx
  on public.rpg_catalog_items (game_id);

alter table public.rpg_catalog enable row level security;
alter table public.rpg_catalog_items enable row level security;

create policy "Anyone can view RPG catalog"
  on public.rpg_catalog
  for select
  to public
  using (true);

create policy "Anyone can view RPG catalog items"
  on public.rpg_catalog_items
  for select
  to public
  using (true);
