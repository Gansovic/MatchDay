-- Create team_league_requests table for teams requesting to join leagues
-- This table tracks team requests to join leagues, with approval workflow

-- Create enum for request status
CREATE TYPE team_league_request_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');

-- Create the team_league_requests table
CREATE TABLE team_league_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status team_league_request_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Constraints
    CONSTRAINT unique_team_league_request UNIQUE(team_id, league_id),
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create indexes for performance
CREATE INDEX idx_team_league_requests_team_id ON team_league_requests(team_id);
CREATE INDEX idx_team_league_requests_league_id ON team_league_requests(league_id);
CREATE INDEX idx_team_league_requests_status ON team_league_requests(status);
CREATE INDEX idx_team_league_requests_requested_by ON team_league_requests(requested_by);
CREATE INDEX idx_team_league_requests_reviewed_by ON team_league_requests(reviewed_by);
CREATE INDEX idx_team_league_requests_created_at ON team_league_requests(created_at);

-- Row Level Security (RLS)
ALTER TABLE team_league_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own team's requests
CREATE POLICY "Users can view their team's league requests" ON team_league_requests
    FOR SELECT
    USING (
        requested_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_league_requests.team_id 
            AND teams.captain_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = team_league_requests.team_id 
            AND team_members.user_id = auth.uid()
        )
    );

-- Policy: League admins can view requests for their leagues
CREATE POLICY "League admins can view requests for their leagues" ON team_league_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = team_league_requests.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- Policy: Team captains can create requests for their teams
CREATE POLICY "Team captains can create league requests" ON team_league_requests
    FOR INSERT
    WITH CHECK (
        requested_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_league_requests.team_id 
            AND teams.captain_id = auth.uid()
        )
    );

-- Policy: League admins can update request status
CREATE POLICY "League admins can update request status" ON team_league_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = team_league_requests.league_id 
            AND leagues.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM leagues 
            WHERE leagues.id = team_league_requests.league_id 
            AND leagues.created_by = auth.uid()
        )
    );

-- Policy: Team captains can withdraw their own requests
CREATE POLICY "Team captains can withdraw their requests" ON team_league_requests
    FOR UPDATE
    USING (
        requested_by = auth.uid() AND
        status = 'pending' AND
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_league_requests.team_id 
            AND teams.captain_id = auth.uid()
        )
    )
    WITH CHECK (
        status = 'withdrawn'
    );

-- Function to automatically update team's league_id when request is approved
CREATE OR REPLACE FUNCTION handle_team_league_request_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- If request is being approved, update the team's league_id
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE teams 
        SET league_id = NEW.league_id
        WHERE id = NEW.team_id;
        
        -- Set reviewed_at timestamp
        NEW.reviewed_at = NOW();
    END IF;
    
    -- If request is being rejected or withdrawn, ensure team is not in the league
    IF NEW.status IN ('rejected', 'withdrawn') AND OLD.status = 'approved' THEN
        UPDATE teams 
        SET league_id = NULL
        WHERE id = NEW.team_id AND league_id = NEW.league_id;
        
        -- Set reviewed_at timestamp for rejections
        IF NEW.status = 'rejected' THEN
            NEW.reviewed_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for team league request approval
CREATE TRIGGER trigger_team_league_request_approval
    BEFORE UPDATE ON team_league_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_team_league_request_approval();

-- Sample data will be added later when teams exist in the database