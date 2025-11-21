/**
 * Status Badge Component
 *
 * A flexible badge component for displaying status indicators.
 * Supports various colors, sizes, and includes optional dot indicator.
 *
 * @example
 * ```typescript
 * <StatusBadge status="active" variant="success" />
 * <StatusBadge status="pending" variant="warning" showDot />
 * ```
 */
import React from 'react';
interface StatusBadgeProps {
    status: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    showDot?: boolean;
    className?: string;
}
export declare const StatusBadge: React.NamedExoticComponent<StatusBadgeProps>;
export declare const MatchStatusBadge: React.NamedExoticComponent<{
    status: string;
}>;
export declare const PlayerStatusBadge: React.NamedExoticComponent<{
    status: string;
}>;
export {};
//# sourceMappingURL=status-badge.d.ts.map