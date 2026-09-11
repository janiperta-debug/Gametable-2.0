-- Marketplace <-> collection integration
-- The marketplace is a projection of user_games; it does not own collection state.

-- A collection item can only have one active marketplace listing at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_one_active_listing_per_user_game
  ON public.marketplace_listings(user_game_id)
  WHERE status = 'active' AND user_game_id IS NOT NULL;

-- Keep listing.game_id consistent with the referenced collection item and ensure
-- that the seller actually owns the listed item. Legacy rows without user_game_id
-- are retained for history and are not modified by this validation.
CREATE OR REPLACE FUNCTION public.validate_marketplace_listing()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  collection_owner uuid;
  collection_game uuid;
  collection_status text;
BEGIN
  IF NEW.user_game_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, game_id, status
    INTO collection_owner, collection_game, collection_status
  FROM public.user_games
  WHERE id = NEW.user_game_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The referenced collection item does not exist';
  END IF;

  IF collection_owner <> NEW.seller_id THEN
    RAISE EXCEPTION 'The marketplace seller must own the collection item';
  END IF;

  IF collection_game <> NEW.game_id THEN
    RAISE EXCEPTION 'Listing game_id must match user_games.game_id';
  END IF;

  IF collection_status IS NOT NULL AND collection_status <> 'owned' THEN
    RAISE EXCEPTION 'Only owned collection items can be listed';
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_marketplace_listing ON public.marketplace_listings;
CREATE TRIGGER trg_validate_marketplace_listing
  BEFORE INSERT OR UPDATE OF seller_id, user_game_id, game_id, status
  ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_marketplace_listing();

-- Keep the legacy is_active flag synchronized with the authoritative status.
CREATE OR REPLACE FUNCTION public.sync_marketplace_listing_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_marketplace_listing_activity ON public.marketplace_listings;
CREATE TRIGGER trg_sync_marketplace_listing_activity
  BEFORE INSERT OR UPDATE OF status, is_active
  ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_marketplace_listing_activity();

-- Cancel a listing without removing the collection item.
CREATE OR REPLACE FUNCTION public.cancel_marketplace_listing(p_listing_id uuid)
RETURNS public.marketplace_listings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.marketplace_listings;
BEGIN
  UPDATE public.marketplace_listings
  SET status = 'cancelled', is_active = false, updated_at = NOW()
  WHERE id = p_listing_id
    AND seller_id = auth.uid()
    AND status = 'active'
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Listing not found, not active, or not owned by current user';
  END IF;

  RETURN result;
END;
$$;

-- Complete a sale atomically: preserve the listing as history and remove the
-- sold item from the seller's collection.
CREATE OR REPLACE FUNCTION public.complete_marketplace_sale(p_listing_id uuid)
RETURNS public.marketplace_listings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.marketplace_listings;
BEGIN
  UPDATE public.marketplace_listings
  SET status = 'sold', is_active = false, updated_at = NOW()
  WHERE id = p_listing_id
    AND seller_id = auth.uid()
    AND status = 'active'
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Listing not found, not active, or not owned by current user';
  END IF;

  IF result.user_game_id IS NOT NULL THEN
    DELETE FROM public.user_games
    WHERE id = result.user_game_id
      AND user_id = auth.uid();
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_marketplace_listing(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_marketplace_sale(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_marketplace_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_marketplace_sale(uuid) TO authenticated;
