-- Add preferred_theme column to profiles for active Manor theme persistence.
-- The persisted value is a room_id from lib/room-themes.ts (for example: main-hall).
-- Unlocking a room does not automatically change this value.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_theme TEXT DEFAULT 'main-hall';

-- Normalize the legacy default if this migration was already applied with the
-- former generic theme values. Existing user selections are preserved here;
-- runtime validation falls back safely when a value is not a current room_id.
ALTER TABLE public.profiles
ALTER COLUMN preferred_theme SET DEFAULT 'main-hall';
