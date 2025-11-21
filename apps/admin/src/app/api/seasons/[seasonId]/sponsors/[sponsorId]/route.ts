/**
 * API Route: Individual Sponsor
 *
 * PATCH /api/seasons/[seasonId]/sponsors/[sponsorId] - Update sponsor
 * DELETE /api/seasons/[seasonId]/sponsors/[sponsorId] - Delete sponsor
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { SponsorService } from '@matchday/services';

export async function PATCH(
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

    const body = await request.json();

    const supabase = createAdminClient();
    const sponsorService = SponsorService.getInstance(supabase);

    const result = await sponsorService.updateSponsor(sponsorId, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to update sponsor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error updating sponsor:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const supabase = createAdminClient();
    const sponsorService = SponsorService.getInstance(supabase);

    const result = await sponsorService.deleteSponsor(sponsorId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to delete sponsor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sponsor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
