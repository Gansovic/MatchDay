export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "13.0.4";
    };
    public: {
        Tables: {
            league_standings: {
                Row: {
                    draws: number | null;
                    goal_difference: number | null;
                    goals_against: number | null;
                    goals_for: number | null;
                    id: string;
                    last_updated: string | null;
                    league_id: string;
                    losses: number | null;
                    matches_played: number | null;
                    points: number | null;
                    position: number | null;
                    team_id: string;
                    wins: number | null;
                };
                Insert: {
                    draws?: number | null;
                    goal_difference?: number | null;
                    goals_against?: number | null;
                    goals_for?: number | null;
                    id?: string;
                    last_updated?: string | null;
                    league_id: string;
                    losses?: number | null;
                    matches_played?: number | null;
                    points?: number | null;
                    position?: number | null;
                    team_id: string;
                    wins?: number | null;
                };
                Update: {
                    draws?: number | null;
                    goal_difference?: number | null;
                    goals_against?: number | null;
                    goals_for?: number | null;
                    id?: string;
                    last_updated?: string | null;
                    league_id?: string;
                    losses?: number | null;
                    matches_played?: number | null;
                    points?: number | null;
                    position?: number | null;
                    team_id?: string;
                    wins?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "league_standings_league_id_fkey";
                        columns: ["league_id"];
                        isOneToOne: false;
                        referencedRelation: "leagues";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "league_standings_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    }
                ];
            };
            leagues: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    description: string | null;
                    entry_fee: number | null;
                    id: string;
                    is_active: boolean | null;
                    is_public: boolean | null;
                    league_type: string;
                    location: string | null;
                    logo_media_id: string | null;
                    max_teams: number | null;
                    name: string;
                    season: string;
                    season_end: string | null;
                    season_start: string | null;
                    sponsor_media_id: string | null;
                    sport_type: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    description?: string | null;
                    entry_fee?: number | null;
                    id?: string;
                    is_active?: boolean | null;
                    is_public?: boolean | null;
                    league_type?: string;
                    location?: string | null;
                    logo_media_id?: string | null;
                    max_teams?: number | null;
                    name: string;
                    season?: string;
                    season_end?: string | null;
                    season_start?: string | null;
                    sponsor_media_id?: string | null;
                    sport_type?: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    description?: string | null;
                    entry_fee?: number | null;
                    id?: string;
                    is_active?: boolean | null;
                    is_public?: boolean | null;
                    league_type?: string;
                    location?: string | null;
                    logo_media_id?: string | null;
                    max_teams?: number | null;
                    name?: string;
                    season?: string;
                    season_end?: string | null;
                    season_start?: string | null;
                    sponsor_media_id?: string | null;
                    sport_type?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "leagues_created_by_fkey";
                        columns: ["created_by"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "leagues_created_by_fkey";
                        columns: ["created_by"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "leagues_logo_media_id_fkey";
                        columns: ["logo_media_id"];
                        isOneToOne: false;
                        referencedRelation: "media";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "leagues_sponsor_media_id_fkey";
                        columns: ["sponsor_media_id"];
                        isOneToOne: false;
                        referencedRelation: "media";
                        referencedColumns: ["id"];
                    }
                ];
            };
            match_events: {
                Row: {
                    assist_player_id: string | null;
                    created_at: string | null;
                    description: string | null;
                    event_time: number | null;
                    event_type: string;
                    id: string;
                    match_id: string;
                    player_id: string | null;
                    team_id: string;
                    updated_at: string | null;
                };
                Insert: {
                    assist_player_id?: string | null;
                    created_at?: string | null;
                    description?: string | null;
                    event_time?: number | null;
                    event_type: string;
                    id?: string;
                    match_id: string;
                    player_id?: string | null;
                    team_id: string;
                    updated_at?: string | null;
                };
                Update: {
                    assist_player_id?: string | null;
                    created_at?: string | null;
                    description?: string | null;
                    event_time?: number | null;
                    event_type?: string;
                    id?: string;
                    match_id?: string;
                    player_id?: string | null;
                    team_id?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "match_events_assist_player_id_fkey";
                        columns: ["assist_player_id"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "match_events_assist_player_id_fkey";
                        columns: ["assist_player_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "match_events_match_id_fkey";
                        columns: ["match_id"];
                        isOneToOne: false;
                        referencedRelation: "matches";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "match_events_player_id_fkey";
                        columns: ["player_id"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "match_events_player_id_fkey";
                        columns: ["player_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "match_events_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    }
                ];
            };
            matches: {
                Row: {
                    away_lineup: Json | null;
                    away_score: number | null;
                    away_team_id: string;
                    court_number: number | null;
                    created_at: string;
                    home_lineup: Json | null;
                    home_score: number | null;
                    home_team_id: string;
                    id: string;
                    league_id: string | null;
                    man_of_match_id: string | null;
                    match_date: string;
                    match_time: string | null;
                    matchday_number: number | null;
                    notes: string | null;
                    season_id: string | null;
                    status: Database["public"]["Enums"]["match_status"] | null;
                    updated_at: string;
                    venue: string | null;
                };
                Insert: {
                    away_lineup?: Json | null;
                    away_score?: number | null;
                    away_team_id: string;
                    court_number?: number | null;
                    created_at?: string;
                    home_lineup?: Json | null;
                    home_score?: number | null;
                    home_team_id: string;
                    id?: string;
                    league_id?: string | null;
                    man_of_match_id?: string | null;
                    match_date: string;
                    match_time?: string | null;
                    matchday_number?: number | null;
                    notes?: string | null;
                    season_id?: string | null;
                    status?: Database["public"]["Enums"]["match_status"] | null;
                    updated_at?: string;
                    venue?: string | null;
                };
                Update: {
                    away_lineup?: Json | null;
                    away_score?: number | null;
                    away_team_id?: string;
                    court_number?: number | null;
                    created_at?: string;
                    home_lineup?: Json | null;
                    home_score?: number | null;
                    home_team_id?: string;
                    id?: string;
                    league_id?: string | null;
                    man_of_match_id?: string | null;
                    match_date?: string;
                    match_time?: string | null;
                    matchday_number?: number | null;
                    notes?: string | null;
                    season_id?: string | null;
                    status?: Database["public"]["Enums"]["match_status"] | null;
                    updated_at?: string;
                    venue?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "matches_away_team_id_fkey";
                        columns: ["away_team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "matches_home_team_id_fkey";
                        columns: ["home_team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "matches_league_id_fkey";
                        columns: ["league_id"];
                        isOneToOne: false;
                        referencedRelation: "leagues";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "matches_man_of_match_id_fkey";
                        columns: ["man_of_match_id"];
                        isOneToOne: false;
                        referencedRelation: "user_profiles";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "matches_season_id_fkey";
                        columns: ["season_id"];
                        isOneToOne: false;
                        referencedRelation: "seasons";
                        referencedColumns: ["id"];
                    }
                ];
            };
            media: {
                Row: {
                    context_type: string;
                    created_at: string | null;
                    description: string | null;
                    file_size: number;
                    filename: string;
                    id: string;
                    is_public: boolean | null;
                    league_id: string | null;
                    media_type: string;
                    metadata: Json | null;
                    mime_type: string;
                    original_filename: string;
                    season_id: string | null;
                    storage_path: string;
                    tags: string[] | null;
                    team_id: string | null;
                    updated_at: string | null;
                    uploaded_by: string | null;
                };
                Insert: {
                    context_type: string;
                    created_at?: string | null;
                    description?: string | null;
                    file_size: number;
                    filename: string;
                    id?: string;
                    is_public?: boolean | null;
                    league_id?: string | null;
                    media_type: string;
                    metadata?: Json | null;
                    mime_type: string;
                    original_filename: string;
                    season_id?: string | null;
                    storage_path: string;
                    tags?: string[] | null;
                    team_id?: string | null;
                    updated_at?: string | null;
                    uploaded_by?: string | null;
                };
                Update: {
                    context_type?: string;
                    created_at?: string | null;
                    description?: string | null;
                    file_size?: number;
                    filename?: string;
                    id?: string;
                    is_public?: boolean | null;
                    league_id?: string | null;
                    media_type?: string;
                    metadata?: Json | null;
                    mime_type?: string;
                    original_filename?: string;
                    season_id?: string | null;
                    storage_path?: string;
                    tags?: string[] | null;
                    team_id?: string | null;
                    updated_at?: string | null;
                    uploaded_by?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "media_league_id_fkey";
                        columns: ["league_id"];
                        isOneToOne: false;
                        referencedRelation: "leagues";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "media_season_id_fkey";
                        columns: ["season_id"];
                        isOneToOne: false;
                        referencedRelation: "seasons";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "media_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    }
                ];
            };
            player_leaderboard: {
                Row: {
                    appearances: number | null;
                    assists: number | null;
                    goals: number | null;
                    id: string;
                    last_updated: string | null;
                    league_id: string | null;
                    red_cards: number | null;
                    team_id: string | null;
                    user_id: string;
                    yellow_cards: number | null;
                };
                Insert: {
                    appearances?: number | null;
                    assists?: number | null;
                    goals?: number | null;
                    id?: string;
                    last_updated?: string | null;
                    league_id?: string | null;
                    red_cards?: number | null;
                    team_id?: string | null;
                    user_id: string;
                    yellow_cards?: number | null;
                };
                Update: {
                    appearances?: number | null;
                    assists?: number | null;
                    goals?: number | null;
                    id?: string;
                    last_updated?: string | null;
                    league_id?: string | null;
                    red_cards?: number | null;
                    team_id?: string | null;
                    user_id?: string;
                    yellow_cards?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "player_leaderboard_league_id_fkey";
                        columns: ["league_id"];
                        isOneToOne: false;
                        referencedRelation: "leagues";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "player_leaderboard_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "player_leaderboard_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "player_leaderboard_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            player_match_stats: {
                Row: {
                    assists: number;
                    created_at: string;
                    goals: number;
                    id: string;
                    match_id: string;
                    red_cards: number;
                    season_id: string;
                    team_id: string;
                    updated_at: string;
                    user_id: string;
                    yellow_cards: number;
                };
                Insert: {
                    assists?: number;
                    created_at?: string;
                    goals?: number;
                    id?: string;
                    match_id: string;
                    red_cards?: number;
                    season_id: string;
                    team_id: string;
                    updated_at?: string;
                    user_id: string;
                    yellow_cards?: number;
                };
                Update: {
                    assists?: number;
                    created_at?: string;
                    goals?: number;
                    id?: string;
                    match_id?: string;
                    red_cards?: number;
                    season_id?: string;
                    team_id?: string;
                    updated_at?: string;
                    user_id?: string;
                    yellow_cards?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: "player_match_stats_match_id_fkey";
                        columns: ["match_id"];
                        isOneToOne: false;
                        referencedRelation: "matches";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "player_match_stats_season_id_fkey";
                        columns: ["season_id"];
                        isOneToOne: false;
                        referencedRelation: "seasons";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "player_match_stats_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    }
                ];
            };
            player_stats: {
                Row: {
                    assists: number | null;
                    created_at: string | null;
                    goals: number | null;
                    id: string;
                    match_id: string | null;
                    minutes_played: number | null;
                    season_id: string | null;
                    team_id: string;
                    user_id: string;
                };
                Insert: {
                    assists?: number | null;
                    created_at?: string | null;
                    goals?: number | null;
                    id?: string;
                    match_id?: string | null;
                    minutes_played?: number | null;
                    season_id?: string | null;
                    team_id: string;
                    user_id: string;
                };
                Update: {
                    assists?: number | null;
                    created_at?: string | null;
                    goals?: number | null;
                    id?: string;
                    match_id?: string | null;
                    minutes_played?: number | null;
                    season_id?: string | null;
                    team_id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "player_stats_match_id_fkey";
                        columns: ["match_id"];
                        isOneToOne: false;
                        referencedRelation: "matches";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "player_stats_season_id_fkey";
                        columns: ["season_id"];
                        isOneToOne: false;
                        referencedRelation: "seasons";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "player_stats_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "player_stats_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "player_stats_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            season_join_requests: {
                Row: {
                    created_at: string | null;
                    id: string;
                    message: string | null;
                    responded_at: string | null;
                    responded_by: string | null;
                    response_message: string | null;
                    season_id: string;
                    status: string | null;
                    team_id: string;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    message?: string | null;
                    responded_at?: string | null;
                    responded_by?: string | null;
                    response_message?: string | null;
                    season_id: string;
                    status?: string | null;
                    team_id: string;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    message?: string | null;
                    responded_at?: string | null;
                    responded_by?: string | null;
                    response_message?: string | null;
                    season_id?: string;
                    status?: string | null;
                    team_id?: string;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "season_join_requests_responded_by_fkey";
                        columns: ["responded_by"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "season_join_requests_responded_by_fkey";
                        columns: ["responded_by"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "season_join_requests_season_id_fkey";
                        columns: ["season_id"];
                        isOneToOne: false;
                        referencedRelation: "seasons";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "season_join_requests_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "season_join_requests_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "season_join_requests_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            season_standings: {
                Row: {
                    created_at: string | null;
                    draws: number | null;
                    goal_difference: number | null;
                    goals_against: number | null;
                    goals_for: number | null;
                    id: string;
                    losses: number | null;
                    matches_played: number | null;
                    points: number | null;
                    position: number | null;
                    season_id: string;
                    team_id: string;
                    updated_at: string | null;
                    wins: number | null;
                };
                Insert: {
                    created_at?: string | null;
                    draws?: number | null;
                    goal_difference?: number | null;
                    goals_against?: number | null;
                    goals_for?: number | null;
                    id?: string;
                    losses?: number | null;
                    matches_played?: number | null;
                    points?: number | null;
                    position?: number | null;
                    season_id: string;
                    team_id: string;
                    updated_at?: string | null;
                    wins?: number | null;
                };
                Update: {
                    created_at?: string | null;
                    draws?: number | null;
                    goal_difference?: number | null;
                    goals_against?: number | null;
                    goals_for?: number | null;
                    id?: string;
                    losses?: number | null;
                    matches_played?: number | null;
                    points?: number | null;
                    position?: number | null;
                    season_id?: string;
                    team_id?: string;
                    updated_at?: string | null;
                    wins?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "season_standings_season_id_fkey";
                        columns: ["season_id"];
                        isOneToOne: false;
                        referencedRelation: "seasons";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "season_standings_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    }
                ];
            };
            season_teams: {
                Row: {
                    created_at: string | null;
                    id: string;
                    registration_date: string | null;
                    season_id: string;
                    status: string | null;
                    team_id: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    registration_date?: string | null;
                    season_id: string;
                    status?: string | null;
                    team_id: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    registration_date?: string | null;
                    season_id?: string;
                    status?: string | null;
                    team_id?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "season_teams_season_id_fkey";
                        columns: ["season_id"];
                        isOneToOne: false;
                        referencedRelation: "seasons";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "season_teams_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    }
                ];
            };
            seasons: {
                Row: {
                    allow_draws: boolean | null;
                    courts_available: number | null;
                    created_at: string | null;
                    created_by: string | null;
                    description: string | null;
                    display_name: string;
                    end_date: string;
                    fixtures_generated_at: string | null;
                    fixtures_status: string | null;
                    games_per_court: number | null;
                    home_away_balance: boolean | null;
                    id: string;
                    is_active: boolean | null;
                    is_current: boolean | null;
                    league_id: string;
                    match_day: string | null;
                    match_end_time: string | null;
                    match_frequency: number | null;
                    match_start_time: string | null;
                    max_teams: number | null;
                    metadata: Json | null;
                    min_teams: number | null;
                    name: string;
                    points_for_draw: number | null;
                    points_for_loss: number | null;
                    points_for_win: number | null;
                    preferred_match_time: string | null;
                    registration_deadline: string | null;
                    registration_end: string | null;
                    registration_start: string | null;
                    rest_weeks_between_matches: number | null;
                    rounds: number | null;
                    rules: Json | null;
                    season_year: number;
                    settings: Json | null;
                    start_date: string;
                    status: string | null;
                    total_matches_planned: number | null;
                    tournament_format: string | null;
                    updated_at: string | null;
                    updated_by: string | null;
                };
                Insert: {
                    allow_draws?: boolean | null;
                    courts_available?: number | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    display_name: string;
                    end_date: string;
                    fixtures_generated_at?: string | null;
                    fixtures_status?: string | null;
                    games_per_court?: number | null;
                    home_away_balance?: boolean | null;
                    id?: string;
                    is_active?: boolean | null;
                    is_current?: boolean | null;
                    league_id: string;
                    match_day?: string | null;
                    match_end_time?: string | null;
                    match_frequency?: number | null;
                    match_start_time?: string | null;
                    max_teams?: number | null;
                    metadata?: Json | null;
                    min_teams?: number | null;
                    name: string;
                    points_for_draw?: number | null;
                    points_for_loss?: number | null;
                    points_for_win?: number | null;
                    preferred_match_time?: string | null;
                    registration_deadline?: string | null;
                    registration_end?: string | null;
                    registration_start?: string | null;
                    rest_weeks_between_matches?: number | null;
                    rounds?: number | null;
                    rules?: Json | null;
                    season_year: number;
                    settings?: Json | null;
                    start_date: string;
                    status?: string | null;
                    total_matches_planned?: number | null;
                    tournament_format?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
                Update: {
                    allow_draws?: boolean | null;
                    courts_available?: number | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    display_name?: string;
                    end_date?: string;
                    fixtures_generated_at?: string | null;
                    fixtures_status?: string | null;
                    games_per_court?: number | null;
                    home_away_balance?: boolean | null;
                    id?: string;
                    is_active?: boolean | null;
                    is_current?: boolean | null;
                    league_id?: string;
                    match_day?: string | null;
                    match_end_time?: string | null;
                    match_frequency?: number | null;
                    match_start_time?: string | null;
                    max_teams?: number | null;
                    metadata?: Json | null;
                    min_teams?: number | null;
                    name?: string;
                    points_for_draw?: number | null;
                    points_for_loss?: number | null;
                    points_for_win?: number | null;
                    preferred_match_time?: string | null;
                    registration_deadline?: string | null;
                    registration_end?: string | null;
                    registration_start?: string | null;
                    rest_weeks_between_matches?: number | null;
                    rounds?: number | null;
                    rules?: Json | null;
                    season_year?: number;
                    settings?: Json | null;
                    start_date?: string;
                    status?: string | null;
                    total_matches_planned?: number | null;
                    tournament_format?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "seasons_league_id_fkey";
                        columns: ["league_id"];
                        isOneToOne: false;
                        referencedRelation: "leagues";
                        referencedColumns: ["id"];
                    }
                ];
            };
            team_invitations: {
                Row: {
                    created_at: string;
                    email: string;
                    expires_at: string | null;
                    id: string;
                    invited_by: string;
                    jersey_number: number | null;
                    message: string | null;
                    position: string | null;
                    responded_at: string | null;
                    status: Database["public"]["Enums"]["invitation_status"] | null;
                    team_id: string;
                    token: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string;
                    email: string;
                    expires_at?: string | null;
                    id?: string;
                    invited_by: string;
                    jersey_number?: number | null;
                    message?: string | null;
                    position?: string | null;
                    responded_at?: string | null;
                    status?: Database["public"]["Enums"]["invitation_status"] | null;
                    team_id: string;
                    token?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string;
                    email?: string;
                    expires_at?: string | null;
                    id?: string;
                    invited_by?: string;
                    jersey_number?: number | null;
                    message?: string | null;
                    position?: string | null;
                    responded_at?: string | null;
                    status?: Database["public"]["Enums"]["invitation_status"] | null;
                    team_id?: string;
                    token?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "team_invitations_invited_by_fkey";
                        columns: ["invited_by"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "team_invitations_invited_by_fkey";
                        columns: ["invited_by"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "team_invitations_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "team_invitations_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "team_invitations_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            team_members: {
                Row: {
                    id: string;
                    is_active: boolean | null;
                    jersey_number: number | null;
                    joined_at: string;
                    position: string | null;
                    team_id: string;
                    user_id: string;
                };
                Insert: {
                    id?: string;
                    is_active?: boolean | null;
                    jersey_number?: number | null;
                    joined_at?: string;
                    position?: string | null;
                    team_id: string;
                    user_id: string;
                };
                Update: {
                    id?: string;
                    is_active?: boolean | null;
                    jersey_number?: number | null;
                    joined_at?: string;
                    position?: string | null;
                    team_id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "team_members_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "team_members_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "team_members_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            team_stats: {
                Row: {
                    created_at: string;
                    draws: number | null;
                    games_played: number | null;
                    goals_against: number | null;
                    goals_for: number | null;
                    id: string;
                    league_id: string | null;
                    losses: number | null;
                    points: number | null;
                    position: number | null;
                    season_id: string | null;
                    season_year: number | null;
                    team_id: string;
                    updated_at: string;
                    wins: number | null;
                };
                Insert: {
                    created_at?: string;
                    draws?: number | null;
                    games_played?: number | null;
                    goals_against?: number | null;
                    goals_for?: number | null;
                    id?: string;
                    league_id?: string | null;
                    losses?: number | null;
                    points?: number | null;
                    position?: number | null;
                    season_id?: string | null;
                    season_year?: number | null;
                    team_id: string;
                    updated_at?: string;
                    wins?: number | null;
                };
                Update: {
                    created_at?: string;
                    draws?: number | null;
                    games_played?: number | null;
                    goals_against?: number | null;
                    goals_for?: number | null;
                    id?: string;
                    league_id?: string | null;
                    losses?: number | null;
                    points?: number | null;
                    position?: number | null;
                    season_id?: string | null;
                    season_year?: number | null;
                    team_id?: string;
                    updated_at?: string;
                    wins?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "team_stats_league_id_fkey";
                        columns: ["league_id"];
                        isOneToOne: false;
                        referencedRelation: "leagues";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "team_stats_season_id_fkey";
                        columns: ["season_id"];
                        isOneToOne: false;
                        referencedRelation: "seasons";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "team_stats_team_id_fkey";
                        columns: ["team_id"];
                        isOneToOne: false;
                        referencedRelation: "teams";
                        referencedColumns: ["id"];
                    }
                ];
            };
            teams: {
                Row: {
                    captain_id: string | null;
                    created_at: string;
                    description: string | null;
                    founded_date: string | null;
                    home_ground: string | null;
                    id: string;
                    is_active: boolean | null;
                    is_archived: boolean | null;
                    is_recruiting: boolean | null;
                    league_id: string | null;
                    logo_media_id: string | null;
                    logo_url: string | null;
                    max_players: number;
                    min_players: number | null;
                    name: string;
                    previous_league_name: string | null;
                    team_bio: string | null;
                    team_color: string;
                    updated_at: string;
                };
                Insert: {
                    captain_id?: string | null;
                    created_at?: string;
                    description?: string | null;
                    founded_date?: string | null;
                    home_ground?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    is_archived?: boolean | null;
                    is_recruiting?: boolean | null;
                    league_id?: string | null;
                    logo_media_id?: string | null;
                    logo_url?: string | null;
                    max_players?: number;
                    min_players?: number | null;
                    name: string;
                    previous_league_name?: string | null;
                    team_bio?: string | null;
                    team_color?: string;
                    updated_at?: string;
                };
                Update: {
                    captain_id?: string | null;
                    created_at?: string;
                    description?: string | null;
                    founded_date?: string | null;
                    home_ground?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    is_archived?: boolean | null;
                    is_recruiting?: boolean | null;
                    league_id?: string | null;
                    logo_media_id?: string | null;
                    logo_url?: string | null;
                    max_players?: number;
                    min_players?: number | null;
                    name?: string;
                    previous_league_name?: string | null;
                    team_bio?: string | null;
                    team_color?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "teams_captain_id_fkey";
                        columns: ["captain_id"];
                        isOneToOne: false;
                        referencedRelation: "user_dashboard_stats";
                        referencedColumns: ["user_id"];
                    },
                    {
                        foreignKeyName: "teams_captain_id_fkey";
                        columns: ["captain_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "teams_league_id_fkey";
                        columns: ["league_id"];
                        isOneToOne: false;
                        referencedRelation: "leagues";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "teams_logo_media_id_fkey";
                        columns: ["logo_media_id"];
                        isOneToOne: false;
                        referencedRelation: "media";
                        referencedColumns: ["id"];
                    }
                ];
            };
            user_profiles: {
                Row: {
                    avatar_media_id: string | null;
                    avatar_url: string | null;
                    bio: string | null;
                    created_at: string | null;
                    date_of_birth: string | null;
                    display_name: string | null;
                    full_name: string | null;
                    id: string;
                    location: string | null;
                    phone: string | null;
                    preferred_position: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    avatar_media_id?: string | null;
                    avatar_url?: string | null;
                    bio?: string | null;
                    created_at?: string | null;
                    date_of_birth?: string | null;
                    display_name?: string | null;
                    full_name?: string | null;
                    id: string;
                    location?: string | null;
                    phone?: string | null;
                    preferred_position?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    avatar_media_id?: string | null;
                    avatar_url?: string | null;
                    bio?: string | null;
                    created_at?: string | null;
                    date_of_birth?: string | null;
                    display_name?: string | null;
                    full_name?: string | null;
                    id?: string;
                    location?: string | null;
                    phone?: string | null;
                    preferred_position?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            users: {
                Row: {
                    created_at: string;
                    email: string;
                    id: string;
                    role: Database["public"]["Enums"]["user_role"];
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    email: string;
                    id: string;
                    role?: Database["public"]["Enums"]["user_role"];
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    email?: string;
                    id?: string;
                    role?: Database["public"]["Enums"]["user_role"];
                    updated_at?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            user_dashboard_stats: {
                Row: {
                    assists: number | null;
                    avatar_url: string | null;
                    avg_team_win_rate: number | null;
                    display_name: string | null;
                    goals_scored: number | null;
                    leagues_participated: number | null;
                    matches_played: number | null;
                    preferred_position: string | null;
                    teams_joined: number | null;
                    total_team_games: number | null;
                    total_team_wins: number | null;
                    upcoming_matches: number | null;
                    user_id: string | null;
                };
                Relationships: [];
            };
        };
        Functions: {
            aggregate_match_player_stats: {
                Args: {
                    p_match_id: string;
                };
                Returns: undefined;
            };
            recalculate_season_stats: {
                Args: {
                    p_season_id: string;
                };
                Returns: {
                    matches_processed: number;
                    players_updated: number;
                    teams_updated: number;
                }[];
            };
        };
        Enums: {
            invitation_status: "pending" | "accepted" | "declined";
            match_status: "scheduled" | "live" | "completed" | "cancelled";
            user_role: "player" | "captain" | "league_admin" | "admin";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
    Row: infer R;
} ? R : never : never;
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
} ? I : never : never;
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
} ? U : never : never;
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
    schema: keyof DatabaseWithoutInternals;
}, EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
    schema: keyof DatabaseWithoutInternals;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export declare const Constants: {
    readonly public: {
        readonly Enums: {
            readonly invitation_status: readonly ["pending", "accepted", "declined"];
            readonly match_status: readonly ["scheduled", "live", "completed", "cancelled"];
            readonly user_role: readonly ["player", "captain", "league_admin", "admin"];
        };
    };
};
export type Media = Database['public']['Tables']['media']['Row'] & {
    match_id?: string | null;
    player_id?: string | null;
    original_media_id?: string | null;
    is_repost?: boolean | null;
};
export type MediaInsert = Database['public']['Tables']['media']['Insert'] & {
    match_id?: string | null;
    player_id?: string | null;
    original_media_id?: string | null;
    is_repost?: boolean | null;
};
export type MediaUpdate = Database['public']['Tables']['media']['Update'] & {
    match_id?: string | null;
    player_id?: string | null;
    original_media_id?: string | null;
    is_repost?: boolean | null;
};
export type User = Database['public']['Tables']['users']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type League = Database['public']['Tables']['leagues']['Row'];
export type Season = Database['public']['Tables']['seasons']['Row'];
export type MediaContextType = 'team_logo' | 'user_profile' | 'league_sponsor' | 'team_media' | 'season_media' | 'league_icon' | 'season_icon' | 'match_media' | 'player_media';
export type MediaType = 'image' | 'video';
export interface MediaUploadOptions {
    context_type: MediaContextType;
    team_id?: string | null;
    league_id?: string | null;
    season_id?: string | null;
    match_id?: string | null;
    player_id?: string | null;
    is_public?: boolean;
    tags?: string[];
    description?: string | null;
}
export interface MediaFilters {
    team_id?: string;
    league_id?: string;
    season_id?: string;
    match_id?: string;
    player_id?: string;
    context_type?: MediaContextType;
    media_type?: MediaType;
    is_public?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
}
export interface MediaWithUrl extends Media {
    url: string;
    created_at: string;
    updated_at: string;
}
export interface MediaUploadResult {
    media: MediaWithUrl;
    storageUrl: string;
}
export interface ServiceError {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    operation?: string;
}
export interface ServiceResponse<T> {
    data: T | null;
    error: ServiceError | null;
    success: boolean;
}
export interface PaginatedServiceResponse<T> {
    data: T[] | null;
    error: ServiceError | null;
    success: boolean;
    total?: number;
    page?: number;
    pageSize?: number;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export interface UserProfile {
    id: string;
    user_id: string;
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    created_at?: string;
    updated_at?: string;
}
export type UpdateUserProfile = Partial<UserProfile>;
export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    joined_at?: string;
    role?: string | null;
    user?: UserProfile;
}
export type InsertTeam = Database['public']['Tables']['teams']['Insert'];
export type UpdateTeam = Database['public']['Tables']['teams']['Update'];
export interface CreateTeamForm {
    name: string;
    description?: string;
    team_color?: string;
    team_bio?: string;
    max_players?: number;
    league_id?: string;
    captain_id?: string;
}
export interface TeamJoinRequest {
    id: string;
    team_id: string;
    user_id: string;
    status: JoinRequestStatus;
    created_at?: string;
    updated_at?: string;
    user?: UserProfile;
}
export type JoinRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export interface LeagueDiscovery {
    id: string;
    name: string;
    description?: string | null;
    sport_type: SportType | string;
    league_type: LeagueType | string;
    is_public: boolean | null;
    member_count?: number;
    team_count?: number;
    teamCount?: number;
    playerCount?: number;
    icon_url?: string | null;
    teams?: any[];
    availableSpots?: number;
    isUserMember?: boolean;
    compatibilityScore?: number;
    joinRequests?: TeamJoinRequest[];
    isOpenForTeams?: boolean;
    hasActiveTeams?: boolean;
    averagePlayersPerTeam?: number;
    location?: string | null;
    entry_fee?: number | null;
    season_start?: string | null;
    season_end?: string | null;
    max_teams?: number | null;
    is_active?: boolean | null;
    created_at?: string;
    updated_at?: string;
    created_by?: string | null;
}
export interface LeagueFilters {
    sport_type?: SportType;
    sportType?: SportType | string;
    league_type?: LeagueType;
    leagueType?: LeagueType | string;
    is_public?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    location?: string;
    entryFeeMax?: number;
    seasonActive?: boolean;
}
export type SportType = 'football' | 'basketball' | 'volleyball' | 'cricket' | 'other' | string;
export type LeagueType = 'competitive' | 'casual' | 'tournament' | 'friendly' | string;
export interface CacheOptions {
    ttl?: number;
    key?: string;
    invalidate?: boolean;
}
export interface RealtimeSubscriptionOptions {
    channel?: string;
    event?: string;
    schema?: string;
    table?: string;
    filter?: string;
}
export type InsertLeague = Database['public']['Tables']['leagues']['Insert'];
export interface CrossLeagueStats {
    user_id: string;
    total_goals: number;
    total_assists: number;
    total_appearances: number;
    total_wins: number;
    total_draws: number;
    total_losses: number;
    leagues_played: number;
    current_teams: number;
    achievements: string[];
    last_updated: string;
}
export interface CrossLeagueComparison {
    user_id: string;
    display_name: string;
    avatar_url?: string | null;
    stats: {
        goals: number;
        assists: number;
        appearances: number;
        win_rate: number;
        goals_per_game: number;
        assists_per_game: number;
    };
    ranking: {
        overall: number;
        goals: number;
        assists: number;
        appearances: number;
    };
}
export interface TeamWithDetails {
    id: string;
    name: string;
    description: string | null;
    team_color: string;
    team_bio: string;
    max_players: number;
    min_players: number | null;
    league_id: string | null;
    captain_id: string | null;
    logo_url: string | null;
    logo_media_id: string | null;
    is_active: boolean | null;
    is_recruiting: boolean | null;
    created_at: string;
    updated_at: string;
    founded_date: string | null;
    home_ground: string | null;
    is_archived: boolean | null;
    website: string | null;
    social_links: Json | null;
    captain?: UserProfile;
    members?: TeamMember[];
    memberCount?: number;
    availableSpots?: number;
    leagues?: League[];
    league?: League | null;
    stats?: {
        wins: number;
        draws: number;
        losses: number;
        goals_for: number;
        goals_against: number;
        points: number;
        position: number;
        total_teams: number;
    };
    joinRequests?: TeamJoinRequest[];
    isOrphaned?: boolean;
    previousLeagueName?: string;
    achievements?: string[];
}
export type MatchStatus = Database['public']['Enums']['match_status'];
export type EventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'assist' | 'own_goal' | 'penalty' | 'penalty_miss';
export type MatchEvent = Database['public']['Tables']['match_events']['Row'];
export interface MatchWithDetails extends Match {
    homeTeam?: Team;
    awayTeam?: Team;
    league?: League | null;
    events?: MatchEvent[];
    homeTeamPlayers?: UserProfile[];
    awayTeamPlayers?: UserProfile[];
    playerStats?: PlayerMatchStats[];
    analytics?: MatchAnalytics;
    home_team?: Team;
    away_team?: Team;
    match_events?: MatchEvent[];
}
export interface LiveMatchData {
    match: MatchWithDetails;
    recentEvents: MatchEvent[];
    liveStats: {
        homeTeamStats: Record<string, unknown>;
        awayTeamStats: Record<string, unknown>;
        playerStats: Record<string, unknown>;
    };
}
export interface ActiveMatch extends Match {
    homeTeam?: Team;
    awayTeam?: Team;
    league?: League | null;
    elapsedMinutes?: number;
    currentScore?: {
        home: number;
        away: number;
    };
}
export interface PlayerMatchStats {
    matchId: string;
    playerId: string;
    playerName: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
    position?: string;
    events?: MatchEvent[];
    performance?: {
        rating: number;
        keyPasses: number;
        successfulPasses: number;
        totalPasses: number;
        tackles: number;
        saves?: number;
    };
}
export interface MatchAnalytics {
    matchId: string;
    duration: number;
    totalEvents: number;
    goalsByPeriod: {
        firstHalf: {
            home: number;
            away: number;
        };
        secondHalf: {
            home: number;
            away: number;
        };
        extraTime?: {
            home: number;
            away: number;
        };
    };
    cardsByTeam: {
        home: {
            yellow: number;
            red: number;
        };
        away: {
            yellow: number;
            red: number;
        };
    };
    topPerformers: {
        home: PlayerMatchStats[];
        away: PlayerMatchStats[];
    };
    matchMomentum: Array<{
        minute: number;
        homeScore: number;
        awayScore: number;
        eventType: EventType;
        momentum: number;
    }>;
}
export interface TeamAvailability {
    teamId: string;
    teamName: string;
    currentPlayers: number;
    maxPlayers: number;
    availableSpots: number;
    isRecruiting: boolean;
    requiredPositions: string[];
    captainContact?: {
        name: string;
        id: string;
    };
}
export {};
//# sourceMappingURL=database.types.d.ts.map