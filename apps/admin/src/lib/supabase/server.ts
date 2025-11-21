/**
 * Supabase Server Client for Next.js 15 App Router
 *
 * Provides proper server-side authentication handling for API routes
 * and Server Components with cookie-based session management.
 */

import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@matchday/database';

/**
 * Create a Supabase client for use in Server Components and API Routes
 *
 * This properly handles cookie-based authentication in Next.js 15 App Router
 * with support for both read and write operations.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore - called from Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore - called from Server Component
          }
        },
      },
    }
  );
}

/**
 * Get the authenticated user from the server session
 *
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const cookieStore = await cookies();

  // Debug: Log all cookies
  const allCookies = cookieStore.getAll();
  console.log('🔍 All cookies:', allCookies.map(c => c.name));

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    console.log('🔍 getUser result:', {
      hasUser: !!user,
      userId: user?.id,
      error: error?.message
    });

    if (error || !user) {
      console.error('[Server Auth] No user or error:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('[Server Auth] Error getting user:', error);
    return null;
  }
}

/**
 * Require authentication for an API route
 *
 * @returns The authenticated user
 * @throws Returns a 401 response if not authenticated
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Response(
      JSON.stringify({ error: 'Authentication required' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return user;
}

/**
 * Check if user has permission for a specific resource
 *
 * @param userId - The user ID to check
 * @param resourceType - The type of resource (e.g., 'league', 'season', 'team')
 * @param resourceId - The ID of the resource
 * @returns Whether the user has permission
 */
export async function checkPermission(
  userId: string,
  resourceType: 'league' | 'season' | 'team',
  resourceId: string
): Promise<boolean> {
  const supabase = await createServerClient();

  try {
    switch (resourceType) {
      case 'league':
        const { data: league } = await supabase
          .from('leagues')
          .select('created_by')
          .eq('id', resourceId)
          .single();
        return league?.created_by === userId;

      case 'season':
        const { data: season } = await supabase
          .from('seasons')
          .select('leagues!inner(created_by)')
          .eq('id', resourceId)
          .single();
        return (season as any)?.leagues?.created_by === userId;

      case 'team':
        const { data: team } = await supabase
          .from('teams')
          .select('captain_id')
          .eq('id', resourceId)
          .single();
        return team?.captain_id === userId;

      default:
        return false;
    }
  } catch (error) {
    console.error(`[Server Auth] Error checking ${resourceType} permission:`, error);
    return false;
  }
}