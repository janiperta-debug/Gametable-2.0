-- Fix RLS policies for events table to allow public events to be viewed by anyone

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Anyone can view public events" ON events;
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;

-- Create policy that allows:
-- 1. Anyone to view public events
-- 2. Authenticated users to view friends-only events (for now, treat as public)
-- 3. Host and participants to view private events
CREATE POLICY "Anyone can view public events"
  ON events FOR SELECT
  USING (
    privacy = 'public' 
    OR privacy = 'friends'
    OR host_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM event_participants ep 
      WHERE ep.event_id = events.id AND ep.user_id = auth.uid()
    )
  );

-- Ensure the policy exists for anon users too (for public events)
-- This uses a separate simpler policy for unauthenticated users
DROP POLICY IF EXISTS "Anon can view public events" ON events;
CREATE POLICY "Anon can view public events"
  ON events FOR SELECT
  TO anon
  USING (privacy = 'public');
