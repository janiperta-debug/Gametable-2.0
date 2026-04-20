-- Drop existing policies if they exist (safe to run)
DROP POLICY IF EXISTS "Anyone can view active listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Users can create own listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Users can update own listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON marketplace_listings;

-- Create marketplace_listings table if not exists
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_game_id UUID REFERENCES user_games(id) ON DELETE SET NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sell', 'trade', 'give')),
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  price DECIMAL(10, 2),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_game ON marketplace_listings(game_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created ON marketplace_listings(created_at DESC);

-- Enable RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view active listings or their own
CREATE POLICY "Anyone can view active listings" ON marketplace_listings
  FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid());

-- Users can create their own listings
CREATE POLICY "Users can create own listings" ON marketplace_listings
  FOR INSERT
  WITH CHECK (seller_id = auth.uid());

-- Users can update their own listings
CREATE POLICY "Users can update own listings" ON marketplace_listings
  FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings" ON marketplace_listings
  FOR DELETE
  USING (seller_id = auth.uid());
