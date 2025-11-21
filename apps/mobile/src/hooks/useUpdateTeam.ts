import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface UpdateTeamInput {
  name?: string;
  team_color?: string;
  team_bio?: string;
  max_players?: number;
  min_players?: number;
}

export const useUpdateTeam = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTeam = async (
    teamId: string,
    input: UpdateTeamInput,
    userId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // First verify the user is the captain
      const { data: teamData, error: verifyError } = await supabase
        .from('teams')
        .select('captain_id')
        .eq('id', teamId)
        .single();

      if (verifyError) {
        throw new Error('Team not found');
      }

      if (teamData.captain_id !== userId) {
        throw new Error('Only the team captain can edit this team');
      }

      // Validate input
      if (input.name !== undefined) {
        if (input.name.trim().length < 2) {
          throw new Error('Team name must be at least 2 characters');
        }
        if (input.name.trim().length > 50) {
          throw new Error('Team name must be at most 50 characters');
        }
      }

      if (input.max_players !== undefined && input.min_players !== undefined) {
        if (input.max_players <= input.min_players) {
          throw new Error('Maximum players must be greater than minimum players');
        }
      }

      if (input.min_players !== undefined) {
        if (input.min_players < 1 || input.min_players > 49) {
          throw new Error('Minimum players must be between 1 and 49');
        }
      }

      if (input.max_players !== undefined) {
        if (input.max_players < 2 || input.max_players > 50) {
          throw new Error('Maximum players must be between 2 and 50');
        }
      }

      // Prepare update data
      const updateData: Record<string, any> = {};
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.team_color !== undefined) updateData.team_color = input.team_color;
      if (input.team_bio !== undefined) updateData.team_bio = input.team_bio.trim() || null;
      if (input.max_players !== undefined) updateData.max_players = input.max_players;
      if (input.min_players !== undefined) updateData.min_players = input.min_players;

      if (Object.keys(updateData).length === 0) {
        return true; // Nothing to update
      }

      // Update the team
      const { error: updateError } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId);

      if (updateError) {
        console.error('Error updating team:', updateError);
        throw new Error(updateError.message || 'Failed to update team');
      }

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update team';
      setError(errorMessage);
      console.error('Update team error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateTeam, isLoading, error, clearError: () => setError(null) };
};
