import { BaseEntity } from './common';
export interface Player extends BaseEntity {
    user_id: string;
    name: string;
    position?: string;
    jersey_number?: number;
}
export interface PlayerStats extends BaseEntity {
    player_id: string;
    season_id: string;
    matches_played: number;
    goals: number;
    assists: number;
}
