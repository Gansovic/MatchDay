/**
 * Stats Card Component
 *
 * A flexible card component for displaying key statistics.
 * Can be used across both player and admin apps.
 *
 * @example
 * ```typescript
 * <StatsCard
 *   title="Total Players"
 *   value={125}
 *   trend="up"
 *   change="+12%"
 *   icon={<Users className="w-6 h-6" />}
 * />
 * ```
 */
import React from 'react';
interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    change?: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    className?: string;
    onClick?: () => void;
}
export declare const StatsCard: React.NamedExoticComponent<StatsCardProps>;
export {};
//# sourceMappingURL=stats-card.d.ts.map