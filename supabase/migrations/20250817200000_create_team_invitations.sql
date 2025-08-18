-- Create team invitations table for player invitation system
-- Date: 2025-08-17

-- Create enum for invitation status
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Create team invitations table
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invited_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    position position_type,
    jersey_number INTEGER,
    message TEXT,
    status invitation_status DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_jersey_number CHECK (jersey_number > 0 AND jersey_number <= 99),
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create indexes for performance
CREATE INDEX idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_invited_email ON team_invitations(invited_email);
CREATE INDEX idx_team_invitations_invited_user_id ON team_invitations(invited_user_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
CREATE INDEX idx_team_invitations_expires_at ON team_invitations(expires_at);

-- Ensure jersey numbers are unique per team (including pending invitations)
CREATE UNIQUE INDEX idx_team_invitations_unique_jersey 
ON team_invitations(team_id, jersey_number) 
WHERE status = 'pending';

-- Prevent duplicate pending invitations for same email to same team
CREATE UNIQUE INDEX idx_team_invitations_unique_pending
ON team_invitations(team_id, invited_email)
WHERE status = 'pending';

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE team_invitations 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run expiration check periodically
CREATE OR REPLACE FUNCTION check_invitation_expiry()
RETURNS VOID AS $$
BEGIN
    UPDATE team_invitations 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to link user when they sign up with invited email
CREATE OR REPLACE FUNCTION link_user_to_invitation()
RETURNS TRIGGER AS $$
BEGIN
    -- Link any pending invitations to this user
    UPDATE team_invitations 
    SET invited_user_id = NEW.id
    WHERE invited_email = NEW.email 
    AND status = 'pending'
    AND invited_user_id IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically link users to invitations when they sign up
CREATE TRIGGER trigger_link_user_invitations
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION link_user_to_invitation();

-- Add comments for documentation
COMMENT ON TABLE team_invitations IS 'Stores invitations sent by team captains to recruit new players';
COMMENT ON COLUMN team_invitations.invited_email IS 'Email address of the person being invited';
COMMENT ON COLUMN team_invitations.invited_user_id IS 'User ID if the invited person already has an account';
COMMENT ON COLUMN team_invitations.expires_at IS 'When the invitation expires (default 7 days)';
COMMENT ON COLUMN team_invitations.jersey_number IS 'Suggested jersey number for the player';

-- Grant appropriate permissions
-- Note: In production, you would set up RLS (Row Level Security) policies here