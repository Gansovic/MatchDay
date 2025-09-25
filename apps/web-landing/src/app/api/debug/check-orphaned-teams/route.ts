/**
 * Debug Check Orphaned Teams
 * 
 * Find teams that exist but don't have proper captain membership
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';

export async function GET() {
  try {
    console.log('🔍 Checking for orphaned teams...');
    
    const supabase = await createServerSupabaseClient();
    
    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, captain_id, created_at')
      .order('created_at', { ascending: false });
    
    if (teamsError) {
      console.log('❌ Teams query error:', teamsError.message);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch teams',
        details: teamsError.message
      });
    }
    
    console.log('✅ Found teams:', teams?.length || 0);
    
    // Get all team memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('team_members')
      .select('team_id, user_id, position, is_active')
      .eq('is_active', true);
    
    if (membershipsError) {
      console.log('❌ Memberships query error:', membershipsError.message);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch memberships',
        details: membershipsError.message
      });
    }
    
    console.log('✅ Found memberships:', memberships?.length || 0);
    
    // Check each team for captain membership
    const orphanedTeams = [];
    const healthyTeams = [];
    
    for (const team of teams || []) {
      const captainMembership = memberships?.find(m => 
        m.team_id === team.id && m.user_id === team.captain_id
      );
      
      if (!captainMembership) {
        orphanedTeams.push({
          id: team.id,
          name: team.name,
          captain_id: team.captain_id,
          created_at: team.created_at,
          issue: 'Missing captain membership'
        });
      } else {
        healthyTeams.push({
          id: team.id,
          name: team.name,
          captain_id: team.captain_id,
          membership_id: captainMembership.team_id
        });
      }
    }
    
    console.log('🔍 Analysis complete:', { 
      totalTeams: teams?.length || 0,
      healthyTeams: healthyTeams.length,
      orphanedTeams: orphanedTeams.length
    });
    
    return NextResponse.json({
      success: true,
      analysis: {
        totalTeams: teams?.length || 0,
        healthyTeams: healthyTeams.length,
        orphanedTeams: orphanedTeams.length
      },
      healthyTeams,
      orphanedTeams
    });
    
  } catch (error) {
    console.error('❌ Check orphaned teams error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check orphaned teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}