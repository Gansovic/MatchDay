import { useState, useEffect } from 'react';
import type { User } from '@matchday/shared-types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This will be implemented with actual auth service
    setLoading(false);
  }, []);

  return {
    user,
    loading,
    error,
    signOut: () => {
      setUser(null);
    }
  };
};