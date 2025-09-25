import { BaseEntity } from './common';

export interface Match extends BaseEntity {
  league_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  home_score?: number;
  away_score?: number;
}