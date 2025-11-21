import React from 'react';
export interface SeasonCardData {
    id: string;
    name: string;
    display_name?: string;
    start_date: string;
    end_date: string;
    is_current?: boolean;
    status?: string;
    stats?: {
        completed_matches?: number;
        total_matches?: number;
        registered_teams?: number;
    };
}
export interface SeasonCardProps {
    season: SeasonCardData;
    leagueId: string;
    href?: string;
    onClick?: () => void;
    seasonIcon?: React.ReactNode;
    showStats?: boolean;
    variant?: 'default' | 'admin';
    className?: string;
}
export declare function SeasonCard({ season, leagueId, href, onClick, seasonIcon, showStats, variant, className }: SeasonCardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=season-card.d.ts.map