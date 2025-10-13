/**
 * LeagueCard Component
 *
 * Enhanced league card with Copa Facil-inspired layout:
 * - Quick stats and status badges
 * - Mini standings preview (top 3 teams)
 * - Inline expansion for details
 * - Streamlined join flow
 */

'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Eye,
  UserPlus,
  Clock,
  Star,
  CheckCircle,
  PlayCircle
} from 'lucide-react';

export interface LeagueCardData {
  id: string;
  name: string;
  description?: string;
  sport_type: string;
  league_type: 'recreational' | 'competitive' | 'semi-pro';
  location?: string;
  season_start?: string;
  season_end?: string;
  max_teams?: number;
  entry_fee?: number;
  is_active: boolean;
  teamCount: number;
  availableSpots: number;
  status?: 'registration' | 'in_progress' | 'completed';
  currentSeason?: {
    id: string;
    name: string;
    status: string;
  };
  topTeams?: {
    id: string;
    name: string;
    team_color?: string;
    points?: number;
  }[];
  nextMatch?: {
    date: string;
    home_team: string;
    away_team: string;
  };
  userCanJoin?: boolean;
  userIsInLeague?: boolean;
}

interface LeagueCardProps {
  league: LeagueCardData;
  onJoin?: (leagueId: string) => void;
  onView?: (leagueId: string) => void;
  onExpand?: (leagueId: string) => void;
  isExpanded?: boolean;
  variant?: 'active' | 'explore'; // active = green theme (user's league), explore = blue theme
}

export const LeagueCard: React.FC<LeagueCardProps> = ({
  league,
  onJoin,
  onView,
  onExpand,
  isExpanded = false,
  variant = 'explore'
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  // Theme colors based on variant
  const themeColors = variant === 'active' ? {
    border: 'border-green-300 dark:border-green-800',
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    primaryButton: 'bg-green-600 hover:bg-green-700',
    badgeBase: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  } : {
    border: 'border-gray-200 dark:border-gray-700',
    bg: 'bg-white dark:bg-gray-800',
    primaryButton: 'bg-blue-600 hover:bg-blue-700',
    badgeBase: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'registration':
        return {
          label: 'Registration Open',
          color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
          icon: UserPlus
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
          icon: PlayCircle
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
          icon: CheckCircle
        };
      default:
        return {
          label: 'Active',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
          icon: PlayCircle
        };
    }
  };

  const getLeagueTypeConfig = (type: string) => {
    switch (type) {
      case 'recreational':
        return { label: 'Recreational', emoji: '🌟', gradient: 'from-blue-500 to-cyan-500' };
      case 'competitive':
        return { label: 'Competitive', emoji: '🔥', gradient: 'from-orange-500 to-red-500' };
      case 'semi-pro':
        return { label: 'Semi-Pro', emoji: '⚡', gradient: 'from-purple-500 to-pink-500' };
      default:
        return { label: 'League', emoji: '🏆', gradient: 'from-gray-500 to-gray-600' };
    }
  };

  const statusConfig = getStatusConfig(league.status);
  const typeConfig = getLeagueTypeConfig(league.league_type);
  const StatusIcon = statusConfig.icon;

  const handleToggleExpand = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (newExpanded && onExpand) {
      onExpand(league.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`${themeColors.bg} rounded-xl border-2 ${themeColors.border} hover:shadow-lg transition-all`}>
      {/* Main Card Content */}
      <div className="p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {league.name}
              </h3>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            </div>

            {league.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {league.description}
              </p>
            )}
          </div>

          {/* League Type Badge */}
          <div className={`ml-4 px-3 py-1 rounded-lg bg-gradient-to-r ${typeConfig.gradient} text-white text-sm font-medium flex items-center gap-1`}>
            <span>{typeConfig.emoji}</span>
            <span className="hidden sm:inline">{typeConfig.label}</span>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {league.teamCount}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {league.max_teams ? `/${league.max_teams}` : ''} Teams
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {league.league_type.split('-')[0]}
              </span>
            </div>
            <div className="text-xs text-gray-500">Level</div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {league.entry_fee ? `$${league.entry_fee}` : 'Free'}
              </span>
            </div>
            <div className="text-xs text-gray-500">Entry</div>
          </div>
        </div>

        {/* Location & Dates */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
          {league.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {league.location}
            </div>
          )}
          {league.season_start && league.season_end && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(league.season_start)} - {formatDate(league.season_end)}
            </div>
          )}
        </div>

        {/* Top Teams Preview (if available) */}
        {league.topTeams && league.topTeams.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Top Teams
            </div>
            <div className="flex items-center gap-2">
              {league.topTeams.slice(0, 3).map((team, index) => (
                <div key={team.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-xs font-bold text-gray-500">{index + 1}</span>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: team.team_color || '#6B7280' }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{team.name}</span>
                  {team.points !== undefined && (
                    <span className="text-xs font-medium text-gray-500">{team.points}pts</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Primary Action Button */}
          {league.userIsInLeague || variant === 'active' ? (
            <button
              onClick={() => onView?.(league.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 ${themeColors.primaryButton} text-white font-medium rounded-lg transition-colors`}
            >
              <Eye className="w-4 h-4" />
              View League
            </button>
          ) : league.userCanJoin && league.availableSpots > 0 ? (
            <button
              onClick={() => onJoin?.(league.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 ${themeColors.primaryButton} text-white font-medium rounded-lg transition-colors`}
            >
              <UserPlus className="w-4 h-4" />
              Join League
            </button>
          ) : (
            <button
              onClick={() => onView?.(league.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={handleToggleExpand}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            title={expanded ? 'Show less' : 'Show more'}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Section Placeholder */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Detailed information will be loaded here...
          </p>
        </div>
      )}
    </div>
  );
};
