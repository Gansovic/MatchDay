import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreateInvitationParams {
  teamId: string;
  position?: string;
  jerseyNumber?: number;
  message?: string;
}

interface InvitationData {
  id: string;
  code: string;
  expiresAt: string;
  teamName: string;
  shareMessage: string;
}

interface InvitationDetails {
  id: string;
  team: {
    id: string;
    name: string;
    teamColor: string | null;
  };
  invitedBy: {
    id: string;
    name: string;
  };
  position: string | null;
  jerseyNumber: number | null;
  message: string | null;
  expiresAt: string;
  status: string;
  isExpired: boolean;
}

export const useTeamInvitation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvitation = useCallback(
    async (params: CreateInvitationParams): Promise<InvitationData | null> => {
      if (!user) {
        setError('You must be logged in to create invitations');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Check if user is captain of the team
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('id, name, captain_id')
          .eq('id', params.teamId)
          .single();

        if (teamError || !team) {
          throw new Error('Team not found');
        }

        if (team.captain_id !== user.id) {
          throw new Error('Only team captains can create invitations');
        }

        // Check if jersey number is already taken (if provided)
        if (params.jerseyNumber) {
          const { data: existingJersey } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', params.teamId)
            .eq('jersey_number', params.jerseyNumber)
            .eq('is_active', true)
            .is('removed_at', null) // Only check active, non-removed members
            .limit(1);

          if (existingJersey && existingJersey.length > 0) {
            throw new Error(`Jersey number ${params.jerseyNumber} is already taken`);
          }
        }

        // Generate a 6-character code
        const invitationToken = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Set expiry to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Generate unique placeholder email for code-based invitations
        // This avoids both NOT NULL and unique constraint issues
        const placeholderEmail = `code-invite-${invitationToken}@matchday.internal`;

        // Create invitation in database
        const { data: invitation, error: invitationError } = await supabase
          .from('team_invitations')
          .insert({
            team_id: params.teamId,
            invited_by: user.id,
            email: placeholderEmail, // Unique placeholder for code-based invitations
            token: invitationToken,
            position: params.position || null,
            jersey_number: params.jerseyNumber || null,
            message: params.message?.trim() || null,
            status: 'pending',
            expires_at: expiresAt.toISOString(),
          })
          .select('id, token, expires_at')
          .single();

        if (invitationError || !invitation) {
          console.error('Error creating invitation:', invitationError);
          throw new Error('Failed to create invitation');
        }

        // Create shareable message
        const shareMessage = `Join my team "${team.name}" on MatchDay!\n\nUse code: ${invitation.token}\n\nOr open the app directly: matchday://join/${invitation.token}`;

        return {
          id: invitation.id,
          code: invitation.token,
          expiresAt: invitation.expires_at,
          teamName: team.name,
          shareMessage,
        };
      } catch (err: any) {
        console.error('Create invitation error:', err);
        setError(err.message || 'Failed to create invitation');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getInvitationDetails = useCallback(
    async (code: string): Promise<InvitationDetails | null> => {
      setLoading(true);
      setError(null);

      try {
        // Fetch invitation by token
        console.log('Looking up invitation with code:', code.toUpperCase());

        const { data: invitation, error: invitationError } = await supabase
          .from('team_invitations')
          .select('id, team_id, invited_by, position, jersey_number, message, expires_at, status')
          .eq('token', code.toUpperCase())
          .single();

        if (invitationError || !invitation) {
          console.error('Invitation lookup error:', invitationError);
          throw new Error('Invitation not found or has expired');
        }

        console.log('Found invitation:', invitation);

        // Fetch team details separately
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, name, team_color')
          .eq('id', invitation.team_id)
          .single();

        if (teamError) {
          console.error('Team lookup error:', teamError);
        }

        // Fetch inviter profile separately
        const { data: inviterProfile } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .eq('id', invitation.invited_by)
          .single();

        const team = teamData;
        const inviter = inviterProfile;

        const isExpired = new Date(invitation.expires_at) < new Date();

        if (invitation.status !== 'pending') {
          throw new Error('This invitation has already been used');
        }

        if (isExpired) {
          throw new Error('This invitation has expired');
        }

        const inviterName = inviter?.display_name || 'Team Captain';

        return {
          id: invitation.id,
          team: {
            id: team?.id || invitation.team_id,
            name: team?.name || 'Unknown Team',
            teamColor: team?.team_color || null,
          },
          invitedBy: {
            id: inviter?.id || invitation.invited_by,
            name: inviterName,
          },
          position: invitation.position,
          jerseyNumber: invitation.jersey_number,
          message: invitation.message,
          expiresAt: invitation.expires_at,
          status: invitation.status,
          isExpired,
        };
      } catch (err: any) {
        console.error('Get invitation details error:', err);
        setError(err.message || 'Failed to get invitation details');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const acceptInvitation = useCallback(
    async (code: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in to accept invitations');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        // Get invitation details
        const { data: invitation, error: invitationError } = await supabase
          .from('team_invitations')
          .select('id, team_id, position, jersey_number, status, expires_at')
          .eq('token', code.toUpperCase())
          .single();

        if (invitationError || !invitation) {
          throw new Error('Invitation not found');
        }

        if (invitation.status !== 'pending') {
          throw new Error('This invitation has already been used');
        }

        if (new Date(invitation.expires_at) < new Date()) {
          throw new Error('This invitation has expired');
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', invitation.team_id)
          .eq('user_id', user.id)
          .is('removed_at', null) // Only check active memberships
          .limit(1);

        if (existingMember && existingMember.length > 0) {
          throw new Error('You are already a member of this team');
        }

        // Add user as team member
        const { error: memberError } = await supabase.from('team_members').insert({
          team_id: invitation.team_id,
          user_id: user.id,
          jersey_number: invitation.jersey_number,
          position: invitation.position,
          is_active: true,
        });

        if (memberError) {
          console.error('Error adding team member:', memberError);
          throw new Error('Failed to join team');
        }

        // Update invitation status to accepted
        const { error: updateError } = await supabase
          .from('team_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            accepted_by: user.id,
          })
          .eq('id', invitation.id);

        if (updateError) {
          console.error('Error updating invitation status:', updateError);
          // Member was added successfully, so don't throw
        }

        return true;
      } catch (err: any) {
        console.error('Accept invitation error:', err);
        setError(err.message || 'Failed to accept invitation');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createInvitation,
    getInvitationDetails,
    acceptInvitation,
    loading,
    error,
    clearError,
  };
};
