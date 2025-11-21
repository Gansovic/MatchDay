import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MediaService } from '@matchday/services';

/**
 * GET /api/matches/[matchId]/media
 * Retrieve all media for a specific match
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize media service
    const mediaService = MediaService.getInstance(supabase);

    // Get match media
    const result = await mediaService.getMatchMedia(params.matchId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch match media' },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error fetching match media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match media' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches/[matchId]/media
 * Upload new media for a match (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin' && userData?.role !== 'league_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;
    const tags = formData.get('tags') as string | null;
    const is_public = formData.get('is_public') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, MP4, MOV' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit for images, 200MB for videos)
    const maxSize = file.type.startsWith('video/') ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Initialize media service
    const mediaService = MediaService.getInstance(supabase);

    // Upload match media
    const result = await mediaService.uploadMatchMedia(
      file,
      params.matchId,
      user.id,
      {
        description: description || undefined,
        tags: tags ? JSON.parse(tags) : undefined,
        is_public: is_public === 'false' ? false : true, // Default to public
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to upload match media' },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Match media upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload match media' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/matches/[matchId]/media
 * Delete a specific media item from a match (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin' && userData?.role !== 'league_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get media ID from query params
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }

    // Initialize media service
    const mediaService = MediaService.getInstance(supabase);

    // Delete the media
    const result = await mediaService.deleteMedia(mediaId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to delete media' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting match media:', error);
    return NextResponse.json(
      { error: 'Failed to delete match media' },
      { status: 500 }
    );
  }
}