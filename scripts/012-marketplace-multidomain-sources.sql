-- Marketplace listings can originate from board games, TCG cards or miniatures.
ALTER TABLE public.marketplace_listings
  ALTER COLUMN game_id DROP NOT NULL;

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'board_game',
  ADD COLUMN IF NOT EXISTS tcg_collection_id uuid REFERENCES public.tcg_collection(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mini_army_unit_id uuid REFERENCES public.mini_army_units(id) ON DELETE SET NULL;

ALTER TABLE public.marketplace_listings
  DROP CONSTRAINT IF EXISTS marketplace_listings_source_check;

ALTER TABLE public.marketplace_listings
  ADD CONSTRAINT marketplace_listings_source_check CHECK (
    (source_type = 'board_game' AND game_id IS NOT NULL AND tcg_collection_id IS NULL AND mini_army_unit_id IS NULL)
    OR (source_type = 'tcg' AND game_id IS NULL AND tcg_collection_id IS NOT NULL AND mini_army_unit_id IS NULL)
    OR (source_type = 'miniature' AND game_id IS NULL AND tcg_collection_id IS NULL AND mini_army_unit_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS marketplace_listings_source_type_idx ON public.marketplace_listings(source_type);
CREATE INDEX IF NOT EXISTS marketplace_listings_tcg_collection_idx ON public.marketplace_listings(tcg_collection_id);
CREATE INDEX IF NOT EXISTS marketplace_listings_mini_army_unit_idx ON public.marketplace_listings(mini_army_unit_id);

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_active_tcg_unique
  ON public.marketplace_listings(tcg_collection_id)
  WHERE status = 'active' AND tcg_collection_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_active_miniature_unique
  ON public.marketplace_listings(mini_army_unit_id)
  WHERE status = 'active' AND mini_army_unit_id IS NOT NULL;
