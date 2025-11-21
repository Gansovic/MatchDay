import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { MediaService } from '@matchday/services';
import type { MediaUploadOptions } from '@matchday/database';

export async function POST(request: NextRequest) {
  try {
    // Use admin client - user will be set from formData
    const supabase = createAdminClient();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const context_type = formData.get('context_type') as string;
    const team_id = formData.get('team_id') as string | null;
    const league_id = formData.get('league_id') as string | null;
    const season_id = formData.get('season_id') as string | null;
    const match_id = formData.get('match_id') as string | null;
    const player_id = formData.get('player_id') as string | null;
    const uploaded_by = formData.get('uploaded_by') as string;
    const is_public = formData.get('is_public') === 'true';
    const description = formData.get('description') as string | null;
    const tagsString = formData.get('tags') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!context_type) {
      return NextResponse.json(
        { error: 'Context type is required' },
        { status: 400 }
      );
    }

    if (!uploaded_by) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Parse tags if provided
    const tags = tagsString ? JSON.parse(tagsString) : undefined;

    // Build upload options
    const options: MediaUploadOptions = {
      context_type: context_type as any,
      team_id: team_id || undefined,
      league_id: league_id || undefined,
      season_id: season_id || undefined,
      match_id: match_id || undefined,
      player_id: player_id || undefined,
      is_public,
      tags,
      description: description || undefined,
    };

    // Upload media using MediaService
    const mediaService = MediaService.getInstance(supabase);
    const result = await mediaService.uploadMedia(file, options, uploaded_by);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error?.message || 'Upload failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
