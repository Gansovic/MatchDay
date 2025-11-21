import { useState } from 'react';
import { MobileMediaService } from '../../services/media.service';
import { supabase } from '../../../lib/supabase';

export const useMediaDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new MobileMediaService(supabase);

  const deleteMedia = async (mediaId: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      await service.deleteMedia(mediaId);
      return true;
    } catch (err: any) {
      setError(err.message || 'Delete failed');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteMedia,
    isDeleting,
    error,
    clearError: () => setError(null),
  };
};
