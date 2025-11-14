export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      league_standings: {
        Row: {
          draws: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          id: string
          last_updated: string | null
          league_id: string
          losses: number | null
          matches_played: number | null
          points: number | null
          position: number | null
          team_id: string
          wins: number | null
        }
        Insert: {
          draws?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          last_updated?: string | null
          league_id: string
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          position?: number | null
          team_id: string
          wins?: number | null
        }
        Update: {
          draws?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          last_updated?: string | null
          league_id?: string
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          position?: number | null
          team_id?: string
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "league_standings_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entry_fee: number | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          league_type: string
          location: string | null
          logo_media_id: string | null
          max_teams: number | null
          name: string
          season: string
          season_end: string | null
          season_start: string | null
          sponsor_media_id: string | null
          sport_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_fee?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          league_type?: string
          location?: string | null
          logo_media_id?: string | null
          max_teams?: number | null
          name: string
          season?: string
          season_end?: string | null
          season_start?: string | null
          sponsor_media_id?: string | null
          sport_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_fee?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          league_type?: string
          location?: string | null
          logo_media_id?: string | null
          max_teams?: number | null
          name?: string
          season?: string
          season_end?: string | null
          season_start?: string | null
          sponsor_media_id?: string | null
          sport_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leagues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leagues_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leagues_sponsor_media_id_fkey"
            columns: ["sponsor_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          assist_player_id: string | null
          created_at: string | null
          description: string | null
          event_time: number | null
          event_type: string
          id: string
          match_id: string
          player_id: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          assist_player_id?: string | null
          created_at?: string | null
          description?: string | null
          event_time?: number | null
          event_type: string
          id?: string
          match_id: string
          player_id?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          assist_player_id?: string | null
          created_at?: string | null
          description?: string | null
          event_time?: number | null
          event_type?: string
          id?: string
          match_id?: string
          player_id?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_assist_player_id_fkey"
            columns: ["assist_player_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "match_events_assist_player_id_fkey"
            columns: ["assist_player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_lineup: Json | null
          away_score: number | null
          away_team_id: string
          court_number: number | null
          created_at: string
          home_lineup: Json | null
          home_score: number | null
          home_team_id: string
          id: string
          league_id: string | null
          man_of_match_id: string | null
          match_date: string
          match_time: string | null
          matchday_number: number | null
          notes: string | null
          season_id: string | null
          status: Database["public"]["Enums"]["match_status"] | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          away_lineup?: Json | null
          away_score?: number | null
          away_team_id: string
          court_number?: number | null
          created_at?: string
          home_lineup?: Json | null
          home_score?: number | null
          home_team_id: string
          id?: string
          league_id?: string | null
          man_of_match_id?: string | null
          match_date: string
          match_time?: string | null
          matchday_number?: number | null
          notes?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          away_lineup?: Json | null
          away_score?: number | null
          away_team_id?: string
          court_number?: number | null
          created_at?: string
          home_lineup?: Json | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          league_id?: string | null
          man_of_match_id?: string | null
          match_date?: string
          match_time?: string | null
          matchday_number?: number | null
          notes?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_man_of_match_id_fkey"
            columns: ["man_of_match_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          context_type: string
          created_at: string | null
          description: string | null
          file_size: number
          filename: string
          id: string
          is_public: boolean | null
          league_id: string | null
          media_type: string
          metadata: Json | null
          mime_type: string
          original_filename: string
          season_id: string | null
          storage_path: string
          tags: string[] | null
          team_id: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          context_type: string
          created_at?: string | null
          description?: string | null
          file_size: number
          filename: string
          id?: string
          is_public?: boolean | null
          league_id?: string | null
          media_type: string
          metadata?: Json | null
          mime_type: string
          original_filename: string
          season_id?: string | null
          storage_path: string
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          context_type?: string
          created_at?: string | null
          description?: string | null
          file_size?: number
          filename?: string
          id?: string
          is_public?: boolean | null
          league_id?: string | null
          media_type?: string
          metadata?: Json | null
          mime_type?: string
          original_filename?: string
          season_id?: string | null
          storage_path?: string
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_leaderboard: {
        Row: {
          appearances: number | null
          assists: number | null
          goals: number | null
          id: string
          last_updated: string | null
          league_id: string | null
          red_cards: number | null
          team_id: string | null
          user_id: string
          yellow_cards: number | null
        }
        Insert: {
          appearances?: number | null
          assists?: number | null
          goals?: number | null
          id?: string
          last_updated?: string | null
          league_id?: string | null
          red_cards?: number | null
          team_id?: string | null
          user_id: string
          yellow_cards?: number | null
        }
        Update: {
          appearances?: number | null
          assists?: number | null
          goals?: number | null
          id?: string
          last_updated?: string | null
          league_id?: string | null
          red_cards?: number | null
          team_id?: string | null
          user_id?: string
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_leaderboard_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_leaderboard_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "player_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_stats: {
        Row: {
          assists: number
          created_at: string
          goals: number
          id: string
          match_id: string
          red_cards: number
          season_id: string
          team_id: string
          updated_at: string
          user_id: string
          yellow_cards: number
        }
        Insert: {
          assists?: number
          created_at?: string
          goals?: number
          id?: string
          match_id: string
          red_cards?: number
          season_id: string
          team_id: string
          updated_at?: string
          user_id: string
          yellow_cards?: number
        }
        Update: {
          assists?: number
          created_at?: string
          goals?: number
          id?: string
          match_id?: string
          red_cards?: number
          season_id?: string
          team_id?: string
          updated_at?: string
          user_id?: string
          yellow_cards?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          assists: number | null
          created_at: string | null
          goals: number | null
          id: string
          match_id: string | null
          minutes_played: number | null
          season_id: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          match_id?: string | null
          minutes_played?: number | null
          season_id?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          match_id?: string | null
          minutes_played?: number | null
          season_id?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "player_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      season_join_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          season_id: string
          status: string | null
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          season_id: string
          status?: string | null
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          season_id?: string
          status?: string | null
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_join_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "season_join_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_join_requests_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_join_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "season_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      season_standings: {
        Row: {
          created_at: string | null
          draws: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          id: string
          losses: number | null
          matches_played: number | null
          points: number | null
          position: number | null
          season_id: string
          team_id: string
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          draws?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          position?: number | null
          season_id: string
          team_id: string
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          draws?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          position?: number | null
          season_id?: string
          team_id?: string
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "season_standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      season_teams: {
        Row: {
          created_at: string | null
          id: string
          registration_date: string | null
          season_id: string
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          registration_date?: string | null
          season_id: string
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          registration_date?: string | null
          season_id?: string
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          allow_draws: boolean | null
          courts_available: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          end_date: string
          fixtures_generated_at: string | null
          fixtures_status: string | null
          games_per_court: number | null
          home_away_balance: boolean | null
          id: string
          is_active: boolean | null
          is_current: boolean | null
          league_id: string
          match_day: string | null
          match_end_time: string | null
          match_frequency: number | null
          match_start_time: string | null
          max_teams: number | null
          metadata: Json | null
          min_teams: number | null
          name: string
          points_for_draw: number | null
          points_for_loss: number | null
          points_for_win: number | null
          preferred_match_time: string | null
          registration_deadline: string | null
          registration_end: string | null
          registration_start: string | null
          rest_weeks_between_matches: number | null
          rounds: number | null
          rules: Json | null
          season_year: number
          settings: Json | null
          start_date: string
          status: string | null
          total_matches_planned: number | null
          tournament_format: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          allow_draws?: boolean | null
          courts_available?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          end_date: string
          fixtures_generated_at?: string | null
          fixtures_status?: string | null
          games_per_court?: number | null
          home_away_balance?: boolean | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          league_id: string
          match_day?: string | null
          match_end_time?: string | null
          match_frequency?: number | null
          match_start_time?: string | null
          max_teams?: number | null
          metadata?: Json | null
          min_teams?: number | null
          name: string
          points_for_draw?: number | null
          points_for_loss?: number | null
          points_for_win?: number | null
          preferred_match_time?: string | null
          registration_deadline?: string | null
          registration_end?: string | null
          registration_start?: string | null
          rest_weeks_between_matches?: number | null
          rounds?: number | null
          rules?: Json | null
          season_year: number
          settings?: Json | null
          start_date: string
          status?: string | null
          total_matches_planned?: number | null
          tournament_format?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          allow_draws?: boolean | null
          courts_available?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          end_date?: string
          fixtures_generated_at?: string | null
          fixtures_status?: string | null
          games_per_court?: number | null
          home_away_balance?: boolean | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          league_id?: string
          match_day?: string | null
          match_end_time?: string | null
          match_frequency?: number | null
          match_start_time?: string | null
          max_teams?: number | null
          metadata?: Json | null
          min_teams?: number | null
          name?: string
          points_for_draw?: number | null
          points_for_loss?: number | null
          points_for_win?: number | null
          preferred_match_time?: string | null
          registration_deadline?: string | null
          registration_end?: string | null
          registration_start?: string | null
          rest_weeks_between_matches?: number | null
          rounds?: number | null
          rules?: Json | null
          season_year?: number
          settings?: Json | null
          start_date?: string
          status?: string | null
          total_matches_planned?: number | null
          tournament_format?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          jersey_number: number | null
          message: string | null
          position: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["invitation_status"] | null
          team_id: string
          token: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          jersey_number?: number | null
          message?: string | null
          position?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
          team_id: string
          token?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          jersey_number?: number | null
          message?: string | null
          position?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
          team_id?: string
          token?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          is_active: boolean | null
          jersey_number: number | null
          joined_at: string
          position: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          joined_at?: string
          position?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          joined_at?: string
          position?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_stats: {
        Row: {
          created_at: string
          draws: number | null
          games_played: number | null
          goals_against: number | null
          goals_for: number | null
          id: string
          league_id: string | null
          losses: number | null
          points: number | null
          position: number | null
          season_id: string | null
          season_year: number | null
          team_id: string
          updated_at: string
          wins: number | null
        }
        Insert: {
          created_at?: string
          draws?: number | null
          games_played?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_id?: string | null
          losses?: number | null
          points?: number | null
          position?: number | null
          season_id?: string | null
          season_year?: number | null
          team_id: string
          updated_at?: string
          wins?: number | null
        }
        Update: {
          created_at?: string
          draws?: number | null
          games_played?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_id?: string | null
          losses?: number | null
          points?: number | null
          position?: number | null
          season_id?: string | null
          season_year?: number | null
          team_id?: string
          updated_at?: string
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_stats_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_id: string | null
          created_at: string
          description: string | null
          founded_date: string | null
          home_ground: string | null
          id: string
          is_active: boolean | null
          is_archived: boolean | null
          is_recruiting: boolean | null
          league_id: string | null
          logo_media_id: string | null
          logo_url: string | null
          max_players: number
          min_players: number | null
          name: string
          previous_league_name: string | null
          team_bio: string | null
          team_color: string
          updated_at: string
        }
        Insert: {
          captain_id?: string | null
          created_at?: string
          description?: string | null
          founded_date?: string | null
          home_ground?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          is_recruiting?: boolean | null
          league_id?: string | null
          logo_media_id?: string | null
          logo_url?: string | null
          max_players?: number
          min_players?: number | null
          name: string
          previous_league_name?: string | null
          team_bio?: string | null
          team_color?: string
          updated_at?: string
        }
        Update: {
          captain_id?: string | null
          created_at?: string
          description?: string | null
          founded_date?: string | null
          home_ground?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          is_recruiting?: boolean | null
          league_id?: string | null
          logo_media_id?: string | null
          logo_url?: string | null
          max_players?: number
          min_players?: number | null
          name?: string
          previous_league_name?: string | null
          team_bio?: string | null
          team_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_media_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          preferred_position: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_media_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          preferred_position?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_media_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          preferred_position?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          preferred_position: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          preferred_position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          preferred_position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_dashboard_stats: {
        Row: {
          assists: number | null
          avatar_url: string | null
          avg_team_win_rate: number | null
          display_name: string | null
          goals_scored: number | null
          leagues_participated: number | null
          matches_played: number | null
          preferred_position: string | null
          teams_joined: number | null
          total_team_games: number | null
          total_team_wins: number | null
          upcoming_matches: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      aggregate_match_player_stats: {
        Args: { p_match_id: string }
        Returns: undefined
      }
      recalculate_season_stats: {
        Args: { p_season_id: string }
        Returns: {
          matches_processed: number
          players_updated: number
          teams_updated: number
        }[]
      }
    }
    Enums: {
      invitation_status: "pending" | "accepted" | "declined"
      match_status: "scheduled" | "live" | "completed" | "cancelled"
      user_role: "player" | "captain" | "league_admin" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      invitation_status: ["pending", "accepted", "declined"],
      match_status: ["scheduled", "live", "completed", "cancelled"],
      user_role: ["player", "captain", "league_admin", "admin"],
    },
  },
} as const
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
// ===================================================================
// MEDIA MANAGEMENT TYPES
// ===================================================================

export type MediaType = 'image' | 'video';
export type MediaContextType = 'team_logo' | 'user_profile' | 'league_sponsor' | 'team_media' | 'season_media';

/**
 * Media with public URL included (for displaying in UI)
 */
export interface MediaWithUrl extends Media {
  url: string;
  thumbnail_url?: string;
}

/**
 * Options for uploading media
 */
export interface MediaUploadOptions {
  context_type: MediaContextType;
  team_id?: string;
  league_id?: string;
  season_id?: string;
  is_public?: boolean;
  tags?: string[];
  description?: string;
}

/**
 * Filters for querying media
 */
export interface MediaFilters {
  team_id?: string;
  league_id?: string;
  season_id?: string;
  context_type?: MediaContextType;
  media_type?: MediaType;
  tags?: string[];
  is_public?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Result of media upload operation
 */
export interface MediaUploadResult {
  media: MediaWithUrl;
  storageUrl: string;
}
