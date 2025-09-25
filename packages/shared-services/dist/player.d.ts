import type { Player, PlayerStats } from '@matchday/shared-types';
export declare const playerService: {
    getPlayers: () => Promise<Player[]>;
    getPlayerStats: (playerId: string, seasonId?: string) => Promise<PlayerStats[]>;
};
