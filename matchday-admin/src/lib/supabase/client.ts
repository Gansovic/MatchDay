/**
 * Supabase Client Configuration for MatchDay
 * 
 * Provides singleton Supabase client instances optimized for Next.js 15 App Router.
 * Includes proper client/server component handling and authentication integration.
 * 
 * @example
 * ```typescript
 * // In Client Components
 * import { supabase } from '@/lib/supabase/client';
 * const { data } = await supabase.auth.getUser();
 * 
 * // In Server Components
 * import { createServerClient } from '@/lib/supabase/client';
 * const supabase = createServerClient();
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database.types';

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
 * Supabase client for Client Components
 * 
 * This client automatically handles authentication state and is safe to use
 * in client-side React components.
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
    headers: {
      'X-Client-Info': 'matchday-web@1.0.0'
    }
  },
  // Add retry logic for failed requests
  db: {
    schema: 'public'
  }
});

/**
 * Create a Supabase client for Server Components
 * 
 * This function creates a server-side client that can access cookies
 * for authentication in Server Components and Route Handlers.
 */
export function createServerClient() {
  // For server-side usage, we'll need to handle cookies differently
  // This is a simplified version - in a real app you'd use @supabase/ssr
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'matchday-server@1.0.0'
      }
    }
  });
}

/**
 * Create an admin client for server-side operations that require elevated permissions
 * 
 * WARNING: Only use this in secure server-side contexts (API routes, server actions)
 * Never expose the service role key to the client!
 */
export function createAdminClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'X-Client-Info': 'matchday-admin@1.0.0'
      }
    }
  });
}

/**
 * Type-safe helper for getting the current user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Unexpected error getting current user:', error);
    return null;
  }
}

/**
 * Type-safe helper for getting the current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting current session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Unexpected error getting current session:', error);
    return null;
  }
}

/**
 * Utility function to handle Supabase auth redirects
 */
export function getAuthRedirectUrl(path: string = '/') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}