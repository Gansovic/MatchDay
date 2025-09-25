import type { League, Season } from '@matchday/shared-types';
export declare const leagueService: {
    getLeagues: () => Promise<League[]>;
    getSeasons: (leagueId: string) => Promise<Season[]>;
};
