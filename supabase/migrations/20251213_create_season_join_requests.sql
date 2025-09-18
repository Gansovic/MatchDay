-- Create season_join_requests table for teams requesting to join seasons
CREATE TABLE IF NOT EXISTS season_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    responded_by UUID REFERENCES users(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    response_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_season_team_request UNIQUE(season_id, team_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_season_join_requests_season_id ON season_join_requests(season_id);
CREATE INDEX IF NOT EXISTS idx_season_join_requests_team_id ON season_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_season_join_requests_user_id ON season_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_season_join_requests_status ON season_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_season_join_requests_created_at ON season_join_requests(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS season_join_requests_updated_at ON season_join_requests;
CREATE TRIGGER season_join_requests_updated_at
    BEFORE UPDATE ON season_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE season_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own requests
CREATE POLICY "Users can view their own join requests" ON season_join_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view requests for their teams (if they are captain)
CREATE POLICY "Team captains can view requests for their teams" ON season_join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE id = team_id
            AND captain_id = auth.uid()
        )
    );

-- League admins can view all requests for seasons in their leagues
CREATE POLICY "League admins can view season requests" ON season_join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM seasons s
            JOIN leagues l ON s.league_id = l.id
            WHERE s.id = season_id
            AND l.admin_user_id = auth.uid()
        )
    );

-- Users can create join requests for teams they captain
CREATE POLICY "Users can create join requests for their teams" ON season_join_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM teams
            WHERE id = team_id
            AND captain_id = auth.uid()
        )
    );

-- Users can withdraw their own pending requests
CREATE POLICY "Users can withdraw their own requests" ON season_join_requests
    FOR UPDATE USING (
        auth.uid() = user_id
        AND status = 'pending'
    )
    WITH CHECK (
        status = 'withdrawn'
    );

-- League admins can respond to requests
CREATE POLICY "League admins can respond to requests" ON season_join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM seasons s
            JOIN leagues l ON s.league_id = l.id
            WHERE s.id = season_id
            AND l.admin_user_id = auth.uid()
        )
    );

-- Function to automatically add team to season when request is approved
CREATE OR REPLACE FUNCTION handle_season_join_request_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- If the request was just approved
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        -- Add team to season
        INSERT INTO season_teams (season_id, team_id, status, registration_date)
        VALUES (NEW.season_id, NEW.team_id, 'registered', NOW())
        ON CONFLICT (season_id, team_id) DO UPDATE
        SET status = 'registered',
            updated_at = NOW();

        -- responded_by and responded_at are set by the application
        -- NEW.responded_by should be set by the application before this trigger
        NEW.responded_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS handle_season_join_request_approval_trigger ON season_join_requests;
CREATE TRIGGER handle_season_join_request_approval_trigger
    BEFORE UPDATE ON season_join_requests
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
    EXECUTE FUNCTION handle_season_join_request_approval();

-- Add real-time support
ALTER PUBLICATION supabase_realtime ADD TABLE season_join_requests;

-- Add comments for documentation
COMMENT ON TABLE season_join_requests IS 'Join requests from teams wanting to join specific seasons';
COMMENT ON COLUMN season_join_requests.season_id IS 'The season the team wants to join';
COMMENT ON COLUMN season_join_requests.team_id IS 'The team requesting to join';
COMMENT ON COLUMN season_join_requests.user_id IS 'The user (team captain) who made the request';
COMMENT ON COLUMN season_join_requests.message IS 'Optional message from the team captain';
COMMENT ON COLUMN season_join_requests.status IS 'Current status of the request';
COMMENT ON COLUMN season_join_requests.responded_by IS 'Admin who responded to the request';
COMMENT ON COLUMN season_join_requests.responded_at IS 'When the request was responded to';
COMMENT ON COLUMN season_join_requests.response_message IS 'Optional message from the admin';