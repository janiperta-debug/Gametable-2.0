-- Add preferred_theme column to profiles for theme persistence
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_theme TEXT DEFAULT 'manor' CHECK (preferred_theme IN ('manor', 'forest', 'ocean', 'desert', 'night'));
