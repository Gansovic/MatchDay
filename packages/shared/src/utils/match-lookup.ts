import { createServerSupabaseClient } from '@/lib/supabase/server-client';

/**
 * Looks up a match by either UUID or sequential match number
 * Supports backward compatibility with UUID links and new sequential ID links
 */
export async function findMatchByIdOrNumber(matchIdOrNumber: string) {
  const supabase = await createServerSupabaseClient();
  
  // Check if the input looks like a UUID (contains hyphens and is 36 chars)
  const isUuid = matchIdOrNumber.includes('-') && matchIdOrNumber.length === 36;
  
  console.log(`🔍 Looking up match by ${isUuid ? 'UUID' : 'number'}:`, matchIdOrNumber);
  
  let query = supabase
    .from('matches')
    .select(`
      id,
      match_number,
      home_score,
      away_score,
      status,
      match_date,
      scheduled_date,
      venue,
      match_duration,
      notes,
      created_at,
      updated_at,
      home_team:teams!matches_home_team_id_fkey(id, name, team_color),
      away_team:teams!matches_away_team_id_fkey(id, name, team_color),
      league:leagues(id, name)
    `);
  
  if (isUuid) {
    // Look up by UUID (id column)
    query = query.eq('id', matchIdOrNumber);
  } else {
    // Look up by sequential number (match_number column)
    const matchNumber = parseInt(matchIdOrNumber, 10);
    if (isNaN(matchNumber)) {
      return { data: null, error: { message: 'Invalid match identifier' } };
    }
    query = query.eq('match_number', matchNumber);
  }
  
  return await query.single();
}

/**
 * Looks up a match for score updates (includes team captain info)
 */
export async function findMatchForScoreUpdate(matchIdOrNumber: string) {
  const supabase = await createServerSupabaseClient();
  
  const isUuid = matchIdOrNumber.includes('-') && matchIdOrNumber.length === 36;
  
  let query = supabase
    .from('matches')
    .select(`
      id,
      match_number,
      status,
      home_team_id,
      away_team_id,
      home_team:teams!matches_home_team_id_fkey(id, name, captain_id),
      away_team:teams!matches_away_team_id_fkey(id, name, captain_id)
    `);
  
  if (isUuid) {
    query = query.eq('id', matchIdOrNumber);
  } else {
    const matchNumber = parseInt(matchIdOrNumber, 10);
    if (isNaN(matchNumber)) {
      return { data: null, error: { message: 'Invalid match identifier' } };
    }
    query = query.eq('match_number', matchNumber);
  }
  
  return await query.single();
}