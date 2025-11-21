export interface TeamInfo {
  id: string;
  name: string;
  team_color?: string;
  logo_url?: string;
}

export interface LeagueInfo {
  id: string;
  name: string;
}

export interface SeasonInfo {
  id: string;
  name: string;
  leagues: LeagueInfo;
}

export interface MatchDetails {
  id: string;
  match_date: string;
  match_time?: string;
  venue?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  home_team_id: string;
  away_team_id: string;
  home_score?: number;
  away_score?: number;
  home_team: TeamInfo;
  away_team: TeamInfo;
  seasons?: SeasonInfo;
  home_lineup?: any;
  away_lineup?: any;
  man_of_match_id?: string;
}

export interface PlayerInfo {
  id: string;
  display_name?: string;
  full_name?: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'own_goal';
  event_time: number;
  description?: string;
  player: PlayerInfo;
  team: TeamInfo;
  assist_player_id?: string;
  assist_player?: PlayerInfo;
}

export interface PlayerInLineup {
  id: string;
  user_id: string;
  position?: string;
  jersey_number?: number;
  is_starter: boolean;
  is_captain: boolean;
  player_name: string;
}

export interface TeamLineup {
  team_id: string;
  team_name: string;
  starters: PlayerInLineup[];
  substitutes: PlayerInLineup[];
}

export interface MatchData {
  match: MatchDetails | null;
  events: MatchEvent[];
  homeLineup: TeamLineup | null;
  awayLineup: TeamLineup | null;
  loading: boolean;
  error: string | null;
}
