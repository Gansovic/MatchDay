import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server-client';

export async function POST() {
  try {
    const supabase = createAdminSupabaseClient();
    
    console.log('🏗️ Populating 2024-2025 Active Season with Matches');
    
    const activeSeasonId = '8520a207-dffb-4233-9982-85e87376a249';
    const leagueId = '261f251e-aee8-4153-a4c7-537b565e7e3f';
    
    // 1. Get teams in the league using the same logic as the teams API
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, league_id')
      .or(`league_id.eq.${leagueId},league_id.is.null`); // Include teams with null league_id OR matching league_id
    
    if (teamsError || !teams || teams.length < 2) {
      throw new Error(`Failed to get teams: ${teamsError?.message || 'Not enough teams'}`);
    }
    
    console.log(`✅ Found ${teams.length} teams:`, teams.map(t => t.name));
    
    // 2. Clear any existing matches for this season
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('season_id', activeSeasonId);
    
    if (deleteError) {
      console.warn('Warning: Failed to clear existing matches:', deleteError.message);
    }
    
    // 3. Generate single round-robin matches (each team plays each other once)
    const matches = [];
    const venues = ['Football Ground', 'Stadium A', 'Sports Complex', 'Community Field', 'City Park'];
    
    // Calculate dates - create proper active season distribution
    const totalMatches = (teams.length * (teams.length - 1)) / 2; // Single round-robin formula
    const now = new Date();
    
    let matchIndex = 0;
    
    // Single round-robin: each team plays every other team exactly once
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) { // j = i + 1 ensures each pair plays only once
        const homeTeam = teams[i];
        const awayTeam = teams[j];
        
        // Create a good mix: first 6 matches completed (past), last 4 scheduled (future)
        let matchDate: Date;
        let isCompleted: boolean;
        
        if (matchIndex < 6) {
          // Past matches (completed) - spread over last 2 months
          const daysAgo = 60 - (matchIndex * 10); // 60 to 10 days ago
          matchDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          isCompleted = true;
        } else {
          // Future matches (scheduled) - spread over next 2 months  
          const daysFromNow = 7 + ((matchIndex - 6) * 14); // 7, 21, 35, 49 days from now
          matchDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
          isCompleted = false;
        }
            
        const match = {
          league_id: leagueId,
          season_id: activeSeasonId,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          match_date: matchDate.toISOString().split('T')[0] + 'T15:00:00+00:00',
          venue: venues[matchIndex % venues.length],
          status: isCompleted ? 'completed' : 'scheduled',
          home_score: isCompleted ? Math.floor(Math.random() * 5) : null,
          away_score: isCompleted ? Math.floor(Math.random() * 4) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        matches.push(match);
        matchIndex++;
      }
    }
    
    console.log(`🎯 Generated ${matches.length} matches (${matches.filter(m => m.status === 'completed').length} completed, ${matches.filter(m => m.status === 'scheduled').length} scheduled)`);
    
    // 4. Insert matches in batches
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('matches')
        .insert(batch)
        .select('id, status, match_date');
      
      if (error) {
        console.error(`Batch insert error (${i}-${i + batchSize}):`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          sampleMatch: batch[0]
        });
        throw new Error(`Batch insert failed: ${error.message} (Code: ${error.code})`);
      }
      
      results.push(...(data || []));
      console.log(`✅ Inserted batch ${i / batchSize + 1}/${Math.ceil(matches.length / batchSize)}`);
    }
    
    // 5. Verify results
    const completedCount = results.filter(m => m.status === 'completed').length;
    const upcomingCount = results.filter(m => m.status === 'scheduled').length;
    
    console.log(`🎉 Successfully populated active season!`);
    console.log(`📊 Total matches: ${results.length}`);
    console.log(`✅ Completed: ${completedCount}`);
    console.log(`⏳ Upcoming: ${upcomingCount}`);
    
    return NextResponse.json({
      success: true,
      data: {
        totalMatches: results.length,
        completedMatches: completedCount,
        upcomingMatches: upcomingCount,
        teams: teams.map(t => ({ id: t.id, name: t.name })),
        sampleMatches: results.slice(0, 5)
      }
    });
    
  } catch (error) {
    console.error('🚨 Failed to populate active season:', error);
    
    // Enhanced error reporting
    let errorDetails = 'Unknown error';
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
      if (error.stack) {
        console.error('📋 Error stack:', error.stack);
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to populate active season',
        details: errorDetails,
        fullError: error
      },
      { status: 500 }
    );
  }
}