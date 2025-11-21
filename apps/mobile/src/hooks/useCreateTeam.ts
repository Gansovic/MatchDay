import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface CreateTeamInput {
  name: string;
  team_color: string;
  team_bio?: string;
  max_players: number;
  min_players: number;
}

export interface CreateTeamResult {
  id: string;
  name: string;
  team_color: string;
  team_bio: string | null;
  max_players: number;
  min_players: number;
  captain_id: string;
}

export const useCreateTeam = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTeam = async (
    input: CreateTeamInput,
    userId: string
  ): Promise<CreateTeamResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate input
      if (!input.name || input.name.trim().length < 2) {
        throw new Error('Team name must be at least 2 characters');
      }
      if (input.name.trim().length > 50) {
        throw new Error('Team name must be at most 50 characters');
      }
      if (input.max_players <= input.min_players) {
        throw new Error('Maximum players must be greater than minimum players');
      }
      if (input.min_players < 1 || input.min_players > 49) {
        throw new Error('Minimum players must be between 1 and 49');
      }
      if (input.max_players < 2 || input.max_players > 50) {
        throw new Error('Maximum players must be between 2 and 50');
      }

      // Create the team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: input.name.trim(),
          team_color: input.team_color,
          team_bio: input.team_bio?.trim() || null,
          max_players: input.max_players,
          min_players: input.min_players,
          captain_id: userId,
        })
        .select()
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
        throw new Error(teamError.message || 'Failed to create team');
      }

      // Add creator as team member
      const { error: memberError } = await supabase.from('team_members').insert({
        team_id: teamData.id,
        user_id: userId,
        is_active: true,
      });

      if (memberError) {
        console.error('Error adding team member:', memberError);
        // Rollback team creation if member insertion fails
        await supabase.from('teams').delete().eq('id', teamData.id);
        throw new Error('Failed to add you as team member');
      }

      return teamData as CreateTeamResult;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create team';
      setError(errorMessage);
      console.error('Create team error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createTeam, isLoading, error, clearError: () => setError(null) };
};
