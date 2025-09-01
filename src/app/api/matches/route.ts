import { NextRequest, NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/auth/api-auth';
import { MatchService } from '@/lib/services/match.service';

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateApiAuth(request);
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }

    const { user } = authResult;
    console.log('🔍 Matches API called for user:', user.id);

    const matchService = new MatchService();
    const result = await matchService.getPlayerMatches(user.id, {}, { includeFutureMatches: true });

    if (!result.success) {
      console.error('❌ Failed to get user matches:', result.error);
      return NextResponse.json(
        { error: 'Failed to load matches', message: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Successfully loaded matches:', result.data.length);
    return NextResponse.json({ success: true, data: result.data });

  } catch (error) {
    console.error('❌ Matches API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process request' },
      { status: 500 }
    );
  }
}