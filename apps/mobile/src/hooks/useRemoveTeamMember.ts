import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface RemovePlayerResult {
  success: boolean;
  error?: string;
  message?: string;
}

export const useRemoveTeamMember = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removePlayer = async (
    teamId: string,
    memberId: string,
    reason?: string
  ): Promise<RemovePlayerResult> => {
    console.log('🗑️ useRemoveTeamMember - Starting removal:', { teamId, memberId, reason });
    setLoading(true);
    setError(null);

    try {
      // Get the current user session
      console.log('🔐 useRemoveTeamMember - Getting session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        const errorMsg = 'You must be logged in to remove team members';
        console.error('❌ useRemoveTeamMember - Session error:', sessionError);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('✅ useRemoveTeamMember - Session valid, user:', session.user.id);

      // Get API URL from environment
      const apiUrl = process.env.EXPO_PUBLIC_PLAYER_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/api/teams/${teamId}/members/${memberId}`;

      console.log('📡 useRemoveTeamMember - Calling API:', url);

      // Call the DELETE endpoint
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: reason ? JSON.stringify({ reason }) : undefined,
      });

      const data = await response.json();
      console.log('📥 useRemoveTeamMember - API response:', { status: response.status, data });

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Failed to remove team member';
        console.error('❌ useRemoveTeamMember - API error:', errorMsg);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('✅ useRemoveTeamMember - Successfully removed member');
      return {
        success: true,
        message: data.message || 'Team member removed successfully',
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove team member';
      console.error('❌ useRemoveTeamMember - Exception:', err);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    removePlayer,
    loading,
    error,
    clearError: () => setError(null),
  };
};
