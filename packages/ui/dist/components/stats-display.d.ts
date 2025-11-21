/**
 * Professional Stats Display Component
 *
 * Creates professional-looking statistics displays that make amateur players
 * feel like pros. Supports various layouts and highlight states.
 *
 * @example
 * ```typescript
 * <StatsDisplay
 *   title="Season Performance"
 *   stats={[
 *     { label: 'Goals', value: 15, highlight: true },
 *     { label: 'Assists', value: 8 },
 *     { label: 'Games', value: 22 }
 *   ]}
 *   layout="grid"
 * />
 * ```
 */
import React from 'react';
interface StatItem {
    label: string;
    value: string | number;
    subValue?: string | number;
    highlight?: boolean;
    trend?: 'up' | 'down' | 'neutral';
    formatter?: (value: any) => string;
}
interface StatsDisplayProps {
    title?: string;
    stats: StatItem[];
    layout?: 'horizontal' | 'grid' | 'vertical';
    variant?: 'default' | 'compact' | 'detailed';
    className?: string;
}
export declare const StatsDisplay: React.NamedExoticComponent<StatsDisplayProps>;
export declare const PlayerStatsDisplay: React.NamedExoticComponent<{
    stats: {
        goals: number;
        assists: number;
        gamesPlayed: number;
        minutesPlayed: number;
        yellowCards?: number;
        redCards?: number;
    };
    compact?: boolean;
}>;
export declare const TeamStatsDisplay: React.NamedExoticComponent<{
    stats: {
        wins: number;
        draws: number;
        losses: number;
        goalsFor: number;
        goalsAgainst: number;
        points: number;
    };
    position?: number;
}>;
export {};
//# sourceMappingURL=stats-display.d.ts.map