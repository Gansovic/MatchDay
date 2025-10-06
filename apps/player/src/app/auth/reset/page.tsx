'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthResetPage() {
  const [status, setStatus] = useState('Clearing authentication state...');
  const router = useRouter();

  useEffect(() => {
    const clearAuthState = async () => {
      try {
        setStatus('Clearing Supabase session...');
        
        // Force sign out from Supabase
        await supabase.auth.signOut();
        
        setStatus('Clearing localStorage...');
        
        // Clear all localStorage items
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        setStatus('Authentication state cleared!');
        
        // Wait 2 seconds then redirect to login
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
        
      } catch (error) {
        setStatus(`Error clearing auth: ${error}`);
      }
    };
    
    clearAuthState();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Resetting Authentication</h1>
        <p className="text-center text-gray-600">{status}</p>
        
        <div className="mt-6 text-center">
          <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"></div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500 text-center">
          You will be redirected to login in a moment...
        </div>
      </div>
    </div>
  );
}