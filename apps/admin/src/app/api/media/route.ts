import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { MediaService } from '@matchday/services';
import type { MediaFilters } from '@matchday/database';

export async function GET(request: NextRequest) {
  try {
    // Use admin client - RLS policies will handle permissions
    const supabase = createAdminClient();

    // Parse query parameters for filters
    const searchParams = request.nextUrl.searchParams;

    const filters: MediaFilters = {
      team_id: searchParams.get('team_id') || undefined,
      league_id: searchParams.get('league_id') || undefined,
      season_id: searchParams.get('season_id') || undefined,
      match_id: searchParams.get('match_id') || undefined,
      media_type: searchParams.get('media_type') as 'image' | 'video' | undefined,
      context_type: searchParams.get('context_type') as any,
      is_public: searchParams.get('is_public') === 'true' ? true :
                 searchParams.get('is_public') === 'false' ? false :
                 undefined,
      uploaded_by: searchParams.get('uploaded_by') || undefined,
      tags: searchParams.get('tags') ? JSON.parse(searchParams.get('tags')!) : undefined,
    };

    console.log('🔍 Media API - Filters received:', filters);

    // Get media using MediaService
    const mediaService = MediaService.getInstance(supabase);
    const result = await mediaService.getMedia(filters);

    console.log('🔍 Media API - Query result:', {
      success: result.success,
      count: result.data?.length,
      error: result.error
    });

    if (!result.success || !result.data) {
      console.error('❌ Media fetch failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to fetch media' },
        { status: 500 }
      );
    }

    console.log(`📊 Media API: Returning ${result.data.length} items for filters:`, filters);
    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error('Media fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
