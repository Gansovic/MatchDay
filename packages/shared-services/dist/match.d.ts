import type { Match } from '@matchday/shared-types';
export declare const matchService: {
    getMatches: (seasonId?: string) => Promise<Match[]>;
};
