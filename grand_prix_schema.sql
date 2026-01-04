-- 1. Anti-Cheat Table: Tracks in-progress game state
CREATE TABLE IF NOT EXISTS game_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_game_id BIGINT REFERENCES daily_games(id) ON DELETE CASCADE,
    guesses JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, daily_game_id)
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_game_progress_updated_at
    BEFORE UPDATE ON game_progress
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own progress"
    ON game_progress
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Leaderboard View: Weekly Aggregation
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT 
    us.user_id,
    -- Format Name: "Jeff Stansberry" -> "Jeff S."
    CASE 
        WHEN position(' ' in p.full_name) > 0 
        THEN split_part(p.full_name, ' ', 1) || ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.' 
        ELSE COALESCE(p.full_name, p.username, 'Anonymous')
    END as username,
    p.avatar_url,
    SUM(us.score) as total_score,
    COUNT(us.daily_game_id) as games_played,
    MAX(us.completed_at) as last_played_at
FROM user_scores us
JOIN profiles p ON us.user_id = p.id
WHERE 
    -- Filter for current week (Week starts Monday)
    date_trunc('week', us.completed_at) = date_trunc('week', CURRENT_DATE)
GROUP BY us.user_id, p.full_name, p.username, p.avatar_url
ORDER BY total_score DESC;
