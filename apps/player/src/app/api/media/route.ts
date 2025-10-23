import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { MediaService } from '@matchday/services';
import type { MediaFilters } from '@matchday/database';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters for filters
    const searchParams = request.nextUrl.searchParams;

    const filters: MediaFilters = {
      team_id: searchParams.get('team_id') || undefined,
      league_id: searchParams.get('league_id') || undefined,
      season_id: searchParams.get('season_id') || undefined,
      media_type: searchParams.get('media_type') as 'image' | 'video' | undefined,
      context_type: searchParams.get('context_type') as any,
      is_public: searchParams.get('is_public') === 'true' ? true :
                 searchParams.get('is_public') === 'false' ? false :
                 undefined,
      uploaded_by: searchParams.get('uploaded_by') || undefined,
      tags: searchParams.get('tags') ? JSON.parse(searchParams.get('tags')!) : undefined,
    };

    // Get media using MediaService
    const mediaService = MediaService.getInstance(supabase);
    const result = await mediaService.getMedia(filters);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch media' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error('Media fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
