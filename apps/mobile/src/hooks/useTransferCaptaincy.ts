import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface TransferCaptaincyResult {
  success: boolean;
  error?: string;
  message?: string;
}

export const useTransferCaptaincy = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transferCaptaincy = async (
    teamId: string,
    newCaptainId: string
  ): Promise<TransferCaptaincyResult> => {
    setLoading(true);
    setError(null);

    try {
      // Get the current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        const errorMsg = 'You must be logged in to transfer captaincy';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Get API URL from environment
      const apiUrl = process.env.EXPO_PUBLIC_PLAYER_API_URL || 'http://localhost:3000';

      // Call the POST endpoint
      const response = await fetch(
        `${apiUrl}/api/teams/${teamId}/transfer-captain`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ newCaptainId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Failed to transfer captaincy';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      return {
        success: true,
        message: data.message || 'Captaincy transferred successfully',
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to transfer captaincy';
      setError(errorMsg);
      console.error('Transfer captaincy error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    transferCaptaincy,
    loading,
    error,
    clearError: () => setError(null),
  };
};
