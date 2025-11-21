/**
 * Progress Bar Component
 *
 * An animated progress indicator component.
 * Supports different sizes, colors, and display modes.
 *
 * @example
 * ```typescript
 * <ProgressBar
 *   value={75}
 *   max={100}
 *   label="Season Progress"
 *   showPercentage
 * />
 * ```
 */
import React from 'react';
interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showPercentage?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
    animated?: boolean;
}
export declare const ProgressBar: React.NamedExoticComponent<ProgressBarProps>;
export {};
//# sourceMappingURL=progress-bar.d.ts.map