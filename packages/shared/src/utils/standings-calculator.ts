/**
 * League Standings Calculator Utility
 * 
 * Utility functions for calculating league standings from match results
 * and updating standings automatically when matches are completed.
 */

export interface Match {
  id: string;
  league_id: string;
  home_team_id: string;
  home_team_name: string;
  away_team_id: string;
  away_team_name: string;
  home_score?: number;
  away_score?: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  match_date: string;
  match_week?: number;
}

export interface Team {
  id: string;
  name: string;
  team_color?: string;
  league_id: string;
}

export interface StandingsTeam {
  id: string;
  name: string;
  team_color?: string;
  position: number;
  previous_position?: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  recent_form: ('W' | 'D' | 'L')[];
  form_trend?: 'improving' | 'declining' | 'stable';
}

export interface PointSystem {
  win: number;
  draw: number;
  loss: number;
}

export interface StandingsConfig {
  pointSystem?: PointSystem;
  tiebreakers?: ('goal_difference' | 'goals_for' | 'goals_against' | 'head_to_head')[];
  formLength?: number; // Number of recent matches to track for form
}

const DEFAULT_CONFIG: Required<StandingsConfig> = {
  pointSystem: { win: 3, draw: 1, loss: 0 },
  tiebreakers: ['goal_difference', 'goals_for'],
  formLength: 5
};

/**
 * Calculate league standings from match results
 */
export function calculateStandings(
  matches: Match[],
  teams: Team[],
  config: StandingsConfig = {}
): StandingsTeam[] {
  const { pointSystem, tiebreakers, formLength } = { ...DEFAULT_CONFIG, ...config };
  
  // Initialize team stats
  const teamStats: { [teamId: string]: StandingsTeam } = {};
  teams.forEach(team => {
    teamStats[team.id] = {
      id: team.id,
      name: team.name,
      team_color: team.team_color,
      position: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
      recent_form: []
    };
  });

  // Filter completed matches for this league
  const completedMatches = matches
    .filter(match => 
      match.status === 'completed' && 
      match.home_score !== undefined && 
      match.away_score !== undefined &&
      teams.some(team => team.id === match.home_team_id) && 
      teams.some(team => team.id === match.away_team_id)
    )
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

  // Process matches chronologically
  completedMatches.forEach(match => {
    const homeTeam = teamStats[match.home_team_id];
    const awayTeam = teamStats[match.away_team_id];
    
    if (!homeTeam || !awayTeam) return;

    const homeScore = match.home_score!;
    const awayScore = match.away_score!;
    
    // Update played games
    homeTeam.played++;
    awayTeam.played++;
    
    // Update goals
    homeTeam.goals_for += homeScore;
    homeTeam.goals_against += awayScore;
    awayTeam.goals_for += awayScore;
    awayTeam.goals_against += homeScore;
    
    // Update results, points, and form
    if (homeScore > awayScore) {
      // Home win
      homeTeam.won++;
      homeTeam.points += pointSystem.win;
      homeTeam.recent_form.unshift('W');
      
      awayTeam.lost++;
      awayTeam.points += pointSystem.loss;
      awayTeam.recent_form.unshift('L');
    } else if (homeScore < awayScore) {
      // Away win
      awayTeam.won++;
      awayTeam.points += pointSystem.win;
      awayTeam.recent_form.unshift('W');
      
      homeTeam.lost++;
      homeTeam.points += pointSystem.loss;
      homeTeam.recent_form.unshift('L');
    } else {
      // Draw
      homeTeam.drawn++;
      homeTeam.points += pointSystem.draw;
      homeTeam.recent_form.unshift('D');
      
      awayTeam.drawn++;
      awayTeam.points += pointSystem.draw;
      awayTeam.recent_form.unshift('D');
    }
    
    // Keep only recent form
    if (homeTeam.recent_form.length > formLength) {
      homeTeam.recent_form = homeTeam.recent_form.slice(0, formLength);
    }
    if (awayTeam.recent_form.length > formLength) {
      awayTeam.recent_form = awayTeam.recent_form.slice(0, formLength);
    }
  });

  // Calculate goal difference and form trends
  const standings = Object.values(teamStats).map(team => ({
    ...team,
    goal_difference: team.goals_for - team.goals_against,
    form_trend: calculateFormTrend(team.recent_form)
  }));

  // Sort standings using tiebreakers
  return sortStandings(standings, tiebreakers);
}

/**
 * Sort standings with configurable tiebreakers
 */
function sortStandings(
  standings: StandingsTeam[], 
  tiebreakers: ('goal_difference' | 'goals_for' | 'goals_against' | 'head_to_head')[]
): StandingsTeam[] {
  return standings.sort((a, b) => {
    // Primary: Points (descending)
    if (a.points !== b.points) return b.points - a.points;
    
    // Apply tiebreakers in order
    for (const tiebreaker of tiebreakers) {
      let comparison = 0;
      
      switch (tiebreaker) {
        case 'goal_difference':
          comparison = b.goal_difference - a.goal_difference;
          break;
        case 'goals_for':
          comparison = b.goals_for - a.goals_for;
          break;
        case 'goals_against':
          comparison = a.goals_against - b.goals_against; // Less is better
          break;
        case 'head_to_head':
          // This would require head-to-head calculation - simplified for now
          comparison = 0;
          break;
      }
      
      if (comparison !== 0) return comparison;
    }
    
    // Final fallback: alphabetical by name
    return a.name.localeCompare(b.name);
  }).map((team, index) => ({
    ...team,
    position: index + 1
  }));
}

/**
 * Calculate form trend from recent results
 */
function calculateFormTrend(form: ('W' | 'D' | 'L')[]): 'improving' | 'declining' | 'stable' {
  if (form.length < 3) return 'stable';
  
  const recent = form.slice(0, Math.min(3, form.length));
  const older = form.slice(3, Math.min(6, form.length));
  
  if (older.length === 0) return 'stable';
  
  const recentPoints = recent.reduce((acc, result) => {
    return acc + (result === 'W' ? 3 : result === 'D' ? 1 : 0);
  }, 0) / recent.length;
  
  const olderPoints = older.reduce((acc, result) => {
    return acc + (result === 'W' ? 3 : result === 'D' ? 1 : 0);
  }, 0) / older.length;
  
  const difference = recentPoints - olderPoints;
  
  if (difference > 0.5) return 'improving';
  if (difference < -0.5) return 'declining';
  return 'stable';
}

/**
 * Get position changes from previous standings
 */
export function getPositionChanges(
  currentStandings: StandingsTeam[],
  previousStandings?: StandingsTeam[]
): StandingsTeam[] {
  if (!previousStandings) return currentStandings;
  
  const previousPositions: { [teamId: string]: number } = {};
  previousStandings.forEach(team => {
    previousPositions[team.id] = team.position;
  });
  
  return currentStandings.map(team => ({
    ...team,
    previous_position: previousPositions[team.id]
  }));
}

/**
 * Check if standings need update based on new match result
 */
export function shouldUpdateStandings(match: Match): boolean {
  return match.status === 'completed' && 
         match.home_score !== undefined && 
         match.away_score !== undefined;
}

/**
 * Simulate standings update when match result changes
 */
export function updateStandingsFromMatch(
  currentStandings: StandingsTeam[],
  match: Match,
  teams: Team[],
  config?: StandingsConfig
): StandingsTeam[] {
  if (!shouldUpdateStandings(match)) {
    return currentStandings;
  }

  // In a real application, you would:
  // 1. Fetch all matches for the league
  // 2. Apply the new match result
  // 3. Recalculate complete standings
  // 4. Compare with previous standings for position changes
  
  // For now, return recalculated standings
  return calculateStandings([match], teams, config);
}

/**
 * Get teams affected by standings update
 */
export function getAffectedTeams(match: Match): string[] {
  if (!shouldUpdateStandings(match)) return [];
  return [match.home_team_id, match.away_team_id];
}

/**
 * Format standings for display
 */
export function formatStandingsForDisplay(standings: StandingsTeam[]): {
  standings: StandingsTeam[];
  summary: {
    totalTeams: number;
    totalMatches: number;
    totalGoals: number;
    averageGoalsPerGame: number;
  };
} {
  const totalMatches = standings.reduce((acc, team) => acc + team.played, 0) / 2;
  const totalGoals = standings.reduce((acc, team) => acc + team.goals_for, 0);
  
  return {
    standings,
    summary: {
      totalTeams: standings.length,
      totalMatches: Math.floor(totalMatches),
      totalGoals,
      averageGoalsPerGame: totalMatches > 0 ? Number((totalGoals / totalMatches).toFixed(1)) : 0
    }
  };
}