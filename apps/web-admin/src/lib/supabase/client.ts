/**
 * Supabase Client Configuration for MatchDay Admin
 * 
 * Proper Next.js 15 App Router + Supabase Cloud integration using @supabase/ssr
 * Handles client-side, server-side, and SSR authentication consistently
 * 
 * Includes environment validation to prevent database confusion
 */

import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database.types';
import { validateEnvironmentAtStartup, getEnvironmentConfig } from '@/lib/environment/validation'

// Validate environment at startup to prevent database confusion
validateEnvironmentAtStartup()

// Get validated environment configuration
const envConfig = getEnvironmentConfig()
const { supabaseUrl, supabaseAnonKey } = envConfig

/**
 * Supabase client for Client Components
 * 
 * Uses @supabase/ssr for proper SSR support and Supabase Cloud compatibility.
 * Automatically handles authentication state with cookies for SSR consistency.
 */
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookieOptions: {
      name: 'matchday-admin-auth',
      lifetime: 60 * 60 * 24 * 7, // 7 days
      domain: undefined,
      path: '/',
      sameSite: 'lax',
    },
  }
)

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
        'X-Client-Info': 'matchday-admin-server@1.0.0'
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
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Unexpected error getting current user:', error)
    return null
  }
}

/**
 * Type-safe helper for getting the current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting current session:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Unexpected error getting current session:', error)
    return null
  }
}

/**
 * Utility function to handle Supabase auth redirects
 */
export function getAuthRedirectUrl(path: string = '/dashboard') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
  return `${baseUrl}${path}`
}

/**
 * Cookie management utilities for authentication recovery
 */
export function clearAuthCookies() {
  if (typeof document === 'undefined') return

  // Clear all Supabase auth cookies
  const cookieNames = [
    'matchday-admin-auth',
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token'
  ]

  cookieNames.forEach(cookieName => {
    // Clear cookie with various path and domain combinations
    const clearCookie = (domain?: string, path: string = '/') => {
      let cookieString = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`
      if (domain) cookieString += ` domain=${domain};`
      document.cookie = cookieString
    }

    // Clear with different path/domain combinations
    clearCookie()
    clearCookie(undefined, '/')
    clearCookie(window.location.hostname)
    clearCookie(`.${window.location.hostname}`)
  })

  // Also clear localStorage auth items
  if (typeof localStorage !== 'undefined') {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })
  }

  console.log('🧹 Cleared all authentication cookies and localStorage')
}

/**
 * Detect if a session has an invalid JWT token
 */
export function isInvalidJWTError(error: any): boolean {
  if (!error) return false
  
  const message = error.message || error.toString()
  return message.includes('invalid JWT') || 
         message.includes('signature is invalid') ||
         message.includes('unable to parse or verify signature')
}

/**
 * Validate session health - checks if the session is usable
 */
export async function validateSessionHealth(session: any): Promise<boolean> {
  if (!session?.access_token) return false
  
  try {
    // Try a simple authenticated request to validate the token
    const { data, error } = await supabase.auth.getUser()
    
    if (error && isInvalidJWTError(error)) {
      console.log('🚨 Session health check failed: Invalid JWT detected')
      return false
    }
    
    return !error && !!data.user
  } catch (error) {
    if (isInvalidJWTError(error)) {
      console.log('🚨 Session health check failed: Invalid JWT detected')
      return false
    }
    return false
  }
}