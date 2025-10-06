/**
 * Database Types for MatchDay
 * 
 * Generated TypeScript types for the database schema.
 * These types ensure type safety across the application.
 */

export interface Database {
  public: {
    Tables: {
      /**
       * @deprecated team_leagues junction table is deprecated in favor of direct teams.league_id relationship.
       * This table is kept for potential rollback but all records are marked as inactive.
       * Use teams.league_id instead for team-league relationships.
       */
      team_leagues: {
        Row: {
          id: string;
          team_id: string;
          league_id: string;
          joined_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          league_id: string;
          joined_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          league_id?: string;
          joined_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          phone: string | null;
          date_of_birth: string | null;
          preferred_position: string | null;
          location: string | null;
          role: 'player' | 'captain' | 'admin' | 'league_admin' | 'app_admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          preferred_position?: string | null;
          location?: string | null;
          role?: 'player' | 'captain' | 'admin' | 'league_admin' | 'app_admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          preferred_position?: string | null;
          location?: string | null;
          role?: 'player' | 'captain' | 'admin' | 'league_admin' | 'app_admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sport_type: string;
          league_type: string;
          location: string | null;
          season_start: string | null;
          season_end: string | null;
          max_teams: number | null;
          entry_fee: number | null;
          created_by: string | null;
          is_active: boolean | null;
          is_public: boolean | null;
          auto_approve_teams: boolean | null;
          registration_deadline: string | null;
          published_at: string | null;
          featured: boolean | null;
          season: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sport_type: string;
          league_type: string;
          location?: string | null;
          season_start?: string | null;
          season_end?: string | null;
          max_teams?: number | null;
          entry_fee?: number | null;
          created_by?: string | null;
          is_active?: boolean | null;
          is_public?: boolean | null;
          season?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sport_type?: string;
          league_type?: string;
          location?: string | null;
          season_start?: string | null;
          season_end?: string | null;
          max_teams?: number | null;
          entry_fee?: number | null;
          created_by?: string | null;
          is_active?: boolean | null;
          is_public?: boolean | null;
          season?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          /** 
           * Direct reference to the league this team belongs to.
           * Required - each team must belong to exactly one league.
           */
          league_id: string;
          name: string;
          logo_url: string | null;
          team_color: string | null;
          captain_id: string | null;
          max_players: number | null;
          min_players: number | null;
          is_recruiting: boolean | null;
          team_bio: string | null;
          is_archived: boolean | null;
          previous_league_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          /** Required - team must be assigned to a league on creation */
          league_id: string;
          name: string;
          logo_url?: string | null;
          team_color?: string | null;
          captain_id?: string | null;
          max_players?: number | null;
          min_players?: number | null;
          is_recruiting?: boolean | null;
          team_bio?: string | null;
          is_archived?: boolean | null;
          previous_league_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          /** When updating, league_id can be changed but cannot be set to null */
          league_id?: string;
          name?: string;
          logo_url?: string | null;
          team_color?: string | null;
          captain_id?: string | null;
          max_players?: number | null;
          min_players?: number | null;
          is_recruiting?: boolean | null;
          team_bio?: string | null;
          is_archived?: boolean | null;
          previous_league_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          position: string | null;
          jersey_number: number | null;
          is_active: boolean | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          position?: string | null;
          jersey_number?: number | null;
          is_active?: boolean | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          position?: string | null;
          jersey_number?: number | null;
          is_active?: boolean | null;
          joined_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          scheduled_date: string;
          venue: string | null;
          match_day: number | null;
          status: string | null;
          home_score: number | null;
          away_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          scheduled_date: string;
          venue?: string | null;
          match_day?: number | null;
          status?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          home_team_id?: string;
          away_team_id?: string;
          scheduled_date?: string;
          venue?: string | null;
          match_day?: number | null;
          status?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      match_events: {
        Row: {
          id: string;
          match_id: string;
          team_id: string | null;
          player_id: string | null;
          event_type: string;
          event_time: number | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          team_id?: string | null;
          player_id?: string | null;
          event_type: string;
          event_time?: number | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          team_id?: string | null;
          player_id?: string | null;
          event_type?: string;
          event_time?: number | null;
          description?: string | null;
          created_at?: string;
        };
      };
      player_stats: {
        Row: {
          id: string;
          player_id: string;
          league_id: string;
          team_id: string;
          games_played: number | null;
          goals: number | null;
          assists: number | null;
          yellow_cards: number | null;
          red_cards: number | null;
          minutes_played: number | null;
          additional_stats: any | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          league_id: string;
          team_id: string;
          games_played?: number | null;
          goals?: number | null;
          assists?: number | null;
          yellow_cards?: number | null;
          red_cards?: number | null;
          minutes_played?: number | null;
          additional_stats?: any | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          league_id?: string;
          team_id?: string;
          games_played?: number | null;
          goals?: number | null;
          assists?: number | null;
          yellow_cards?: number | null;
          red_cards?: number | null;
          minutes_played?: number | null;
          additional_stats?: any | null;
          updated_at?: string;
        };
      };
      team_stats: {
        Row: {
          id: string;
          team_id: string;
          league_id: string;
          games_played: number | null;
          wins: number | null;
          draws: number | null;
          losses: number | null;
          goals_for: number | null;
          goals_against: number | null;
          points: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          league_id: string;
          games_played?: number | null;
          wins?: number | null;
          draws?: number | null;
          losses?: number | null;
          goals_for?: number | null;
          goals_against?: number | null;
          points?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          league_id?: string;
          games_played?: number | null;
          wins?: number | null;
          draws?: number | null;
          losses?: number | null;
          goals_for?: number | null;
          goals_against?: number | null;
          points?: number | null;
          updated_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          category: string;
          difficulty: string;
          requirements: any;
          points_value: number;
          is_active: boolean;
          is_repeatable: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          category: string;
          difficulty?: string;
          requirements: any;
          points_value?: number;
          is_active?: boolean;
          is_repeatable?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          category?: string;
          difficulty?: string;
          requirements?: any;
          points_value?: number;
          is_active?: boolean;
          is_repeatable?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          earned_at: string;
          context: any | null;
          league_id: string | null;
          match_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          earned_at?: string;
          context?: any | null;
          league_id?: string | null;
          match_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          earned_at?: string;
          context?: any | null;
          league_id?: string | null;
          match_id?: string | null;
        };
      };
      team_join_requests: {
        Row: {
          id: string;
          team_id: string;
          league_id: string;
          user_id: string;
          message: string | null;
          preferred_position: string | null;
          requested_jersey_number: number | null;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          response_message: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          league_id: string;
          user_id: string;
          message?: string | null;
          preferred_position?: string | null;
          requested_jersey_number?: number | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          response_message?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          league_id?: string;
          user_id?: string;
          message?: string | null;
          preferred_position?: string | null;
          requested_jersey_number?: number | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          response_message?: string | null;
          created_at?: string;
          expires_at?: string;
        };
      };
      app_configurations: {
        Row: {
          id: string;
          value: any;
          description: string | null;
          is_public: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id: string;
          value: any;
          description?: string | null;
          is_public?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          value?: any;
          description?: string | null;
          is_public?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
    };
    Views: {
      league_standings: {
        Row: {
          id: string;
          team_id: string;
          league_id: string;
          season_year: number;
          games_played: number;
          wins: number;
          draws: number;
          losses: number;
          goals_for: number;
          goals_against: number;
          points: number;
          clean_sheets: number;
          team_name: string;
          logo_url: string | null;
          team_color: string | null;
          league_name: string;
          sport_type: string;
          goal_difference: number;
          points_percentage: number;
          position: number;
        };
      };
      player_leaderboard: {
        Row: {
          id: string;
          player_id: string;
          league_id: string;
          team_id: string;
          season_year: number;
          games_played: number;
          games_started: number;
          goals: number;
          assists: number;
          yellow_cards: number;
          red_cards: number;
          minutes_played: number;
          shots_on_target: number;
          passes_completed: number;
          passes_attempted: number;
          tackles_won: number;
          display_name: string;
          avatar_url: string | null;
          preferred_position: string | null;
          team_name: string;
          team_logo: string | null;
          team_color: string | null;
          league_name: string;
          sport_type: string;
          goals_per_game: number;
          goal_contributions_per_game: number;
          goals_per_90_minutes: number;
          pass_accuracy: number;
        };
      };
      player_cross_league_stats: {
        Row: {
          player_id: string;
          display_name: string;
          avatar_url: string | null;
          preferred_position: string | null;
          season_year: number;
          leagues_played: number;
          teams_played: number;
          total_games_played: number;
          total_goals: number;
          total_assists: number;
          total_minutes_played: number;
          avg_goals_per_game: number;
          avg_contributions_per_game: number;
          best_goals_in_league: number;
          best_assists_in_league: number;
          goals_consistency: number | null;
        };
      };
      active_matches: {
        Row: {
          id: string;
          league_id: string;
          scheduled_date: string;
          venue: string | null;
          status: string;
          home_score: number;
          away_score: number;
          match_duration: number | null;
          league_name: string;
          sport_type: string;
          home_team_id: string;
          home_team_name: string;
          home_team_logo: string | null;
          home_team_color: string | null;
          away_team_id: string;
          away_team_name: string;
          away_team_logo: string | null;
          away_team_color: string | null;
          total_events: number;
          latest_event_type: string | null;
          latest_event_time: number | null;
        };
      };
    };
  };
}

// Utility types for common operations
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type League = Database['public']['Tables']['leagues']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type MatchEvent = Database['public']['Tables']['match_events']['Row'];
export type PlayerStats = Database['public']['Tables']['player_stats']['Row'];
export type TeamStats = Database['public']['Tables']['team_stats']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];
export type TeamJoinRequest = Database['public']['Tables']['team_join_requests']['Row'];
export type AppConfiguration = Database['public']['Tables']['app_configurations']['Row'];

// Insert types
export type InsertLeague = Database['public']['Tables']['leagues']['Insert'];
export type InsertTeam = Database['public']['Tables']['teams']['Insert'];
export type InsertMatch = Database['public']['Tables']['matches']['Insert'];

// Update types
export type UpdateLeague = Database['public']['Tables']['leagues']['Update'];
export type UpdateTeam = Database['public']['Tables']['teams']['Update'];
export type UpdateMatch = Database['public']['Tables']['matches']['Update'];
export type UpdateUserProfile = Database['public']['Tables']['user_profiles']['Update'];
export type UpdatePlayerStats = Database['public']['Tables']['player_stats']['Update'];

// View types
export type LeagueStanding = Database['public']['Views']['league_standings']['Row'];
export type PlayerLeaderboard = Database['public']['Views']['player_leaderboard']['Row'];
export type PlayerCrossLeagueStats = Database['public']['Views']['player_cross_league_stats']['Row'];
export type ActiveMatch = Database['public']['Views']['active_matches']['Row'];

// Enums for type safety
export enum SportType {
  FOOTBALL = 'football'
}

export enum LeagueType {
  COMPETITIVE = 'competitive',
  CASUAL = 'casual',
  TOURNAMENT = 'tournament',
  FRIENDLY = 'friendly'
}

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  COMPLETED = 'completed',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled'
}

export enum EventType {
  GOAL = 'goal',
  ASSIST = 'assist',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
  SUBSTITUTION = 'substitution',
  INJURY = 'injury',
  TIMEOUT = 'timeout'
}

export enum AchievementCategory {
  GOALS = 'goals',
  ASSISTS = 'assists',
  MATCHES = 'matches',
  TEAM_PLAY = 'team_play',
  CONSISTENCY = 'consistency',
  MILESTONES = 'milestones',
  LEADERSHIP = 'leadership'
}

export enum AchievementDifficulty {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum JoinRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}

// Complex types for forms and API responses
export interface PlayerProfile extends UserProfile {
  teams?: Array<{
    team: Team;
    league: League;
    position?: string;
    jersey_number?: number;
    is_active?: boolean;
  }>;
  stats?: PlayerStats[];
  achievements?: Array<{
    achievement: Achievement;
    earned_at: string;
    context?: any;
  }>;
}

export interface LeagueWithDetails extends League {
  teams?: Team[];
  matches?: Match[];
  creator?: UserProfile;
  stats?: {
    total_teams: number;
    total_players: number;
    total_matches: number;
    completed_matches: number;
  };
}

export interface MatchWithDetails extends Match {
  home_team: Team;
  away_team: Team;
  league: League;
  events?: MatchEvent[];
  players?: {
    home_players: UserProfile[];
    away_players: UserProfile[];
  };
}

// Form validation schemas (for use with react-hook-form + zod)
export interface CreateLeagueForm {
  name: string;
  description?: string;
  sport_type: SportType;
  league_type: LeagueType;
  location?: string;
  season_start?: string;
  season_end?: string;
  max_teams?: number;
  entry_fee?: number;
}

export interface CreateTeamForm {
  name: string;
  league_id?: string;  // Optional - teams can be created without a league
  sport: string;
  description?: string;
  max_players?: number;
  min_players?: number;
  location?: string;
  team_color?: string;
}

export interface JoinTeamForm {
  team_id: string;
  position?: string;
  jersey_number?: number;
}

export interface UpdateProfileForm {
  display_name: string;
  bio?: string;
  preferred_position?: string;
  location?: string;
  date_of_birth?: string;
}

// Team Invitation types
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Team League Request types
export type TeamLeagueRequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

// User Role types
export type UserRole = 'player' | 'captain' | 'admin' | 'league_admin' | 'app_admin';

export interface TeamInvitation {
  id: string;
  team_id: string;
  invited_by: string;
  invited_email: string;
  invited_user_id?: string;
  position?: string;
  jersey_number?: number;
  message?: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  responded_at?: string;
}

export interface TeamInvitationWithDetails extends TeamInvitation {
  team: {
    id: string;
    name: string;
    location?: string;
    team_color?: string;
    team_bio?: string;
    max_players?: number;
    captain?: {
      display_name?: string;
      email: string;
    };
  };
  invited_by_user: {
    display_name?: string;
    email: string;
  };
}

export interface SendInvitationForm {
  email: string;
  position?: string;
  jersey_number?: number;
  message?: string;
}

export interface InvitationResponseForm {
  action: 'accept' | 'decline';
}

// Team Leagues Junction Table
export interface TeamLeagues {
  id: string;
  team_id: string;
  league_id: string;
  joined_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Team League Request interfaces
export interface TeamLeagueRequest {
  id: string;
  team_id: string;
  league_id: string;
  requested_by: string;
  message?: string;
  status: TeamLeagueRequestStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_message?: string;
  created_at: string;
  expires_at: string;
}

export interface TeamLeagueRequestWithDetails extends TeamLeagueRequest {
  teams: {
    id: string;
    name: string;
    team_color?: string;
    team_bio?: string;
    max_players?: number;
    min_players?: number;
    captain_id: string;
    member_count: number;
  };
  leagues: {
    id: string;
    name: string;
    description?: string;
    location?: string;
    sport_type: string;
    league_type: string;
    entry_fee?: number;
  };
  requested_by_user: {
    email: string;
    user_profiles?: {
      display_name?: string;
      full_name?: string;
    };
  };
  reviewed_by_user?: {
    email: string;
    user_profiles?: {
      display_name?: string;
      full_name?: string;
    };
  };
}

export interface CreateLeagueRequestForm {
  league_id: string;
  message?: string;
}

export interface LeagueRequestResponseForm {
  action: 'approve' | 'reject';
  review_message?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Real-time types for live features
export interface LiveMatchUpdate {
  match_id: string;
  event_type: EventType;
  event_time: number;
  player_id?: string;
  team_id?: string;
  description?: string;
  score_update?: {
    home_score: number;
    away_score: number;
  };
}

export interface PlayerStatsSummary {
  player_id: string;
  total_goals: number;
  total_assists: number;
  total_matches: number;
  total_minutes: number;
  goals_per_game: number;
  current_league_stats?: PlayerStats;
}

// Cross-league comparison types
export interface CrossLeaguePlayerStats {
  player_id: string;
  player_name: string;
  leagues: Array<{
    league: League;
    stats: PlayerStats;
    team: Team;
  }>;
  overall_stats: PlayerStatsSummary;
}

// Service Response Types
export interface ServiceResponse<T = any> {
  data: T | null;
  error: ServiceError | null;
  success: boolean;
  message?: string;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  operation?: string;
}

export interface PaginatedServiceResponse<T = any> extends ServiceResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Player Service Types
export interface PlayerProfileExtended extends UserProfile {
  teams: Array<{
    team: Team & { league: League };
    membership: TeamMember;
  }>;
  achievements: Array<{
    achievement: Achievement;
    userAchievement: UserAchievement;
  }>;
  crossLeagueStats: PlayerCrossLeagueStats | null;
  globalRankings: {
    goals: { rank: number; total: number; percentile: number } | null;
    assists: { rank: number; total: number; percentile: number } | null;
    matches: { rank: number; total: number; percentile: number } | null;
  };
}

// League Service Types
export interface LeagueDiscovery extends League {
  teams: Team[];
  teamCount: number;
  playerCount: number;
  availableSpots: number;
  joinRequests?: TeamJoinRequest[];
  isUserMember: boolean;
  compatibilityScore?: number;
}

export interface LeagueFilters {
  sportType?: SportType;
  leagueType?: LeagueType;
  location?: string;
  maxDistance?: number;
  entryFeeMax?: number;
  hasAvailableSpots?: boolean;
  seasonActive?: boolean;
  search?: string;
}

// Match Service Types
export interface MatchWithDetails extends Match {
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  events: MatchEvent[];
  homeTeamPlayers: UserProfile[];
  awayTeamPlayers: UserProfile[];
  playerStats?: Array<{
    player: UserProfile;
    stats: {
      goals: number;
      assists: number;
      cards: number;
      minutesPlayed: number;
    };
  }>;
}

export interface LiveMatchData {
  match: MatchWithDetails;
  recentEvents: MatchEvent[];
  liveStats: {
    homeTeamStats: { [key: string]: number };
    awayTeamStats: { [key: string]: number };
    playerStats: { [playerId: string]: any };
  };
}

// Achievement Service Types
export interface PlayerAchievementProgress {
  achievement: Achievement;
  currentProgress: number;
  targetValue: number;
  progressPercentage: number;
  isCompleted: boolean;
  estimatedCompletion?: string;
  nextMilestone?: number;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  earnedAt?: string;
  context?: any;
  rarity: {
    totalEarned: number;
    totalPlayers: number;
    rarityPercentage: number;
  };
}

// Stats Service Types
export interface PerformanceTrend {
  period: string; // YYYY-MM or YYYY-WW
  goals: number;
  assists: number;
  matches: number;
  performance: number;
}

export interface GlobalRanking {
  playerId: string;
  displayName: string;
  avatarUrl?: string;
  rank: number;
  statValue: number;
  trend: 'up' | 'down' | 'stable';
  previousRank?: number;
}

export interface LeagueComparison {
  league: League;
  playerStats: PlayerStats;
  teamRank: number;
  leagueRank: number;
  performance: {
    goalsPerGame: number;
    assistsPerGame: number;
    winRate: number;
    consistency: number;
  };
}

// Real-time Subscription Types
export interface RealtimeSubscriptionOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
  tags?: string[];
  revalidateOnBackground?: boolean;
}

// One-Team-One-League Architecture Types
// =====================================

/**
 * Team with direct league relationship (simplified from junction table)
 */
export interface TeamWithLeague extends Team {
  league: League;
}

/**
 * League with directly associated teams (no junction table)
 */
export interface LeagueWithTeams extends League {
  teams: Team[];
  teamCount: number;
}

/**
 * Migration helper types for team league operations
 */
export interface TeamLeagueOperation {
  teamId: string;
  currentLeagueId?: string;
  newLeagueId: string;
  operationType: 'assign' | 'transfer' | 'create_and_assign';
}

/**
 * Simplified team creation for one-league-per-team model
 */
export interface CreateTeamRequest {
  name: string;
  leagueId: string; // Required - team must join a league immediately
  captainId: string;
  teamColor?: string;
  teamBio?: string;
  maxPlayers?: number;
  minPlayers?: number;
  isRecruiting?: boolean;
}

/**
 * Team league request with simplified assignment
 */
export interface SimpleTeamLeagueRequest {
  id: string;
  teamId: string;
  leagueId: string;
  requestedBy: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  responseMessage?: string;
}

/**
 * Direct team league assignment result
 */
export interface TeamLeagueAssignmentResult {
  success: boolean;
  teamId: string;
  leagueId: string;
  previousLeagueId?: string;
  message: string;
  error?: string;
}

/**
 * League team statistics using direct relationship
 */
export interface LeagueTeamStats {
  leagueId: string;
  leagueName: string;
  totalTeams: number;
  totalPlayers: number;
  averagePlayersPerTeam: number;
  recruitingTeams: number;
  archivedTeams: number;
}

/**
 * @deprecated Legacy TeamLeagueRequestWithDetails - use SimpleTeamLeagueRequest instead
 * Keeping for backward compatibility during migration
 */
export interface TeamLeagueRequestWithDetails {
  id: string;
  teamId: string;
  leagueId: string;
  requestedBy: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  responseMessage?: string;
  team: Team;
  league: League;
  requested_by_user: {
    email: string;
    full_name?: string;
    display_name?: string;
  };
}

// ===================================================================
// SEASON MANAGEMENT TYPES
// ===================================================================

export type TournamentFormat = 'league' | 'knockout' | 'league_with_playoffs';
export type SeasonStatus = 'draft' | 'registration' | 'fixtures_pending' | 'fixtures_generated' | 'active' | 'playoffs' | 'completed' | 'suspended' | 'cancelled';
export type FixtureGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'needs_regeneration';

/**
 * Season entity
 */
export interface Season {
  id: string;
  name: string;
  league_id: string;
  season_year: number;
  display_name?: string;
  status: SeasonStatus;
  tournament_format: TournamentFormat;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  match_frequency: number;
  preferred_match_time: string;
  min_teams: number;
  max_teams?: number;
  registered_teams_count: number;
  rounds: number;
  points_for_win: number;
  points_for_draw: number;
  points_for_loss: number;
  knockout_legs: number;
  third_place_playoff: boolean;
  playoff_teams_count: number;
  playoff_format: string;
  fixtures_status: FixtureGenerationStatus;
  fixtures_generated_at?: string;
  fixtures_generation_error?: string;
  total_matches_planned: number;
  allow_draws: boolean;
  home_away_balance: boolean;
  venue_conflicts_check: boolean;
  bye_week_handling: string;
  rules: Record<string, any>;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

/**
 * Season team registration
 */
export interface SeasonTeam {
  id: string;
  season_id: string;
  team_id: string;
  registered_at: string;
  registered_by?: string;
  preferred_home_venue?: string;
  unavailable_dates: string[];
  preferred_match_times?: string[];
  seeding?: number;
  group_assignment?: string;
  status: 'pending' | 'accepted' | 'declined';
  confirmed_at?: string;
  withdrawal_reason?: string;
  notes?: string;
  metadata: Record<string, any>;
}

/**
 * Fixture entity
 */
export interface Fixture {
  id: string;
  season_id: string;
  match_id?: string;
  round_number: number;
  match_day?: number;
  group_name?: string;
  leg_number: number;
  scheduled_date?: string;
  venue?: string;
  fixture_type: string;
  generation_batch?: string;
  depends_on_fixtures?: string[];
  is_generated_fixture: boolean;
  generation_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Season statistics cache
 */
export interface SeasonStats {
  id: string;
  season_id: string;
  total_matches_scheduled: number;
  total_matches_played: number;
  total_matches_cancelled: number;
  total_goals: number;
  total_cards_yellow: number;
  total_cards_red: number;
  current_matchday: number;
  current_round: number;
  matches_remaining: number;
  average_goals_per_match?: number;
  highest_scoring_match_goals?: number;
  most_goals_in_matchday?: number;
  total_attendance: number;
  average_attendance?: number;
  last_updated: string;
  auto_refresh: boolean;
}

/**
 * Fixture generation log
 */
export interface FixtureGenerationLog {
  id: string;
  season_id: string;
  generation_type: string;
  status: FixtureGenerationStatus;
  parameters: Record<string, any>;
  fixtures_created: number;
  fixtures_updated: number;
  fixtures_deleted: number;
  error_message?: string;
  error_details?: Record<string, any>;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  triggered_by?: string;
  metadata: Record<string, any>;
}