import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string; teamId: string }> }
) {
  try {
    const { seasonId, teamId } = await params
    const supabase = createAdminClient()

    // Verify season exists
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('id, status')
      .eq('id', seasonId)
      .single()

    if (seasonError || !season) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      )
    }

    // Check if team is registered to this season
    const { data: registration, error: registrationError } = await supabase
      .from('season_teams')
      .select('id')
      .eq('season_id', seasonId)
      .eq('team_id', teamId)
      .single()

    if (registrationError || !registration) {
      return NextResponse.json(
        { error: 'Team is not registered in this season' },
        { status: 404 }
      )
    }

    // Delete the team registration from the season
    const { error: deleteError } = await supabase
      .from('season_teams')
      .delete()
      .eq('season_id', seasonId)
      .eq('team_id', teamId)

    if (deleteError) {
      console.error('Error removing team from season:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove team from season' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Team removed from season successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/seasons/[seasonId]/teams/[teamId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
