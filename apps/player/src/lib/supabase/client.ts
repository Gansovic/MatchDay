/**
 * Supabase Client Configuration for MatchDay
 * 
 * Proper Next.js 15 App Router + Supabase Cloud integration using @supabase/ssr
 * Handles client-side, server-side, and SSR authentication consistently
 * 
 * Includes environment validation to prevent database confusion
 */

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@matchday/database'
import { validateEnvironmentAtStartup, getEnvironmentConfig } from '@matchday/shared'

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
      name: 'matchday-auth',
      lifetime: 60 * 60 * 24 * 7, // 7 days
      domain: undefined,
      path: '/',
      sameSite: 'lax',
    },
  }
)

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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}${path}`
}

/**
 * Cookie management utilities for authentication recovery
 */
export function clearAuthCookies() {
  if (typeof document === 'undefined') return

  // Clear all Supabase auth cookies
  const cookieNames = [
    'matchday-auth',
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