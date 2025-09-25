-- Migration: Create Team Join Requests Table
-- Date: 2025-09-08
-- Description: Create table for team join requests to enable admin approval workflow

-- Create team_join_requests table
CREATE TABLE IF NOT EXISTS team_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team_id ON team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_league_id ON team_join_requests(league_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON team_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_requested_by ON team_join_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_created_at ON team_join_requests(created_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_team_join_requests_league_status ON team_join_requests(league_id, status);

-- Add unique constraint to prevent duplicate requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_join_requests_unique_pending 
    ON team_join_requests(team_id, league_id) 
    WHERE status IN ('pending', 'approved');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_team_join_requests_updated_at 
    BEFORE UPDATE ON team_join_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies (assuming RLS is enabled)
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see requests for their teams or leagues they manage
CREATE POLICY "Users can view relevant join requests" ON team_join_requests
    FOR SELECT USING (
        requested_by = auth.uid() OR
        team_id IN (
            SELECT t.id FROM teams t 
            JOIN team_members tm ON t.id = tm.team_id 
            WHERE tm.user_id = auth.uid() AND tm.is_active = true
        ) OR
        league_id IN (
            SELECT id FROM leagues WHERE created_by = auth.uid()
        )
    );

-- Policy: Team members can create requests for their teams
CREATE POLICY "Team members can create join requests" ON team_join_requests
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT t.id FROM teams t 
            JOIN team_members tm ON t.id = tm.team_id 
            WHERE tm.user_id = auth.uid() AND tm.is_active = true
        )
    );

-- Policy: League owners and requesters can update requests
CREATE POLICY "Relevant users can update join requests" ON team_join_requests
    FOR UPDATE USING (
        requested_by = auth.uid() OR
        league_id IN (
            SELECT id FROM leagues WHERE created_by = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE team_join_requests IS 'Join requests from teams to leagues requiring admin approval';
COMMENT ON COLUMN team_join_requests.id IS 'Primary key';
COMMENT ON COLUMN team_join_requests.team_id IS 'Team requesting to join';
COMMENT ON COLUMN team_join_requests.league_id IS 'League being requested to join';
COMMENT ON COLUMN team_join_requests.requested_by IS 'User who made the request';
COMMENT ON COLUMN team_join_requests.message IS 'Optional message from the requester';
COMMENT ON COLUMN team_join_requests.status IS 'Current status of the request';
COMMENT ON COLUMN team_join_requests.reviewed_by IS 'Admin who reviewed the request';
COMMENT ON COLUMN team_join_requests.reviewed_at IS 'When the request was reviewed';
COMMENT ON COLUMN team_join_requests.review_message IS 'Message from the reviewer';
COMMENT ON COLUMN team_join_requests.expires_at IS 'When the request expires if not reviewed';