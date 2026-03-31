-- Create event_messages table for in-event chat
CREATE TABLE IF NOT EXISTS event_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Participants can read event messages (public events or participants)
CREATE POLICY "Participants can read event messages"
  ON event_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (e.privacy = 'public' OR EXISTS (
        SELECT 1 FROM event_participants ep
        WHERE ep.event_id = event_messages.event_id AND ep.user_id = auth.uid()
      ) OR e.host_id = auth.uid())
    )
  );

-- Policy: Participants and hosts can insert event messages
CREATE POLICY "Participants can insert event messages"
  ON event_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM events e
      LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.user_id = auth.uid()
      WHERE e.id = event_messages.event_id
      AND (e.host_id = auth.uid() OR ep.status = 'attending')
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_created_at ON event_messages(created_at);

-- Enable realtime for event_messages
ALTER PUBLICATION supabase_realtime ADD TABLE event_messages;
