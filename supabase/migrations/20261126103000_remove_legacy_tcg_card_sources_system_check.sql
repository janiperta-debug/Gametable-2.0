-- Remove the obsolete constraint left behind when APITCG game systems were added.
-- The replacement tcg_card_sources_tcg_system_check already allows all supported systems.
alter table public.tcg_card_sources
  drop constraint if exists tcg_card_sources_system_check;
