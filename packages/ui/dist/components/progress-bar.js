import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { cn } from '@matchday/shared';
export const ProgressBar = React.memo(({ value, max = 100, label, showPercentage = false, size = 'md', variant = 'default', className, animated = true }) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const sizeStyles = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3'
    };
    const variantStyles = {
        default: 'bg-blue-600 dark:bg-blue-400',
        success: 'bg-green-600 dark:bg-green-400',
        warning: 'bg-yellow-600 dark:bg-yellow-400',
        danger: 'bg-red-600 dark:bg-red-400'
    };
    return (_jsxs("div", { className: cn('w-full', className), children: [(label || showPercentage) && (_jsxs("div", { className: "flex items-center justify-between mb-2", children: [label && (_jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: label })), showPercentage && (_jsxs("span", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: [Math.round(percentage), "%"] }))] })), _jsx("div", { className: cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', sizeStyles[size]), children: _jsx("div", { className: cn('h-full rounded-full transition-all', variantStyles[variant], animated && 'duration-500 ease-out'), style: { width: `${percentage}%` } }) })] }));
});
ProgressBar.displayName = 'ProgressBar';
//# sourceMappingURL=progress-bar.js.map