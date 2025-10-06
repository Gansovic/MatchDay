/**
 * Featured Leagues Component
 * 
 * Copa Facil-style featured leagues section for homepage.
 * Shows prominently featured leagues with instant join capability.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Users, 
  MapPin, 
  Calendar,
  Star,
  Zap,
  ChevronRight
} from 'lucide-react';
import { LeagueDiscovery as LeagueDiscoveryType } from '@matchday/database';

interface FeaturedLeaguesProps {
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

const FeaturedLeagueCard: React.FC<{
  league: LeagueDiscoveryType;
  onJoin: (league: LeagueDiscoveryType) => void;
}> = ({ league, onJoin }) => {
  const registrationDeadline = league.registration_deadline 
    ? new Date(league.registration_deadline) 
    : null;
  const isDeadlineSoon = registrationDeadline && 
    (registrationDeadline.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Featured Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
            <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-current" />
          </div>
          <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
            Featured
          </span>
        </div>
        
        {league.auto_approve_teams && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
            <Zap className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Instant Join
            </span>
          </div>
        )}
      </div>

      {/* League Info */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {league.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
          {league.description}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {league.teamCount}
          </div>
          <div className="text-xs text-gray-500">Teams</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {league.availableSpots}
          </div>
          <div className="text-xs text-gray-500">Spots Open</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">
            {league.league_type}
          </div>
          <div className="text-xs text-gray-500">Level</div>
        </div>
      </div>

      {/* Location & Deadline */}
      <div className="space-y-2 mb-4">
        {league.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="w-4 h-4" />
            <span>{league.location}</span>
          </div>
        )}
        
        {registrationDeadline && (
          <div className={`flex items-center gap-2 text-sm ${
            isDeadlineSoon 
              ? 'text-orange-600 dark:text-orange-400' 
              : 'text-gray-600 dark:text-gray-300'
          }`}>
            <Calendar className="w-4 h-4" />
            <span>
              Registration closes {registrationDeadline.toLocaleDateString()}
              {isDeadlineSoon && ' (Soon!)'}
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => onJoin(league)}
        disabled={league.availableSpots === 0}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
          league.auto_approve_teams
            ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
        } ${league.availableSpots === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {league.availableSpots === 0 ? 'League Full' : 
         league.auto_approve_teams ? 'Join Instantly ⚡' : 'Request to Join'}
      </button>
    </div>
  );
};

export const FeaturedLeagues: React.FC<FeaturedLeaguesProps> = ({
  limit = 6,
  showViewAll = true,
  className = ''
}) => {
  const [leagues, setLeagues] = useState<LeagueDiscoveryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedLeagues = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/leagues?featured=true&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured leagues');
        }
        
        const result = await response.json();
        setLeagues(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedLeagues();
  }, [limit]);

  const handleJoinLeague = (league: LeagueDiscoveryType) => {
    // This would typically open a join modal or redirect
    console.log('Join league:', league.name);
    // For now, just log - this will be implemented in the registration flow
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">Failed to load featured leagues</div>
        <div className="text-gray-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <section className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Featured Leagues
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Discover top leagues accepting new teams
          </p>
        </div>
        
        {showViewAll && (
          <Link 
            href="/explore/leagues"
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Featured Leagues Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : leagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <FeaturedLeagueCard
              key={league.id}
              league={league}
              onJoin={handleJoinLeague}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Featured Leagues
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Check back soon for featured league opportunities!
          </p>
        </div>
      )}
    </section>
  );
};