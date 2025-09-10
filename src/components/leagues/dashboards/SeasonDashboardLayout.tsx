/**
 * Season Dashboard Layout
 * 
 * Shared layout wrapper for all season dashboard types.
 * Provides consistent header, navigation, and structure.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Target,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { LeagueService } from '@/lib/services/league.service';
import { LeagueDiscovery } from '@/lib/types/database.types';
import { Season } from '@/components/leagues/season-selector';

interface SeasonDashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: 'standings' | 'matches' | 'stats' | 'info' | 'management' | 'registration';
  onTabChange?: (tab: string) => void;
  availableTabs?: string[];
  title?: string;
}

interface LoadingStates {
  league: boolean;
  season: boolean;
}

interface ErrorStates {
  league: string | null;
  season: string | null;
}

export default function SeasonDashboardLayout({
  children,
  activeTab = 'standings',
  onTabChange,
  availableTabs = ['standings', 'matches', 'stats', 'info'],
  title
}: SeasonDashboardLayoutProps) {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  // State for real data
  const [leagueData, setLeagueData] = useState<LeagueDiscovery | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState<LoadingStates>({
    league: true,
    season: true
  });
  
  const [errors, setErrors] = useState<ErrorStates>({
    league: null,
    season: null
  });
  
  // Initialize services
  const leagueService = LeagueService.getInstance(supabase);

  // Fetch league details
  const fetchLeagueDetails = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, league: true }));
      setErrors(prev => ({ ...prev, league: null }));
      
      const response = await leagueService.getLeagueDetails(leagueId);
      
      if (response.success && response.data) {
        setLeagueData(response.data);
      } else {
        setErrors(prev => ({ ...prev, league: response.error?.message || 'Failed to load league details' }));
      }
    } catch (error) {
      console.error('Error fetching league details:', error);
      setErrors(prev => ({ ...prev, league: 'An unexpected error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, league: false }));
    }
  }, [leagueId]);

  // Fetch season details
  const fetchSeasonDetails = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, season: true }));
      setErrors(prev => ({ ...prev, season: null }));
      
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      
      const response = await fetch(`${baseUrl}/api/leagues/${leagueId}/seasons`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          // Find the current season by ID
          const season = result.data.find((s: Season) => s.id === seasonId);
          if (season) {
            setCurrentSeason(season);
          } else {
            setErrors(prev => ({ ...prev, season: 'Season not found' }));
          }
        }
      } else {
        setErrors(prev => ({ ...prev, season: 'Failed to load season details' }));
      }
    } catch (error) {
      console.error('Error fetching season details:', error);
      setErrors(prev => ({ ...prev, season: 'An unexpected error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, season: false }));
    }
  }, [leagueId, seasonId]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchLeagueDetails(),
        fetchSeasonDetails()
      ]);
    };
    
    loadInitialData();
  }, [fetchLeagueDetails, fetchSeasonDetails]);

  // Helper function to format date only (no time)
  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Get status badge color and text
  const getStatusDisplay = (status: string, is_current: boolean) => {
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
    } else if (status === 'draft') {
      return {
        text: 'Upcoming',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      };
    } else {
      return {
        text: status,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      };
    }
  };

  // Tab configuration
  const tabConfig = {
    standings: { icon: Trophy, label: 'Standings' },
    matches: { icon: Calendar, label: 'Matches' },
    stats: { icon: Target, label: 'Statistics' },
    info: { icon: Info, label: 'Season Info' },
    management: { icon: Users, label: 'Management' },
    registration: { icon: Users, label: 'Registration' }
  };

  // Loading states check
  const isLoading = loading.league || loading.season;
  const hasAnyError = errors.league || errors.season;
  
  // Show loading spinner while fetching initial data
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
  
  // Show error if league or season not found
  if (hasAnyError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link 
              href={`/leagues/${leagueId}`}
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to League
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {errors.league ? 'League Not Found' : 'Season Not Found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {errors.league || errors.season}
            </p>
            <Link 
              href={`/leagues/${leagueId}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to League
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!leagueData || !currentSeason) {
    return null;
  }

  const statusDisplay = getStatusDisplay(currentSeason.status, currentSeason.is_current);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href={`/leagues/${leagueId}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {leagueData.name}
          </Link>
        </div>

        {/* Season Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {title || `${leagueData.name} - ${currentSeason.display_name}`}
                </h1>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                  {statusDisplay.text}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {currentSeason.description || leagueData.description || 'Professional football league'}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {currentSeason.display_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDateOnly(currentSeason.start_date)} - {formatDateOnly(currentSeason.end_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {leagueData.teamCount} Teams
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Tab Navigation */}
        {availableTabs.length > 1 && (
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {availableTabs.map((tab) => {
                  const TabIcon = tabConfig[tab]?.icon;
                  const label = tabConfig[tab]?.label || tab;
                  
                  return (
                    <button
                      key={tab}
                      onClick={() => onTabChange?.(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {TabIcon && <TabIcon className="w-4 h-4" />}
                        {label}
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