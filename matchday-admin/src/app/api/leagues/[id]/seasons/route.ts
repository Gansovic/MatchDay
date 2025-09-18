import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params;

    console.log(`[Admin Seasons API] Fetching seasons for league: ${leagueId}`);

    const { data: seasons, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[Admin Seasons API] Database error:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`[Admin Seasons API] Found ${seasons?.length || 0} seasons`);

    return NextResponse.json({
      success: true,
      data: seasons || [],
      count: seasons?.length || 0
    });
  } catch (error) {
    console.error(`[Admin Seasons API] Exception:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}