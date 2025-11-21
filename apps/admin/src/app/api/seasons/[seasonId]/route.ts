import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { SeasonService } from '@matchday/services';

/**
 * PATCH /api/seasons/[seasonId]
 * Update season details (currently supports description)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const body = await request.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { description } = body;

    // Validate description if provided
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return NextResponse.json(
          { error: 'Description must be a string' },
          { status: 400 }
        );
      }

      // Max length validation (500 characters)
      if (description.length > 500) {
        return NextResponse.json(
          { error: 'Description must be 500 characters or less' },
          { status: 400 }
        );
      }
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();
    const seasonService = SeasonService.getInstance(supabase);

    // Trim whitespace from description
    const trimmedDescription = description?.trim() || null;

    // Update season
    const result = await seasonService.updateSeason(seasonId, {
      description: trimmedDescription
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to update season' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error updating season:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
