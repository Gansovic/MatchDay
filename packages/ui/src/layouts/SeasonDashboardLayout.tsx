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

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
  type LucideIcon
} from 'lucide-react';

// ============================================================================
// Type Definitions
// ============================================================================

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
  // Navigation
  backLink: {
    href: string;
    label: string;
  };

  // Data (passed from apps - apps handle fetching)
  season: Season | null;
  league: League | null;

  // Loading and error states
  isLoading?: boolean;
  error?: string | null;

  // Tab configuration
  tabs: TabConfig[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;

  // Optional customization slots
  headerActions?: React.ReactNode;
  seasonIcon?: React.ReactNode;
  title?: string;

  // Content
  children: React.ReactNode;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date to readable string (e.g., "Jan 15, 2025")
 */
function formatDateOnly(dateString: string): string {
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
function getStatusDisplay(status: string, is_current: boolean) {
  if (status === 'completed') {
    return {
      text: 'Completed',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
  } else if (status === 'active' || is_current) {
    return {
      text: 'Active',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
  } else if (status === 'draft' || status === 'registration') {
    return {
      text: status === 'draft' ? 'Upcoming' : 'Registration',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
  } else {
    return {
      text: status,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function SeasonDashboardLayout({
  backLink,
  season,
  league,
  isLoading = false,
  error = null,
  tabs,
  activeTab,
  onTabChange,
  headerActions,
  seasonIcon,
  title,
  children
}: SeasonDashboardLayoutProps) {

  // ========================================
  // Loading State
  // ========================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // Error State
  // ========================================

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              href={backLink.href}
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLink.label}
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Link
              href={backLink.href}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLink.label}
            </Link>
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">

        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href={backLink.href}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLink.label}
          </Link>
        </div>

        {/* Season Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-6">

              {/* Season Icon (provided by app) */}
              {seasonIcon && (
                <div className="flex-shrink-0">
                  {seasonIcon}
                </div>
              )}

              {/* Season Info */}
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {title || `${league.name} - ${season.display_name || season.name}`}
                  </h1>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                    {statusDisplay.text}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                  {season.description || league.description || `${league.sport_type} league season`}
                </p>

                {/* Metadata Row */}
                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {season.display_name || season.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDateOnly(season.start_date)} - {formatDateOnly(season.end_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {season.registered_teams_count || league.teamCount || 0} Teams
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions Slot */}
            {headerActions && (
              <div className="flex-shrink-0">
                {headerActions}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        {tabs.length > 1 && (
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange?.(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <TabIcon className="w-4 h-4" />
                        {tab.label}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
}

// Default export for backward compatibility
export default SeasonDashboardLayout;
