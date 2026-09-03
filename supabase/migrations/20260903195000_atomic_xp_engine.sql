ALTER TABLE public.xp_events
  ADD COLUMN IF NOT EXISTS event_key text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS xp_events_user_event_key_idx
  ON public.xp_events (user_id, event_key)
  WHERE event_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.collection_import_rewards (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  xp_event_id uuid NULL REFERENCES public.xp_events(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, category)
);

CREATE OR REPLACE FUNCTION public.award_xp_internal(
  p_target_user uuid,
  p_reason text,
  p_amount integer,
  p_reference_id uuid DEFAULT NULL,
  p_event_key text DEFAULT NULL
)
RETURNS TABLE (applied boolean, event_id uuid, new_xp integer, new_level integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  inserted_event public.xp_events;
  profile_row public.profiles;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'XP amount must be positive';
  END IF;

  IF p_event_key IS NULL OR length(trim(p_event_key)) = 0 THEN
    RAISE EXCEPTION 'event_key is required';
  END IF;

  INSERT INTO public.xp_events (user_id, amount, reason, reference_id, event_key)
  VALUES (p_target_user, p_amount, p_reason, p_reference_id, p_event_key)
  ON CONFLICT (user_id, event_key) WHERE event_key IS NOT NULL
  DO NOTHING
  RETURNING * INTO inserted_event;

  IF inserted_event.id IS NULL THEN
    SELECT p.xp, p.level
      INTO profile_row.xp, profile_row.level
      FROM public.profiles AS p
     WHERE p.id = p_target_user
     FOR UPDATE;
    RETURN QUERY SELECT false, NULL::uuid, profile_row.xp, profile_row.level;
    RETURN;
  END IF;

  UPDATE public.profiles AS p
     SET xp = p.xp + p_amount,
         level = floor((p.xp + p_amount)::numeric / 100)::integer + 1
   WHERE p.id = p_target_user
   RETURNING p.xp, p.level INTO profile_row.xp, profile_row.level;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN QUERY SELECT true, inserted_event.id, profile_row.xp, profile_row.level;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_xp(
  p_reason text,
  p_amount integer,
  p_reference_id uuid DEFAULT NULL,
  p_event_key text DEFAULT NULL
)
RETURNS TABLE (applied boolean, event_id uuid, new_xp integer, new_level integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM public.award_xp_internal(
    auth.uid(), p_reason, p_amount, p_reference_id, p_event_key
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.award_xp_trusted(
  p_target_user uuid,
  p_reason text,
  p_amount integer,
  p_reference_id uuid DEFAULT NULL,
  p_event_key text DEFAULT NULL
)
RETURNS TABLE (applied boolean, event_id uuid, new_xp integer, new_level integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.award_xp_internal(
    p_target_user, p_reason, p_amount, p_reference_id, p_event_key
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.award_category_import_xp(
  p_category text
)
RETURNS TABLE (applied boolean, event_id uuid, new_xp integer, new_level integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  reward_inserted boolean;
  result_row record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.collection_import_rewards (user_id, category)
  VALUES (auth.uid(), p_category)
  ON CONFLICT (user_id, category) DO NOTHING;
  reward_inserted := FOUND;

  SELECT * INTO result_row
    FROM public.award_xp_internal(
      auth.uid(), 'category_import', 200, NULL,
      'import:' || p_category
    );

  IF NOT reward_inserted THEN
    result_row.applied := false;
  END IF;

  UPDATE public.collection_import_rewards
     SET xp_event_id = result_row.event_id
   WHERE user_id = auth.uid()
     AND category = p_category
     AND xp_event_id IS NULL
     AND result_row.event_id IS NOT NULL;

  RETURN QUERY SELECT result_row.applied, result_row.event_id,
                      result_row.new_xp, result_row.new_level;
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp_internal(uuid, text, integer, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_xp_trusted(uuid, text, integer, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(text, integer, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_category_import_xp(text) TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.xp_events FROM PUBLIC, anon, authenticated;
