-- Create match_events table for recording match events (goals, cards, substitutions, etc.)
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'penalty')),
    event_time INTEGER, -- Minute of the match
    description TEXT,
    assist_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_team_id ON match_events(team_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player_id ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_match_events_event_type ON match_events(event_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_match_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_events_updated_at
    BEFORE UPDATE ON match_events
    FOR EACH ROW
    EXECUTE FUNCTION update_match_events_updated_at();

-- Add comment
COMMENT ON TABLE match_events IS 'Records events that occur during matches (goals, cards, substitutions, etc.)';
