/**
 * Fixed Supabase Client Configuration for MatchDay
 * 
 * This version addresses CORS issues with self-hosted Supabase stack
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@matchday/database';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client with CORS workaround
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  global: {
    // Remove X-Client-Info header to avoid CORS issues
    // or set it conditionally based on environment
    headers: process.env.NODE_ENV === 'development' 
      ? {} // Empty headers in development to avoid CORS
      : { 'X-Client-Info': 'matchday-web@1.0.0' },
    
    // Add custom fetch to handle CORS issues
    fetch: (url, options = {}) => {
      // For development with self-hosted Supabase, modify headers
      if (process.env.NODE_ENV === 'development' && url.includes('localhost:8000')) {
        const modifiedOptions = {
          ...options,
          headers: {
            ...options.headers,
            // Ensure apikey is always present
            'apikey': supabaseAnonKey,
            // Remove X-Client-Info if it's causing issues
            'X-Client-Info': undefined
          }
        };
        
        // Remove undefined headers
        Object.keys(modifiedOptions.headers).forEach(key => {
          if (modifiedOptions.headers[key] === undefined) {
            delete modifiedOptions.headers[key];
          }
        });
        
        return fetch(url, modifiedOptions);
      }
      
      return fetch(url, options);
    }
  },
  db: {
    schema: 'public'
  }
});

/**
 * Alternative: Create a client without X-Client-Info header
 */
export const supabaseNoClientInfo = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  // No global headers that might cause CORS issues
  db: {
    schema: 'public'
  }
});

// Export helper functions
export { 
  getCurrentUser,
  getCurrentSession,
  getAuthRedirectUrl,
  createServerClient,
  createAdminClient
} from './client';