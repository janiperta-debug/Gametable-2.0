-- Add game_interests column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS game_interests text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN profiles.game_interests IS 'Array of game interest categories: board_games, warhammer, miniatures, rpg';
