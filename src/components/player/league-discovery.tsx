/**
 * League Discovery Component
 * 
 * Professional interface for players to find and join leagues.
 * Uses intelligent matching to suggest compatible leagues based on
 * player stats, location, and preferences.
 * 
 * @example
 * ```typescript
 * <LeagueDiscovery userId={userId} />
 * ```
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfessionalCard } from '@/components/ui/professional-card';
import { PlayerService, LeagueMatch } from '@/lib/services/player.service';
import { NumberFormatters } from '@/lib/utils/formatters';

interface LeagueDiscoveryProps {
  userId: string;
  className?: string;
}

interface SearchFilters {
  sportType: string;
  skillLevel: string;
  location: string;
  maxDistance: number;
  entryFeeRange: [number, number];
}

const LeagueCard: React.FC<{
  league: LeagueMatch;
  onJoinRequest: (leagueId: string) => void;
  isRequesting: boolean;
}> = ({ league, onJoinRequest, isRequesting }) => {
  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSkillLevelIcon = (level: string) => {
    switch (level) {
      case 'recreational': return '🌟';
      case 'competitive': return '🔥';
      case 'semi-pro': return '⚡';
      default: return '🏆';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {league.name}
            </h3>
            <span className="text-2xl">
              {getSkillLevelIcon(league.league_type)}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {league.description}
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(league.compatibility_score)}`}>
          {league.compatibility_score}% Match
        </div>
      </div>

      {/* League Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {league.sport_type.charAt(0).toUpperCase() + league.sport_type.slice(1)}
          </div>
          <div className="text-xs text-gray-500">Sport</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">
            {league.league_type}
          </div>
          <div className="text-xs text-gray-500">Level</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {league.current_teams}/{league.max_teams}
          </div>
          <div className="text-xs text-gray-500">Teams</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {NumberFormatters.formatCurrency(league.entry_fee)}
          </div>
          <div className="text-xs text-gray-500">Entry Fee</div>
        </div>
      </div>

      {/* Location & Schedule */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span>📍</span>
          <span>{league.location}</span>
          {league.distance_km && (
            <span className="text-blue-600">• {league.distance_km.toFixed(1)}km away</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span>📅</span>
          <span>
            {new Date(league.season_start).toLocaleDateString()} - {new Date(league.season_end).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Compatibility Indicators */}
      <div className="flex gap-2 mb-4">
        {league.skill_level_match && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            ✓ Skill Match
          </span>
        )}
        {league.schedule_compatibility && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            ✓ Schedule Fit
          </span>
        )}
        {league.available_spots > 0 && (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            {league.available_spots} Spots Available
          </span>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => onJoinRequest(league.id)}
        disabled={isRequesting || league.available_spots === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
      >
        {isRequesting ? 'Requesting...' : 
         league.available_spots === 0 ? 'League Full' : 'Request to Join'}
      </button>
    </div>
  );
};

export const LeagueDiscovery: React.FC<LeagueDiscoveryProps> = ({
  userId,
  className = ''
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    sportType: '',
    skillLevel: '',
    location: '',
    maxDistance: 50,
    entryFeeRange: [0, 500]
  });
  
  const [requestingLeague, setRequestingLeague] = useState<string | null>(null);

  const { data: compatibleLeagues, isLoading, refetch } = useQuery({
    queryKey: ['compatible-leagues', userId, filters],
    queryFn: () => PlayerService.getInstance().findCompatibleLeagues(userId, {
      sportType: filters.sportType || undefined,
      maxDistance: filters.maxDistance,
      skillLevel: filters.skillLevel || undefined,
      location: filters.location || undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleJoinRequest = async (leagueId: string) => {
    if (requestingLeague) return;
    
    setRequestingLeague(leagueId);
    try {
      await PlayerService.getInstance().submitJoinRequest(leagueId, userId, 
        'I would like to join this league and contribute to the team!');
      
      // Refetch to update available spots
      refetch();
      
      // Show success message (you might want to add a toast notification here)
      alert('Join request submitted successfully!');
    } catch (error) {
      console.error('Failed to submit join request:', error);
      alert('Failed to submit join request. Please try again.');
    } finally {
      setRequestingLeague(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Discover Leagues
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Find the perfect league that matches your skill level, location, and schedule. 
          Our smart matching algorithm suggests leagues tailored just for you.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filter Leagues
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sport Type
            </label>
            <select
              value={filters.sportType}
              onChange={(e) => setFilters(prev => ({ ...prev, sportType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Sports</option>
              <option value="soccer">Soccer</option>
              <option value="basketball">Basketball</option>
              <option value="volleyball">Volleyball</option>
              <option value="softball">Softball</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Skill Level
            </label>
            <select
              value={filters.skillLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, skillLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Levels</option>
              <option value="recreational">Recreational</option>
              <option value="competitive">Competitive</option>
              <option value="semi-pro">Semi-Professional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City or ZIP code"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Distance (km)
            </label>
            <select
              value={filters.maxDistance}
              onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64 animate-pulse"></div>
          ))}
        </div>
      ) : compatibleLeagues && compatibleLeagues.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {compatibleLeagues.length} Compatible Leagues Found
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Sorted by compatibility score
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {compatibleLeagues.map((league) => (
              <LeagueCard
                key={league.id}
                league={league}
                onJoinRequest={handleJoinRequest}
                isRequesting={requestingLeague === league.id}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No leagues found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Try adjusting your search filters to find more options.
          </p>
          <button
            onClick={() => setFilters({
              sportType: '',
              skillLevel: '',
              location: '',
              maxDistance: 50,
              entryFeeRange: [0, 500]
            })}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};