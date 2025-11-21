export interface MediaUploadInput {
  uri: string;
  filename: string;
  type: string;
  fileSize?: number;
}

export interface MediaUploadOptions {
  context_type: string;
  team_id?: string;
  player_id?: string;
  match_id?: string;
  league_id?: string;
  season_id?: string;
  is_public?: boolean;
  tags?: string[];
  description?: string;
}

export interface MediaFilters {
  team_id?: string;
  player_id?: string;
  match_id?: string;
  league_id?: string;
  season_id?: string;
  context_type?: string;
  media_type?: 'image' | 'video';
  is_public?: boolean;
  exclude_reposts?: boolean;
  uploaded_by?: string;
  limit?: number;
}

export interface MediaRecord {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  media_type: 'image' | 'video';
  context_type: string;
  uploaded_by: string;
  team_id: string | null;
  league_id: string | null;
  season_id: string | null;
  match_id: string | null;
  player_id: string | null;
  is_public: boolean;
  tags: string[];
  description: string | null;
  original_media_id: string | null;
  is_repost: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaWithUrl extends MediaRecord {
  url: string;
}
