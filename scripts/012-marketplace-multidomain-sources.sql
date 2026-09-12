-- Marketplace multi-domain source support
-- Keeps the existing board-game user_games flow while allowing listings
-- to reference ownership rows from TCG and Miniatures collections.

ALTER TABLE public.marketplace_listings
  ALTER COLUMN game_id DROP NOT NULL;

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'board_game'
    CHECK (source_type IN ('board_game', 'tcg', 'miniature')),
  ADD COLUMN IF NOT EXISTS tcg_collection_id UUID
    REFERENCES public.tcg_collection(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mini_army_unit_id UUID
    REFERENCES public.mini_army_units(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_source_type
  ON public.marketplace_listings(source_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_tcg_collection
  ON public.marketplace_listings(tcg_collection_id)
  WHERE tcg_collection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_mini_army_unit
  ON public.marketplace_listings(mini_army_unit_id)
  WHERE mini_army_unit_id IS NOT NULL;

-- A listing must point to exactly one ownership source.
ALTER TABLE public.marketplace_listings
  DROP CONSTRAINT IF EXISTS marketplace_listing_exactly_one_source;
ALTER TABLE public.marketplace_listings
  ADD CONSTRAINT marketplace_listing_exactly_one_source CHECK (
    (source_type = 'board_game' AND user_game_id IS NOT NULL AND tcg_collection_id IS NULL AND mini_army_unit_id IS NULL)
    OR
    (source_type = 'tcg' AND user_game_id IS NULL AND tcg_collection_id IS NOT NULL AND mini_army_unit_id IS NULL)
    OR
    (source_type = 'miniature' AND user_game_id IS NULL AND tcg_collection_id IS NULL AND mini_army_unit_id IS NOT NULL)
  );

-- Prevent multiple active listings for the same ownership row in each domain.
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_one_active_tcg_listing
  ON public.marketplace_listings(tcg_collection_id)
  WHERE status = 'active' AND tcg_collection_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_one_active_miniature_listing
  ON public.marketplace_listings(mini_army_unit_id)
  WHERE status = 'active' AND mini_army_unit_id IS NOT NULL;
