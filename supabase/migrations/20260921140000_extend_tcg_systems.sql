alter table public.tcg_cards
  drop constraint if exists tcg_cards_tcg_system_check;

alter table public.tcg_cards
  add constraint tcg_cards_tcg_system_check
  check (tcg_system = any (array[
    'mtg'::text,
    'pokemon'::text,
    'yugioh'::text,
    'lorcana'::text,
    'fab'::text,
    'onepiece'::text
  ]));
