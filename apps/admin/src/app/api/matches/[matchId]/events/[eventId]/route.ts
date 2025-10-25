import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { MatchService } from '@matchday/services';

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * DELETE /api/matches/[matchId]/events/[eventId]
 * Delete a match event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string; eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = createAdminClient();

    // Check authentication - get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, data: null, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, data: null, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get match service instance
    const matchService = MatchService.getInstance(supabase);

    // Delete match event
    const result = await matchService.deleteMatchEvent(eventId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error?.message || 'Failed to delete match event' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: null,
      error: null
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;

  } catch (error) {
    console.error('API error in DELETE /api/matches/[matchId]/events/[eventId]:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
