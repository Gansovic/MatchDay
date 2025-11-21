/**
 * API Route: Season Sponsors
 *
 * GET /api/seasons/[seasonId]/sponsors - Get all sponsors for a season
 * POST /api/seasons/[seasonId]/sponsors - Create a new sponsor
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { SponsorService } from '@matchday/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;

    if (!seasonId) {
      return NextResponse.json(
        { error: 'Season ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const sponsorService = SponsorService.getInstance(supabase);

    const result = await sponsorService.getSeasonSponsors(seasonId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch sponsors' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;

    if (!seasonId) {
      return NextResponse.json(
        { error: 'Season ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, website_url, display_order } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Sponsor name is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const sponsorService = SponsorService.getInstance(supabase);

    const result = await sponsorService.createSponsor({
      season_id: seasonId,
      name: name.trim(),
      website_url,
      display_order
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to create sponsor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sponsor:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
