-- Create team_invitations table for invitation system
-- This table handles both email-based and code-based invitations

-- Create invitation status enum
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    invited_by uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    invited_email varchar(255), -- Email for email-based invitations
    invitation_code varchar(10), -- Code for shareable link invitations
    position varchar(50), -- Suggested position for the player
    jersey_number integer CHECK (jersey_number >= 1 AND jersey_number <= 99), -- Suggested jersey number
    message text, -- Custom message from captain
    status invitation_status DEFAULT 'pending',
    expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    
    -- Ensure unique email per team (for email invitations)
    CONSTRAINT unique_team_email UNIQUE (team_id, invited_email),
    -- Ensure unique invitation codes globally
    CONSTRAINT unique_invitation_code UNIQUE (invitation_code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_code ON public.team_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires ON public.team_invitations(expires_at);

-- Enable Row Level Security
ALTER TABLE public.team_invitations ENABLE row level security;

-- RLS Policies
-- Team captains can create invitations for their teams
CREATE POLICY "Team captains can create invitations" ON public.team_invitations
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE id = team_id 
            AND captain_id = auth.uid()
        )
    );

-- Users can view invitations they created or received
CREATE POLICY "Users can view their invitations" ON public.team_invitations
    FOR SELECT 
    USING (
        invited_by = auth.uid() 
        OR auth.uid()::text = ANY(
            SELECT u.id::text 
            FROM public.users u 
            WHERE u.email = team_invitations.invited_email
        )
        OR EXISTS (
            SELECT 1 FROM public.teams 
            WHERE id = team_id 
            AND captain_id = auth.uid()
        )
    );

-- Users can update invitations sent to them (accept/decline)
CREATE POLICY "Recipients can respond to invitations" ON public.team_invitations
    FOR UPDATE 
    USING (
        auth.uid()::text = ANY(
            SELECT u.id::text 
            FROM public.users u 
            WHERE u.email = team_invitations.invited_email
        )
    )
    WITH CHECK (
        status IN ('accepted', 'declined')
    );

-- Team captains can update their own invitations (e.g., cancel)
CREATE POLICY "Team captains can update their invitations" ON public.team_invitations
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE id = team_id 
            AND captain_id = auth.uid()
        )
    );

-- Enable realtime for live invitation updates
ALTER publication supabase_realtime ADD table public.team_invitations;

-- Add helpful comments
COMMENT ON TABLE public.team_invitations IS 'Stores team invitations for both email-based and code-based invitation systems';
COMMENT ON COLUMN public.team_invitations.invited_email IS 'Email address for email-based invitations (nullable for code-based invitations)';
COMMENT ON COLUMN public.team_invitations.invitation_code IS 'Short code for shareable link invitations (nullable for email-based invitations)';
COMMENT ON COLUMN public.team_invitations.jersey_number IS 'Suggested jersey number for the invited player';