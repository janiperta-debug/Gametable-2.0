-- WP-004B: Miniatures Collection ownership is independent of a future Army Builder.
-- Existing army-linked rows remain valid; new Collection ownership rows may omit army_id.
alter table public.mini_army_units
  alter column army_id drop not null;
