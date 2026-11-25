alter table public.tcg_cards drop constraint if exists tcg_cards_tcg_system_check;
alter table public.tcg_cards add constraint tcg_cards_tcg_system_check check (tcg_system = any (array[
'mtg','pokemon','yugioh','lorcana','fab','onepiece','riftbound','digimon','gundam','star-wars-unlimited','dragon-ball-fusion-world'
]::text[]));

alter table public.tcg_card_sources drop constraint if exists tcg_card_sources_tcg_system_check;
alter table public.tcg_card_sources add constraint tcg_card_sources_tcg_system_check check (tcg_system = any (array[
'mtg','pokemon','yugioh','lorcana','fab','onepiece','riftbound','digimon','gundam','star-wars-unlimited','dragon-ball-fusion-world'
]::text[]));
