/**
 * Season Dashboard Layout (Shared)
 *
 * Shared layout wrapper for all season dashboard types across admin and player apps.
 * Provides consistent header, navigation, and structure.
 *
 * Data Fetching Strategy:
 * - This component does NOT fetch data internally
 * - Apps must fetch data and pass it via props
 * - This ensures flexibility for different Supabase client implementations
 */
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { ArrowLeft, Trophy, Calendar, Users, Loader2, AlertCircle } from 'lucide-react';
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Format date to readable string (e.g., "Jan 15, 2025")
 */
function formatDateOnly(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
}
/**
 * Get status badge styling based on season status
 */
function getStatusDisplay(status, is_current) {
    if (status === 'completed') {
        return {
            text: 'Completed',
            className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
    }
    else if (status === 'active' || is_current) {
        return {
            text: 'Active',
            className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        };
    }
    else if (status === 'draft' || status === 'registration') {
        return {
            text: status === 'draft' ? 'Upcoming' : 'Registration',
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        };
    }
    else {
        return {
            text: status,
            className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
    }
}
// ============================================================================
// Main Component
// ============================================================================
export function SeasonDashboardLayout({ backLink, season, league, isLoading = false, error = null, tabs, activeTab, onTabChange, headerActions, seasonIcon, title, children }) {
    // ========================================
    // Loading State
    // ========================================
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900", children: _jsx("div", { className: "container mx-auto px-4 py-8", children: _jsx("div", { className: "flex items-center justify-center min-h-[50vh]", children: _jsxs("div", { className: "text-center", children: [_jsx(Loader2, { className: "w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Loading dashboard..." })] }) }) }) }));
    }
    // ========================================
    // Error State
    // ========================================
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900", children: _jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsx("div", { className: "mb-6", children: _jsxs(Link, { href: backLink.href, className: "inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), backLink.label] }) }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-red-500 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: "Error Loading Dashboard" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: error }), _jsxs(Link, { href: backLink.href, className: "inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), backLink.label] })] })] }) }));
    }
    // ========================================
    // Data Validation
    // ========================================
    if (!league || !season) {
        return null;
    }
    const statusDisplay = getStatusDisplay(season.status, season.is_current);
    // ========================================
    // Main Layout
    // ========================================
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900", children: _jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsx("div", { className: "mb-6", children: _jsxs(Link, { href: backLink.href, className: "inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), backLink.label] }) }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8", children: _jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-start gap-6", children: [seasonIcon && (_jsx("div", { className: "flex-shrink-0", children: seasonIcon })), _jsxs("div", { className: "flex-grow", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: title || `${league.name} - ${season.display_name || season.name}` }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`, children: statusDisplay.text })] }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 text-lg mb-4", children: season.description || league.description || `${league.sport_type} league season` }), _jsxs("div", { className: "flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Trophy, { className: "w-4 h-4" }), season.display_name || season.name] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-4 h-4" }), formatDateOnly(season.start_date), " - ", formatDateOnly(season.end_date)] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Users, { className: "w-4 h-4" }), season.registered_teams_count || league.teamCount || 0, " Teams"] })] })] })] }), headerActions && (_jsx("div", { className: "flex-shrink-0", children: headerActions }))] }) }), tabs.length > 1 && (_jsx("div", { className: "mb-8", children: _jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: _jsx("nav", { className: "-mb-px flex space-x-8", children: tabs.map((tab) => {
                                const TabIcon = tab.icon;
                                return (_jsx("button", { onClick: () => onTabChange?.(tab.id), className: `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TabIcon, { className: "w-4 h-4" }), tab.label] }) }, tab.id));
                            }) }) }) })), children] }) }));
}
// Default export for backward compatibility
export default SeasonDashboardLayout;
//# sourceMappingURL=SeasonDashboardLayout.js.map