import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { MediaService } from '@matchday/services';

/**
 * GET /api/players/[playerId]/media
 * Fetch all media for a specific player (uploads + reposts)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Optional: Check if user is authenticated to potentially view private media
    // But don't require authentication for public media
    const { data: { user } } = await supabase.auth.getUser();

    const { playerId } = params;
    const mediaService = MediaService.getInstance(supabase);

    // Get player media (both uploads and reposts)
    const result = await mediaService.getPlayerMedia(playerId);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch media' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Player media fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[playerId]/media
 * Upload personal media for a player
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { playerId } = params;

    // Verify user is uploading to their own profile
    if (playerId !== user.id) {
      return NextResponse.json(
        { error: 'Can only upload to your own profile' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;
    const tagsString = formData.get('tags') as string | null;
    const isPublicString = formData.get('is_public') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const tags = tagsString ? JSON.parse(tagsString) : undefined;
    const is_public = isPublicString ? JSON.parse(isPublicString) : true;

    const mediaService = MediaService.getInstance(supabase);
    const result = await mediaService.uploadPlayerMedia(
      file,
      playerId,
      user.id,
      {
        description: description || undefined,
        tags,
        is_public
      }
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to upload media' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Player media upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
