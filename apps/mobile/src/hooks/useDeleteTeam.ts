import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export const useDeleteTeam = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTeam = async (teamId: string, userId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // First verify the user is the captain
      const { data: teamData, error: verifyError } = await supabase
        .from('teams')
        .select('captain_id, name')
        .eq('id', teamId)
        .single();

      if (verifyError) {
        throw new Error('Team not found');
      }

      if (teamData.captain_id !== userId) {
        throw new Error('Only the team captain can delete this team');
      }

      // Delete the team (cascades to team_members, team_stats, etc.)
      const { error: deleteError } = await supabase.from('teams').delete().eq('id', teamId);

      if (deleteError) {
        console.error('Error deleting team:', deleteError);
        throw new Error(deleteError.message || 'Failed to delete team');
      }

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete team';
      setError(errorMessage);
      console.error('Delete team error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteTeam, isLoading, error, clearError: () => setError(null) };
};
