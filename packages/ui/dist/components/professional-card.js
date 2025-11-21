'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Professional Card Component
 *
 * A reusable card component that gives amateur players a professional appearance.
 * Follows LEVER principles by being highly reusable and customizable.
 *
 * @example
 * ```typescript
 * <ProfessionalCard
 *   title="Player Profile"
 *   subtitle="Forward"
 *   image="/player-avatar.jpg"
 *   stats={[
 *     { label: "Goals", value: 15 },
 *     { label: "Assists", value: 8 }
 *   ]}
 * />
 * ```
 */
import React from 'react';
import Image from 'next/image';
export const ProfessionalCard = React.memo(({ title, subtitle, image, stats = [], badges = [], className = '', onClick, children, variant = 'default' }) => {
    const baseClasses = [
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'rounded-xl shadow-sm hover:shadow-md',
        'transition-all duration-200',
        'p-6',
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
    ].filter(Boolean).join(' ');
    const variantClasses = {
        default: '',
        player: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
        team: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        match: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20'
    };
    return (_jsxs("div", { className: `${baseClasses} ${variantClasses[variant]} ${className}`, onClick: onClick, children: [_jsxs("div", { className: "flex items-start gap-4 mb-4", children: [image && (_jsx("div", { className: "relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm", children: _jsx(Image, { src: image, alt: title, fill: true, className: "object-cover" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white truncate", children: title }), subtitle && (_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mt-1", children: subtitle })), badges.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: badges.map((badge, index) => (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", children: badge }, index))) }))] })] }), stats.length > 0 && (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4", children: stats.map((stat, index) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: `text-2xl font-bold ${stat.highlight
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-900 dark:text-white'}`, children: stat.value }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide", children: stat.label })] }, index))) })), children && (_jsx("div", { className: "pt-4 border-t border-gray-200 dark:border-gray-700", children: children }))] }));
});
ProfessionalCard.displayName = 'ProfessionalCard';
//# sourceMappingURL=professional-card.js.map