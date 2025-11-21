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
import React from 'react';
import { type LucideIcon } from 'lucide-react';
export interface Season {
    id: string;
    name: string;
    display_name?: string;
    status: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description?: string;
    registered_teams_count?: number;
}
export interface League {
    id: string;
    name: string;
    sport_type: string;
    description?: string;
    teamCount?: number;
}
export interface TabConfig {
    id: string;
    label: string;
    icon: LucideIcon;
}
export interface SeasonDashboardLayoutProps {
    backLink: {
        href: string;
        label: string;
    };
    season: Season | null;
    league: League | null;
    isLoading?: boolean;
    error?: string | null;
    tabs: TabConfig[];
    activeTab: string;
    onTabChange?: (tabId: string) => void;
    headerActions?: React.ReactNode;
    seasonIcon?: React.ReactNode;
    title?: string;
    children: React.ReactNode;
}
export declare function SeasonDashboardLayout({ backLink, season, league, isLoading, error, tabs, activeTab, onTabChange, headerActions, seasonIcon, title, children }: SeasonDashboardLayoutProps): import("react/jsx-runtime").JSX.Element | null;
export default SeasonDashboardLayout;
//# sourceMappingURL=SeasonDashboardLayout.d.ts.map