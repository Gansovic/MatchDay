import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { MediaService } from '@matchday/services';
import type { MediaUploadOptions } from '@matchday/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Upload API - Request received');

    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('🔐 Upload API - Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    });

    if (authError || !user) {
      console.error('🔐 Upload API - Unauthorized:', authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const context_type = formData.get('context_type') as string;
    const team_id = formData.get('team_id') as string | null;
    const league_id = formData.get('league_id') as string | null;
    const season_id = formData.get('season_id') as string | null;
    const is_public = formData.get('is_public') === 'true';
    const description = formData.get('description') as string | null;
    const tagsString = formData.get('tags') as string | null;

    console.log('📦 Upload API - FormData parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      context_type,
      is_public,
      description
    });

    // Validate required fields
    if (!file) {
      console.error('📦 Upload API - No file provided');
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!context_type) {
      console.error('📦 Upload API - No context_type provided');
      return NextResponse.json(
        { error: 'Context type is required' },
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
      is_public,
      tags,
      description: description || undefined,
    };

    console.log('⬆️  Upload API - Calling MediaService.uploadMedia with options:', options);

    // Upload media using MediaService
    const mediaService = MediaService.getInstance(supabase);
    const result = await mediaService.uploadMedia(file, options, user.id);

    console.log('⬆️  Upload API - MediaService.uploadMedia result:', {
      success: result.success,
      hasData: !!result.data,
      error: result.error?.message,
      mediaId: result.data?.media?.id,
      storageUrl: result.data?.storageUrl
    });

    if (!result.success || !result.data) {
      console.error('⬆️  Upload API - Upload failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    console.log('✅ Upload API - Returning success response');
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('❌ Upload API - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
