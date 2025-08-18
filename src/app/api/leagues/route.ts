/**
 * Leagues API Routes
 * 
 * Handles league-related API operations:
 * - GET /api/leagues - Get available leagues for team creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/leagues
 * Get available leagues with optional filtering and search
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createServerClient();
    
    // Extract query parameters for filtering
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const sport_type = url.searchParams.get('sport_type');
    const league_type = url.searchParams.get('league_type');
    const location = url.searchParams.get('location');
    const has_available_spots = url.searchParams.get('has_available_spots');
    const season_active = url.searchParams.get('season_active');
    
    // Build the query
    let query = supabase
      .from('leagues')
      .select(`
        *,
        teams (
          id,
          name,
          team_color,
          captain_id,
          max_players,
          min_players,
          is_recruiting,
          team_members (count)
        )
      `)
      .eq('is_active', true)
      .eq('is_public', true);
    
    // Apply filters
    if (sport_type) {
      query = query.eq('sport_type', sport_type);
    }
    
    if (league_type) {
      query = query.eq('league_type', league_type);
    }
    
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }
    
    // Apply date filters for active season
    if (season_active === 'true') {
      const now = new Date().toISOString();
      query = query
        .or(`season_start.is.null,season_start.lte.${now}`)
        .or(`season_end.is.null,season_end.gte.${now}`);
    }
    
    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });
    
    const { data: leagues, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    // Transform the data to include calculated fields
    const transformedLeagues = leagues?.map(league => {
      const teams = league.teams || [];
      const teamCount = teams.length;
      
      // Calculate player count and available spots
      let playerCount = 0;
      
      teams.forEach(team => {
        const currentMembers = team.team_members?.length || 1; // At least the captain
        playerCount += currentMembers;
      });
      
      // Available spots should be for teams, not individual players
      const maxTeams = league.max_teams || 999;
      const availableSpots = Math.max(0, maxTeams - teamCount);
      
      // Filter out teams data for response (we only needed it for calculations)
      const { teams: _, ...leagueWithoutTeams } = league;
      
      return {
        ...leagueWithoutTeams,
        teamCount,
        playerCount,
        availableSpots,
        isUserMember: false, // This would need user context to determine
        // Mock compatibility score for now - could be calculated based on user preferences
        compatibilityScore: undefined
      };
    }) || [];
    
    // Apply available spots filter after transformation
    let filteredLeagues = transformedLeagues;
    if (has_available_spots === 'true') {
      filteredLeagues = transformedLeagues.filter(league => league.availableSpots > 0);
    }
    
    return NextResponse.json({
      data: filteredLeagues,
      message: 'Leagues retrieved successfully',
      count: filteredLeagues.length
    });

  } catch (error) {
    console.error('Error in GET /api/leagues:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to retrieve leagues' },
      { status: 500 }
    );
  }
}