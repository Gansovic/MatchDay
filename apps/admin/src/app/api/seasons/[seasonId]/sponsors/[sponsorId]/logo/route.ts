/**
 * API Route: Sponsor Logo Upload
 *
 * POST /api/seasons/[seasonId]/sponsors/[sponsorId]/logo - Upload sponsor logo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { SponsorService } from '@matchday/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string; sponsorId: string }> }
) {
  try {
    const { seasonId, sponsorId } = await params;

    if (!seasonId || !sponsorId) {
      return NextResponse.json(
        { error: 'Season ID and Sponsor ID are required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const sponsorService = SponsorService.getInstance(supabase);

    const result = await sponsorService.uploadSponsorLogo(
      sponsorId,
      seasonId,
      file,
      userId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to upload logo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: result.data }
    });
  } catch (error) {
    console.error('Error uploading sponsor logo:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
