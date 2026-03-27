-- Add event_digest_prefs column to profiles for weekly event digest settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS event_digest_prefs jsonb DEFAULT '{"enabled":false,"frequency":"weekly","categories":[],"max_distance_km":null}'::jsonb;

-- Add email fields if they don't exist (for email preferences)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_email text;
