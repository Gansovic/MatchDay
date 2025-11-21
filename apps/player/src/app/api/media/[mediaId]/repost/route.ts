import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MediaService } from '@matchday/services';
import { Database } from '@matchday/database';

/**
 * POST /api/media/[mediaId]/repost
 * Repost media to player's gallery
 *
 * Supports both cookie-based auth (web) and Bearer token auth (mobile)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    // Check for Authorization header (mobile app)
    const authHeader = request.headers.get('authorization');

    let supabase;
    if (authHeader?.startsWith('Bearer ')) {
      // Mobile app: create client with the provided token
      const token = authHeader.replace('Bearer ', '');
      supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
    } else {
      // Web app: use cookie-based auth
      const { createServerSupabaseClient } = await import('@/lib/supabase/server-client');
      supabase = await createServerSupabaseClient();
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { mediaId } = await params;

    const mediaService = MediaService.getInstance(supabase);
    // Automatically use authenticated user's ID for both player and uploader
    const result = await mediaService.repostMedia(mediaId, user.id, user.id);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to repost media' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: result.data,
      message: 'Media reposted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Media repost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
