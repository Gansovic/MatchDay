'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
export function SeasonCard({ season, leagueId, href, onClick, seasonIcon, showStats = true, variant = 'default', className = '' }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getUTCMonth()];
        const day = date.getUTCDate();
        const year = date.getUTCFullYear();
        return `${month} ${day}, ${year}`;
    };
    const linkHref = href || `/leagues/${leagueId}/seasons/${season.id}`;
    const cardClasses = variant === 'admin'
        ? `block p-4 border border-gray-600 dark:border-gray-600 rounded-lg hover:border-gray-500 transition-colors bg-gray-800 dark:bg-gray-800 cursor-pointer hover:bg-gray-750 dark:hover:bg-gray-750 ${className}`
        : `block p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group ${className}`;
    const content = (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-start gap-4", children: [seasonIcon && (_jsx("div", { className: "flex-shrink-0", children: seasonIcon })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: `font-semibold ${variant === 'admin'
                                        ? 'text-white'
                                        : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`, children: season.display_name || season.name }), season.is_current && (_jsx("span", { className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0", children: "Current" }))] }), _jsxs("p", { className: `text-sm mb-3 ${variant === 'admin' ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`, children: [formatDate(season.start_date), " - ", formatDate(season.end_date)] }), showStats && season.stats && (_jsxs("div", { className: `flex items-center justify-between text-xs ${variant === 'admin' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`, children: [_jsxs("span", { children: [season.stats.completed_matches || 0, " / ", season.stats.total_matches || 0, " matches"] }), season.stats.registered_teams !== undefined && (_jsxs("span", { children: [season.stats.registered_teams, " teams"] }))] })), _jsxs("div", { className: `mt-3 flex items-center text-sm font-medium ${variant === 'admin'
                                ? 'text-gray-300'
                                : 'text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300'}`, children: ["View Details", _jsx(ChevronRight, { className: "w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" })] })] })] }) }));
    if (onClick) {
        return (_jsx("div", { onClick: onClick, className: cardClasses, children: content }));
    }
    return (_jsx(Link, { href: linkHref, className: cardClasses, children: content }));
}
//# sourceMappingURL=season-card.js.map