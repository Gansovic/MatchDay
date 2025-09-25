import { BaseEntity } from './common';

export interface League extends BaseEntity {
  name: string;
  description?: string;
  sport: string;
  status: 'active' | 'inactive' | 'archived';
}

export interface Season extends BaseEntity {
  league_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
}