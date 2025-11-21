import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { cn } from '@matchday/shared';
export const StatsCard = React.memo(({ title, value, subtitle, trend, change, icon, variant = 'default', className, onClick }) => {
    const variantStyles = {
        default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        primary: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    };
    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-green-600 dark:text-green-400';
            case 'down':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };
    const getTrendIcon = () => {
        if (!trend || trend === 'neutral')
            return null;
        return trend === 'up' ? (_jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }));
    };
    return (_jsx("div", { className: cn('rounded-xl border p-6 transition-all duration-200', variantStyles[variant], onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]', className), onClick: onClick, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400 mb-1", children: title }), _jsx("p", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-2", children: typeof value === 'number' ? value.toLocaleString() : value }), subtitle && (_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: subtitle })), change && (_jsxs("div", { className: cn('flex items-center gap-1 text-sm font-medium mt-2', getTrendColor()), children: [getTrendIcon(), _jsx("span", { children: change })] }))] }), icon && (_jsx("div", { className: "text-gray-400 dark:text-gray-500", children: icon }))] }) }));
});
StatsCard.displayName = 'StatsCard';
//# sourceMappingURL=stats-card.js.map