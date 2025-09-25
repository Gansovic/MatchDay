/**
 * League Discovery Component
 * 
 * Simple interface for browsing all available leagues.
 * Displays all active leagues without filtering functionality.
 * 
 * @example
 * ```typescript
 * <LeagueDiscovery userId={userId} />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { LeagueDiscovery as LeagueDiscoveryType } from '@/lib/types/database.types';
import { NumberFormatters } from '@/lib/utils/formatters';
import { JoinLeagueModal } from '@/components/league/JoinLeagueModal';

interface LeagueDiscoveryProps {
  userId?: string;
  className?: string;
}


const LeagueCard: React.FC<{
  league: LeagueDiscoveryType;
  onJoinRequest: (league: LeagueDiscoveryType) => void;
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
        
        {league.compatibilityScore && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(league.compatibilityScore)}`}>
            {league.compatibilityScore}% Match
          </div>
        )}
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
            {league.teamCount}/{league.max_teams || 'No limit'}
          </div>
          <div className="text-xs text-gray-500">Teams</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {league.entry_fee ? NumberFormatters.formatCurrency(league.entry_fee) : 'Free'}
          </div>
          <div className="text-xs text-gray-500">Entry Fee</div>
        </div>
      </div>

      {/* Location & Schedule */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span>📍</span>
          <span>{league.location || 'Location TBD'}</span>
        </div>
        
        {league.season_start && league.season_end && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>📅</span>
            <span>
              {new Date(league.season_start).toLocaleDateString()} - {new Date(league.season_end).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* League Indicators */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {league.featured && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
            ⭐ Featured
          </span>
        )}
        {league.auto_approve_teams && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            ⚡ Instant Join
          </span>
        )}
        {league.registration_deadline && (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
            📅 Deadline: {new Date(league.registration_deadline).toLocaleDateString()}
          </span>
        )}
        {league.compatibilityScore && league.compatibilityScore > 70 && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            ✓ Great Match
          </span>
        )}
        {league.availableSpots > 0 && (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            {league.availableSpots} Spots Available
          </span>
        )}
        {league.playerCount > 0 && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {league.playerCount} Players
          </span>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => onJoinRequest(league)}
        disabled={isRequesting || league.availableSpots === 0 || league.isUserMember}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          league.auto_approve_teams 
            ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400' 
            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'
        } text-white`}
      >
        {isRequesting ? 'Loading...' : 
         league.isUserMember ? 'Already Member' :
         league.availableSpots === 0 ? 'League Full' : 
         league.auto_approve_teams ? 'Join Instantly ⚡' : 'Request to Join'}
      </button>
    </div>
  );
};

export const LeagueDiscovery: React.FC<LeagueDiscoveryProps> = ({
  userId,
  className = ''
}) => {
  
  const [requestingLeague, setRequestingLeague] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<LeagueDiscoveryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<LeagueDiscoveryType | null>(null);

  // Fetch leagues using the new API
  useEffect(() => {
    const fetchLeagues = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the new leagues API endpoint
        const response = await fetch('/api/leagues');
        
        if (!response.ok) {
          throw new Error('Failed to fetch leagues');
        }
        
        const result = await response.json();
        setLeagues(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagues();
  }, [userId]);

  const compatibleLeagues = leagues;

  const handleJoinRequest = async (league: LeagueDiscoveryType) => {
    if (requestingLeague) return;
    
    setSelectedLeague(league);
    setShowJoinModal(true);
  };

  const handleRequestSent = () => {
    // Optionally refresh the leagues list or show a success message
    setShowJoinModal(false);
    setSelectedLeague(null);
    // Could show a toast notification here
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Discover Leagues
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Browse all available leagues and find the perfect match for your team.
        </p>
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
              {compatibleLeagues.length} Leagues Available
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              All active leagues
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
            No leagues are currently available. Check back later for new opportunities!
          </p>
        </div>
      )}

      {/* Join League Modal */}
      {selectedLeague && (
        <JoinLeagueModal
          isOpen={showJoinModal}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedLeague(null);
          }}
          league={selectedLeague}
          onRequestSent={handleRequestSent}
        />
      )}
    </div>
  );
};