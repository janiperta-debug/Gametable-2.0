-- WP-001A production verification found that the table-level UPDATE grant on
-- public.profiles overrides the column-level REVOKE UPDATE (xp, level) added in
-- 20260903195000_atomic_xp_engine.sql. Production was corrected by revoking the
-- table-level UPDATE grant and re-granting UPDATE explicitly on every existing
-- profiles column except xp and level. This migration replays that fix so the
-- migration history matches production.

REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY column_name)
    INTO cols
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name NOT IN ('xp', 'level');

  IF cols IS NOT NULL THEN
    EXECUTE format(
      'GRANT UPDATE (%s) ON TABLE public.profiles TO anon, authenticated',
      cols
    );
  END IF;
END;
$$;
