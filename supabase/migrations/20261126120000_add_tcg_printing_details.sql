alter table public.tcg_cards
  add column if not exists collector_number text,
  add column if not exists language text;
