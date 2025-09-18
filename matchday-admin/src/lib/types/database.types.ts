export type Database = {
  public: {
    Tables: {
      leagues: {
        Row: {
          id: string
          name: string
          description: string | null
          sport_type: string
          league_type: string
          location: string | null
          max_teams: number | null
          entry_fee: number | null
          is_active: boolean | null
          is_public: boolean | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sport_type?: string
          league_type?: string
          location?: string | null
          max_teams?: number | null
          entry_fee?: number | null
          is_active?: boolean | null
          is_public?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sport_type?: string
          league_type?: string
          location?: string | null
          max_teams?: number | null
          entry_fee?: number | null
          is_active?: boolean | null
          is_public?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          league_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          league_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          league_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      team_league_requests: {
        Row: {
          id: string
          team_id: string
          league_id: string
          status: string
          created_at: string
          updated_at: string
          processed_at: string | null
          processed_by: string | null
          response_message: string | null
        }
        Insert: {
          id?: string
          team_id: string
          league_id: string
          status?: string
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          processed_by?: string | null
          response_message?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          league_id?: string
          status?: string
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          processed_by?: string | null
          response_message?: string | null
        }
      }
      activity_logs: {
        Row: {
          id: string
          action: string
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          created_at?: string
        }
      }
      league_teams: {
        Row: {
          id: string
          league_id: string
          team_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          league_id: string
          team_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          team_id?: string
          joined_at?: string
        }
      }
      seasons: {
        Row: {
          id: string
          league_id: string
          name: string
          description: string | null
          start_date: string | null
          end_date: string | null
          registration_start: string | null
          registration_end: string | null
          max_teams: number | null
          min_teams: number | null
          status: string
          format: string | null
          rules: any | null
          prize_structure: any | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          league_id: string
          name: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          registration_start?: string | null
          registration_end?: string | null
          max_teams?: number | null
          min_teams?: number | null
          status?: string
          format?: string | null
          rules?: any | null
          prize_structure?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          name?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          registration_start?: string | null
          registration_end?: string | null
          max_teams?: number | null
          min_teams?: number | null
          status?: string
          format?: string | null
          rules?: any | null
          prize_structure?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      season_join_requests: {
        Row: {
          id: string
          season_id: string
          team_id: string
          user_id: string
          message: string | null
          status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
          responded_by: string | null
          responded_at: string | null
          response_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          season_id: string
          team_id: string
          user_id: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'withdrawn'
          responded_by?: string | null
          responded_at?: string | null
          response_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          team_id?: string
          user_id?: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'withdrawn'
          responded_by?: string | null
          responded_at?: string | null
          response_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Utility types for common operations
export type League = Database['public']['Tables']['leagues']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Season = Database['public']['Tables']['seasons']['Row']
export type SeasonJoinRequest = Database['public']['Tables']['season_join_requests']['Row']

// Insert types
export type InsertSeasonJoinRequest = Database['public']['Tables']['season_join_requests']['Insert']

// Update types
export type UpdateSeasonJoinRequest = Database['public']['Tables']['season_join_requests']['Update']

// Enums for type safety
export enum SeasonJoinRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}

// Complex types for detailed views
export interface SeasonJoinRequestWithDetails extends SeasonJoinRequest {
  season: Season;
  team: Team;
  user: UserProfile;
  responded_by_user?: UserProfile;
}

export interface SeasonWithDetails extends Season {
  league: League;
  team_count: number;
  available_spots: number;
  join_requests?: SeasonJoinRequestWithDetails[];
}

// Form types
export interface RespondToJoinRequestForm {
  status: 'approved' | 'rejected';
  response_message?: string;
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