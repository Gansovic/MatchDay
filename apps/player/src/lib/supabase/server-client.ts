/**
 * Server-side Supabase client utilities for MatchDay
 * 
 * Proper Next.js 15 App Router + Supabase Cloud server-side authentication
 * Uses @supabase/ssr for consistent cookie-based authentication
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Database } from '@matchday/database'

/**
 * Create a Supabase client for Server Components and API Routes
 * 
 * Uses cookies for authentication state, consistent with browser client.
 * This ensures proper SSR and authentication across client/server boundary.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      cookieOptions: {
        name: 'matchday-auth',
        lifetime: 60 * 60 * 24 * 7, // 7 days
        domain: undefined,
        path: '/',
        sameSite: 'lax',
      },
    }
  )
}

/**
 * Create a Supabase client for API Routes with request/response handling
 * 
 * This version can modify cookies in the response, necessary for auth operations
 * like login/logout in API routes.
 */
export function createUserSupabaseClient(request: NextRequest, response?: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies in the response if available
          if (response) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          }
          // Also set in request for immediate use
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
        },
      },
      cookieOptions: {
        name: 'matchday-auth',
        lifetime: 60 * 60 * 24 * 7, // 7 days
        domain: undefined,
        path: '/',
        sameSite: 'lax',
      },
    }
  )
}

/**
 * Create an admin client with service role for elevated operations
 * 
 * WARNING: Only use this in secure server-side contexts (API routes, server actions)
 * Never expose the service role key to the client!
 */
export function createAdminSupabaseClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Admin client doesn't need cookies
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

/**
 * Get authenticated user from server-side context
 * 
 * Returns the user if authenticated, null otherwise
 */
export async function getServerUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting server user:', error)
    return null
  }
}